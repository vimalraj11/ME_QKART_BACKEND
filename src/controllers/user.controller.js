const httpStatus = require("http-status");

const ApiError = require("../utils/ApiError");

const catchAsync = require("../utils/catchAsync");

const { userService } = require("../services");

const getUser = catchAsync(async (req, res) => {
  if (req.query.q === "address") {
    if (
      req.user._id.toString() !==
      req.params.userId
    ) {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        "User not found"
      );
    }

    const user =
      await userService.getUserAddressById(
        req.params.userId
      );

    if (!user) {
      throw new ApiError(
        httpStatus.NOT_FOUND,
        "User not found"
      );
    }

    return res.status(httpStatus.OK).send({
      address: user.address,
    });
  }

  const user = await userService.getUserById(
    req.params.userId
  );

  if (!user) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "User not found"
    );
  }

  if (
    req.user._id.toString() !==
    req.params.userId
  ) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "User not found"
    );
  }

  res.status(httpStatus.OK).send(user);
});

const setAddress = catchAsync(async (req, res) => {
  const user = await userService.getUserById(
    req.params.userId
  );

  if (!user) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "User not found"
    );
  }

  if (
    req.user._id.toString() !==
    req.params.userId
  ) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "User not found"
    );
  }

  const updatedUser =
    await userService.setAddress(
      user,
      req.body.address
    );

  res.status(httpStatus.OK).send({
    address: updatedUser.address,
  });
});

module.exports = {
  getUser,
  setAddress,
};
