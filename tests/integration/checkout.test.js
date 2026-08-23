const httpStatus = require("http-status");
const supertest = require("supertest");

const app = require("../../src/app");

const {
  userOne,
  userTwo,
} = require("../fixtures/user.fixture");

const {
  cartWithProductsUserOne,
  emptyCart,
  cartWithProductsUserTwo,
} = require("../fixtures/cart.fixture");

const {
  User,
  Cart,
} = require("../../src/models");

const mockingoose = require("mockingoose").default;

const config = require("../config/config");

const {
  userOneAccessToken,
  userTwoAccessToken,
} = require("../fixtures/token.fixture");

describe("Cart routes", () => {
  beforeEach(() => {
    mockingoose.resetAll();
    jest.restoreAllMocks();
  });

  describe("Checkout", () => {
    it("should return 401 if access token is missing", async () => {
      const res = await supertest(app)
        .post("/v1/cart/checkout")
        .send();

      expect(res.statusCode).toEqual(
        httpStatus.UNAUTHORIZED
      );
    });

    it("should return 400 if cart is empty", async () => {
      const user = {
        ...userOne,
      };

      user.hasSetNonDefaultAddress =
        jest.fn().mockReturnValue(true);

      jest
        .spyOn(User, "findById")
        .mockResolvedValue(user);

      mockingoose(Cart).toReturn(
        emptyCart,
        "findOne"
      );

      const res = await supertest(app)
        .post("/v1/cart/checkout")
        .set(
          "Authorization",
          `Bearer ${userOneAccessToken}`
        )
        .send();

      expect(res.statusCode).toEqual(
        httpStatus.BAD_REQUEST
      );
    });

    it("should return 400 if user's address is not set", async () => {
      mockingoose(Cart).toReturn(
        cartWithProductsUserTwo,
        "findOne"
      );

      const userTwoWithoutAddress = {
        ...userTwo,
        address: config.default_address,
      };

      userTwoWithoutAddress.hasSetNonDefaultAddress =
        jest.fn().mockReturnValue(false);

      jest
        .spyOn(User, "findOne")
        .mockResolvedValue(
          userTwoWithoutAddress
        );

      const res = await supertest(app)
        .post("/v1/cart/checkout")
        .set(
          "Authorization",
          `Bearer ${userTwoAccessToken}`
        )
        .send();

      expect(res.statusCode).toEqual(
        httpStatus.BAD_REQUEST
      );
    });

    it("should return 400 if not enough wallet balance", async () => {
      mockingoose(Cart).toReturn(
        cartWithProductsUserOne,
        "findOne"
      );

      const userOneWithZeroBalance = {
        ...userOne,
        walletMoney: 0,
      };

      userOneWithZeroBalance.hasSetNonDefaultAddress =
        jest.fn().mockReturnValue(true);

      jest
        .spyOn(User, "findOne")
        .mockResolvedValue(
          userOneWithZeroBalance
        );

      const res = await supertest(app)
        .post("/v1/cart/checkout")
        .set(
          "Authorization",
          `Bearer ${userOneAccessToken}`
        )
        .send();

      expect(res.statusCode).toEqual(
        httpStatus.BAD_REQUEST
      );
    });

    it("should return 204 if cart is valid", async () => {
      mockingoose(Cart).toReturn(
        cartWithProductsUserOne,
        "findOne"
      );

      const userOneFinal = {
        ...userOne,
        walletMoney: 1000,
      };

      userOneFinal.hasSetNonDefaultAddress =
        jest.fn().mockReturnValue(true);

      userOneFinal.save = jest.fn();

      const cartSaveMock = (cart) => {
        expect(cart.cartItems.length).toEqual(0);
        return cart;
      };

      mockingoose(Cart).toReturn(
        cartSaveMock,
        "save"
      );

      jest
        .spyOn(User, "findOne")
        .mockResolvedValue(
          userOneFinal
        );

      jest
        .spyOn(User, "findById")
        .mockResolvedValue(
          userOneFinal
        );

      const res = await supertest(app)
        .post("/v1/cart/checkout")
        .set(
          "Authorization",
          `Bearer ${userOneAccessToken}`
        )
        .send();

      expect(res.statusCode).toEqual(
        httpStatus.NO_CONTENT
      );

      expect(
        userOneFinal.save
      ).toHaveBeenCalled();

      expect(
        userOneFinal.hasSetNonDefaultAddress
      ).toHaveBeenCalled();
    });
  });
});