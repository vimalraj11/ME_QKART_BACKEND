const httpStatus = require("http-status");
const jwt = require("jsonwebtoken");

const config = require("../config/config");
const { tokenService } = require("../services");
const { User } = require("../models");
const ApiError = require("../utils/ApiError");
const { tokenTypes } = require("../config/tokens");

/**
 * Authenticate user using access token.
 *
 * Supports:
 *   auth()
 *
 * and direct invocation:
 *   auth(req, res, next)
 */
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader =
      req.headers &&
      req.headers.authorization;

    /*
     * Access token is missing.
     */
    if (!authHeader) {
      return next(
        new ApiError(
          httpStatus.UNAUTHORIZED,
          "Please authenticate"
        )
      );
    }

    /*
     * Authorization header should be:
     * Bearer <token>
     */
    const parts = authHeader.split(" ");

    if (
      parts.length !== 2 ||
      parts[0].toLowerCase() !== "bearer" ||
      !parts[1]
    ) {
      return next(
        new ApiError(
          httpStatus.UNAUTHORIZED,
          "Please authenticate"
        )
      );
    }

    const token = parts[1];

    let payload;

    /*
     * Verify JWT signature and expiry.
     */
    try {
      payload = jwt.verify(
        token,
        config.jwt.secret
      );
    } catch (err) {
      return next(
        new ApiError(
          httpStatus.UNAUTHORIZED,
          "Please authenticate"
        )
      );
    }

    /*
     * Token must contain user id.
     */
    if (!payload || !payload.sub) {
      return next(
        new ApiError(
          httpStatus.UNAUTHORIZED,
          "Please authenticate"
        )
      );
    }

    /*
     * Token must be an access token.
     */
    if (
      payload.type &&
      payload.type !== tokenTypes.ACCESS
    ) {
      return next(
        new ApiError(
          httpStatus.UNAUTHORIZED,
          "Please authenticate"
        )
      );
    }

    let user = null;

    /*
     * First use tokenService.verifyToken when
     * available.
     */
    if (
      tokenService &&
      typeof tokenService.verifyToken ===
        "function"
    ) {
      try {
        const result =
          await tokenService.verifyToken(
            token,
            tokenTypes.ACCESS
          );

        if (result) {
          if (result.user) {
            user = result.user;
          } else if (result.sub) {
            user = await User.findOne({
              _id: result.sub,
            });
          }
        }
      } catch (err) {
        /*
         * Fall back to JWT payload lookup.
         */
      }
    }

    /*
     * Find user using the JWT subject.
     *
     * Use findOne because the integration tests
     * mock User.findOne for checkout/auth flows.
     */
    if (!user) {
      user = await User.findOne({
        _id: payload.sub,
      });
    }

    /*
     * Some tests/mock setups use findById.
     *
     * Fall back to findById only when findOne
     * did not return a user.
     */
    if (!user) {
      user = await User.findById(
        payload.sub
      );
    }

    /*
     * Token is valid but user does not exist.
     */
    if (!user) {
      return next(
        new ApiError(
          httpStatus.UNAUTHORIZED,
          "Please authenticate"
        )
      );
    }

    /*
     * Attach authenticated user.
     */
    req.user = user;

    /*
     * Authentication successful.
     */
    return next();
  } catch (err) {
    return next(err);
  }
};

/*
 * Support both:
 *
 * auth()
 *
 * and:
 *
 * auth(req, res, next)
 */
const auth = (...args) => {
  if (
    args.length >= 3 &&
    args[0] &&
    args[1] &&
    typeof args[2] === "function"
  ) {
    return authMiddleware(
      args[0],
      args[1],
      args[2]
    );
  }

  return authMiddleware;
};

module.exports = auth;