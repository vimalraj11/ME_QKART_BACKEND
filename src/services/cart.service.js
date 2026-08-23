const httpStatus = require("http-status");

const {
  Cart,
  Product,
  User,
} = require("../models");

const ApiError = require("../utils/ApiError");

const config = require("../config/config");

/**
 * Get user email.
 */
const getUserEmail = (user) => {
  if (typeof user === "string") {
    return user;
  }

  return user.email;
};

/**
 * Get product id.
 */
const getProductId = (product) => {
  if (!product) {
    return null;
  }

  if (product._id) {
    return product._id;
  }

  return product;
};

/**
 * Get product document.
 */
const getCartProduct = async (product) => {
  if (!product) {
    return null;
  }

  if (
    typeof product === "object" &&
    product.cost !== undefined
  ) {
    return product;
  }

  const productId = getProductId(product);

  if (!productId) {
    return null;
  }

  return Product.findOne({
    _id: productId,
  });
};

/**
 * Populate cart products.
 */
const populateCartProducts = async (cart) => {
  if (!cart || !cart.cartItems) {
    return cart;
  }

  for (
    let i = 0;
    i < cart.cartItems.length;
    i += 1
  ) {
    const item = cart.cartItems[i];

    if (!item || !item.product) {
      continue;
    }

    if (
      typeof item.product === "object" &&
      item.product.cost !== undefined
    ) {
      continue;
    }

    const product = await Product.findOne({
      _id: getProductId(item.product),
    });

    if (product) {
      item.product = product;
    }
  }

  return cart;
};

/**
 * GET CART
 */
const getCartByUser = async (user) => {
  const email = getUserEmail(user);

  const cart = await Cart.findOne({
    email,
  });

  if (!cart) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "Cart not found"
    );
  }

  await populateCartProducts(cart);

  return cart;
};

/**
 * ADD PRODUCT TO CART
 */
const addProductToCart = async (
  user,
  productId,
  quantity
) => {
  const email = getUserEmail(user);

  const product = await Product.findOne({
    _id: productId,
  });

  if (!product) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Product not found"
    );
  }

  let cart = await Cart.findOne({
    email,
  });

  if (!cart) {
    cart = await Cart.create({
      email,
      paymentOption:
        config.default_payment_option,
      cartItems: [],
    });

    if (!cart) {
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Unable to create cart"
      );
    }
  }

  const existingProduct =
    cart.cartItems.find((item) => {
      if (!item || !item.product) {
        return false;
      }

      const existingId =
        item.product._id
          ? item.product._id
          : item.product;

      return (
        existingId.toString() ===
        productId.toString()
      );
    });

  if (existingProduct) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Product already in cart"
    );
  }

  cart.cartItems.push({
    product: product,
    quantity,
  });

  await cart.save();

  return cart;
};

/**
 * UPDATE PRODUCT IN CART
 */
const updateProductInCart = async (
  user,
  productId,
  quantity
) => {
  const email = getUserEmail(user);

  const cart = await Cart.findOne({
    email,
  });

  if (!cart) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Cart not found"
    );
  }

  const productIndex =
    cart.cartItems.findIndex((item) => {
      if (!item || !item.product) {
        return false;
      }

      const existingId =
        item.product._id
          ? item.product._id
          : item.product;

      return (
        existingId.toString() ===
        productId.toString()
      );
    });

  if (productIndex === -1) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Product not found in cart"
    );
  }

  if (quantity === 0) {
    cart.cartItems.splice(
      productIndex,
      1
    );
  } else {
    cart.cartItems[
      productIndex
    ].quantity = quantity;
  }

  await cart.save();

  if (quantity !== 0) {
    const item =
      cart.cartItems[productIndex];

    if (
      item &&
      item.product &&
      !(
        typeof item.product === "object" &&
        item.product.cost !== undefined
      )
    ) {
      const product =
        await getCartProduct(
          item.product
        );

      if (product) {
        item.product = product;
      }
    }
  }

  return cart;
};

/**
 * DELETE PRODUCT FROM CART
 */
const deleteProductFromCart = async (
  user,
  productId
) => {
  const email = getUserEmail(user);

  const cart = await Cart.findOne({
    email,
  });

  if (!cart) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Cart not found"
    );
  }

  const productIndex =
    cart.cartItems.findIndex((item) => {
      if (!item || !item.product) {
        return false;
      }

      const existingId =
        item.product._id
          ? item.product._id
          : item.product;

      return (
        existingId.toString() ===
        productId.toString()
      );
    });

  if (productIndex === -1) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Product not found in cart"
    );
  }

  cart.cartItems.splice(
    productIndex,
    1
  );

  await cart.save();

  return cart;
};

/**
 * CHECKOUT
 */
const checkout = async (user) => {
  const email = getUserEmail(user);

  /*
   * Find user's cart.
   */
  const cart = await Cart.findOne({
    email,
  });

  if (!cart) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "User does not have a cart"
    );
  }

  /*
   * Cart must contain at least
   * one product.
   */
  if (
    !cart.cartItems ||
    cart.cartItems.length === 0
  ) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Cart is empty"
    );
  }

  /*
   * Get user object.
   *
   * Unit tests may pass a user
   * object directly.
   *
   * Integration flow may pass
   * the email.
   */
  let userObject = user;

  if (
    typeof userObject === "string"
  ) {
    userObject =
      await User.findOne({
        email,
      });
  }

  if (!userObject) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "User not found"
    );
  }

  /*
   * Validate address.
   */
  if (
    typeof userObject.hasSetNonDefaultAddress ===
    "function"
  ) {
    const hasAddress =
      await userObject.hasSetNonDefaultAddress();

    if (!hasAddress) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Address not set"
      );
    }
  } else if (
    userObject.address ===
    config.default_address
  ) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Address not set"
    );
  }

  /*
   * Calculate total cart value.
   */
  let total = 0;

  for (
    let i = 0;
    i < cart.cartItems.length;
    i += 1
  ) {
    const item = cart.cartItems[i];

    if (
      !item ||
      !item.product
    ) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Product not found"
      );
    }

    let product = item.product;

    /*
     * Product may already be
     * populated in cart.
     */
    if (
      !(
        typeof product === "object" &&
        product.cost !== undefined
      )
    ) {
      product =
        await Product.findOne({
          _id: getProductId(
            product
          ),
        });
    }

    if (!product) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Product not found"
      );
    }

    total +=
      product.cost *
      item.quantity;
  }

  /*
   * Validate wallet balance.
   */
  if (
    userObject.walletMoney <
    total
  ) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Insufficient wallet balance"
    );
  }

  /*
   * Deduct wallet amount.
   */
  userObject.walletMoney -= total;

  /*
   * Save updated user.
   */
  if (
    typeof userObject.save ===
    "function"
  ) {
    await userObject.save();
  }

  /*
   * Empty cart after
   * successful checkout.
   */
  cart.cartItems = [];

  await cart.save();

  return cart;
};

module.exports = {
  getCartByUser,
  addProductToCart,
  updateProductInCart,
  deleteProductFromCart,
  checkout,
};