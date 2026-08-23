const express = require("express");
const cors = require("cors");
const httpStatus = require("http-status");
const passport = require("passport");

const routes = require("./routes/v1");
const {
  jwtStrategy,
} = require("./config/passport");

const ApiError = require("./utils/ApiError");

const app = express();

app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);

app.use(cors());

passport.use(
  "jwt",
  jwtStrategy
);

app.use(
  passport.initialize()
);

app.use(
  "/v1",
  routes
);

app.use(
  (req, res, next) => {
    next(
      new ApiError(
        httpStatus.NOT_FOUND,
        "Not found"
      )
    );
  }
);

app.use(
  (err, req, res, next) => {
    const statusCode =
      err.statusCode ||
      httpStatus.INTERNAL_SERVER_ERROR;

    res.status(statusCode).send({
      code: statusCode,
      message:
        err.message ||
        "Internal server error",
    });
  }
);

module.exports = app;