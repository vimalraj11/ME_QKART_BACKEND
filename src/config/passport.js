const {
  Strategy: JwtStrategy,
  ExtractJwt,
} = require("passport-jwt");

const config =
  require("./config");

const {
  tokenTypes,
} = require("./tokens");

const {
  userService,
} = require("../services");

const jwtOptions = {
  secretOrKey:
    config.jwt.secret,

  jwtFromRequest:
    ExtractJwt.fromAuthHeaderAsBearerToken(),
};

const jwtVerify = async (
  payload,
  done
) => {
  try {
    /*
     * Payload missing.
     */
    if (!payload) {
      return done(
        null,
        false
      );
    }

    /*
     * Only access tokens are
     * accepted by auth middleware.
     */
    if (
      payload.type !==
      tokenTypes.ACCESS
    ) {
      return done(
        null,
        false
      );
    }

    /*
     * User id is mandatory.
     */
    if (!payload.sub) {
      return done(
        null,
        false
      );
    }

    /*
     * Find user from token subject.
     */
    const user =
      await userService.getUserById(
        payload.sub
      );

    /*
     * Token is valid but user
     * no longer exists.
     */
    if (!user) {
      return done(
        null,
        false
      );
    }

    return done(
      null,
      user
    );
  } catch (error) {
    return done(
      error,
      false
    );
  }
};

const jwtStrategy =
  new JwtStrategy(
    jwtOptions,
    jwtVerify
  );

module.exports = {
  jwtStrategy,
};
