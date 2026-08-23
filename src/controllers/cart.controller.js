const httpStatus = require("http-status");

const catchAsync = require("../utils/catchAsync");
const { cartService } = require("../services");

/**
 * GET CART
 */
const getCart = catchAsync(async (req, res) => {
  const cart = await cartService.getCartByUser(req.user.email);

  return res.status(httpStatus.OK).send(cart);
});

/**
 * ADD PRODUCT TO CART
 */
const addProductToCart = catchAsync(async (req, res) => {
  const { productId, quantity } = req.body;

  if (!productId) {
    return res.status(httpStatus.BAD_REQUEST).send({
      code: httpStatus.BAD_REQUEST,
      message: "productId is required",
    });
  }

  if (quantity === undefined) {
    return res.status(httpStatus.BAD_REQUEST).send({
      code: httpStatus.BAD_REQUEST,
      message: "quantity is required",
    });
  }

  const cart = await cartService.addProductToCart(
    req.user,
    productId,
    quantity
  );

  return res.status(httpStatus.CREATED).send(cart);
});

/**
 * UPDATE PRODUCT IN CART
 */
const updateProductInCart = catchAsync(async (req, res) => {
  const { productId, quantity } = req.body;

  if (!productId) {
    return res.status(httpStatus.BAD_REQUEST).send({
      code: httpStatus.BAD_REQUEST,
      message: "productId is required",
    });
  }

  if (quantity === undefined) {
    return res.status(httpStatus.BAD_REQUEST).send({
      code: httpStatus.BAD_REQUEST,
      message: "quantity is required",
    });
  }

  const cart = await cartService.updateProductInCart(
    req.user,
    productId,
    quantity
  );

  if (quantity === 0) {
    return res.status(httpStatus.NO_CONTENT).send();
  }

  return res.status(httpStatus.OK).send(cart);
});

/**
 * DELETE PRODUCT FROM CART
 */
const deleteProductFromCart = catchAsync(async (req, res) => {
  const { productId } = req.body;

  if (!productId) {
    return res.status(httpStatus.BAD_REQUEST).send({
      code: httpStatus.BAD_REQUEST,
      message: "productId is required",
    });
  }

  await cartService.deleteProductFromCart(
    req.user,
    productId
  );

  return res.status(httpStatus.NO_CONTENT).send();
});

/**
 * CHECKOUT
 */
const checkout = catchAsync(async (req, res) => {
  await cartService.checkout(req.user);

  return res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  getCart,
  addProductToCart,
  updateProductInCart,
  deleteProductFromCart,
  checkout,
};