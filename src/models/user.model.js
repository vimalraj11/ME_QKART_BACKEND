const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
      trim: true,
      minlength: 8,
    },

    address: {
      type: String,
      default: "ADDRESS_NOT_SET",
      trim: true,
    },

    walletMoney: {
      type: Number,
      default: 500,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre(
  "save",
  async function (next) {
    const user = this;

    if (!user.isModified("password")) {
      return next();
    }

    user.password =
      await bcrypt.hash(
        user.password,
        8
      );

    next();
  }
);

userSchema.statics.isEmailTaken =
  async function (
    email,
    excludeUserId
  ) {
    const user =
      await this.findOne({
        email,
        _id: {
          $ne: excludeUserId,
        },
      });

    return !!user;
  };

userSchema.methods.isPasswordMatch =
  async function (password) {
    return bcrypt.compare(
      password,
      this.password
    );
  };

userSchema.methods.hasSetNonDefaultAddress =
  function () {
    return (
      this.address !==
      "ADDRESS_NOT_SET"
    );
  };

const User =
  mongoose.models.User ||
  mongoose.model(
    "User",
    userSchema
  );

module.exports = User;