const express = require("express");

const auth = require("../../middlewares/auth");

const cartController =
  require("../../controllers/cart.controller");

const router = express.Router();

router
  .route("/")
  .get(
    auth(),
    cartController.getCart
  )
  .post(
    auth(),
    cartController.addProductToCart
  )
  .put(
    auth(),
    cartController.updateProductInCart
  )
  .delete(
    auth(),
    cartController.deleteProductFromCart
  );

router
  .route("/checkout")
  .post(
    auth(),
    cartController.checkout
  )
  .put(
    auth(),
    cartController.checkout
  );

module.exports = router;