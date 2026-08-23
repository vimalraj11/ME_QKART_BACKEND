const mongoose = require("mongoose");

const cartItemSchema = mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  {
    _id: true,
  }
);

const cartSchema = mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
    },

    paymentOption: {
      type: String,
      required: true,
      default: "PAYMENT_OPTION_DEFAULT",
    },

    cartItems: {
      type: [cartItemSchema],
      default: [],
    },
  },
  {
    timestamps: false,
  }
);

const Cart =
  mongoose.models.Cart ||
  mongoose.model("Cart", cartSchema);

module.exports = Cart;