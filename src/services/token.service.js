const jwt = require("jsonwebtoken");
const moment = require("moment");

const config = require("../config/config");

const {
  tokenTypes,
} = require("../config/tokens");

/*
 * Generate JWT token.
 */
const generateToken = (
  userId,
  expires,
  type,
  secret = config.jwt.secret
) => {
  const payload = {
    sub: userId.toString(),
    iat: moment().unix(),
    exp: expires,
    type,
  };

  return jwt.sign(
    payload,
    secret
  );
};

/*
 * Generate access token.
 */
const generateAuthTokens =
  async (user) => {
    const accessTokenExpires =
      moment()
        .add(
          config.jwt
            .accessExpirationMinutes,
          "minutes"
        )
        .unix();

    const accessToken =
      generateToken(
        user._id,
        accessTokenExpires,
        tokenTypes.ACCESS
      );

    return {
      access: {
        token:
          accessToken,

        expires:
          moment
            .unix(
              accessTokenExpires
            )
            .toDate(),
      },
    };
  };

/*
 * Verify JWT token.
 */
const verifyToken = async (
  token,
  type,
  secret = config.jwt.secret
) => {
  try {
    const payload =
      jwt.verify(
        token,
        secret
      );

    if (
      !payload ||
      !payload.sub ||
      payload.type !== type
    ) {
      return null;
    }

    const {
      User,
    } = require("../models");

    const user =
      await User.findById(
        payload.sub
      );

    if (!user) {
      return null;
    }

    return {
      token,
      user,
      type,
      expires:
        moment
          .unix(payload.exp)
          .toDate(),
    };
  } catch (error) {
    return null;
  }
};

module.exports = {
  generateToken,
  generateAuthTokens,
  verifyToken,
};