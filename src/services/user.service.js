const { User } = require("../models");

const httpStatus = require("http-status");

const ApiError = require("../utils/ApiError");

/**
 * Get User by id
 */
const getUserById = async (id) => {
  return User.findById(id);
};

/**
 * Get user by email
 */
const getUserByEmail = async (email) => {
  return User.findOne({ email });
};
const getUserAddressById = async (id) => {
  return User.findOne(
    {
      _id: id,
    },
    {
      email: 1,
      address: 1,
    }
  );
};
const setAddress = async (user, address) => {
  user.address = address;

  await user.save();

  return user;
};
/**
 * Create a user
 */
const createUser = async (userBody) => {
  if (await User.isEmailTaken(userBody.email)) {
    throw new ApiError(httpStatus.OK, "Email already taken");
  }

  // Do NOT hash password here.
  // user.model.js pre-save hook handles password hashing.
  return User.create(userBody);
};

module.exports = {
  createUser,
  getUserById,
  getUserByEmail,
  getUserAddressById,
  setAddress,
};
