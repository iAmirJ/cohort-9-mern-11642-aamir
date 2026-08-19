const { expect } = require("chai");
const sinon = require("sinon");
const authService = require("../../../src/services/auth.service");
const userRepository = require("../../../src/repositories/user.repository");
const refreshTokenRepository = require("../../../src/repositories/refreshToken.repository");
const passwordUtils = require("../../../src/utils/password");
const jwtUtils = require("../../../src/utils/jwt");
const ApiError = require("../../../src/utils/ApiError");
const tokenUtils = require("../../../src/utils/token");

describe("auth.service", () => {
  afterEach(() => sinon.restore());

  describe("registerUser", () => {
    it("throws 409 if the email is already taken", async () => {
      sinon.stub(userRepository, "findByEmail").resolves({ id: "1" });

      try {
        await authService.registerUser({
          name: "A",
          email: "a@test.com",
          password: "Password123",
        });
        expect.fail("expected registerUser to throw");
      } catch (err) {
        expect(err).to.be.instanceOf(ApiError);
        expect(err.statusCode).to.equal(409);
      }
    });

    it("hashes the password and creates the user when email is free", async () => {
      sinon.stub(userRepository, "findByEmail").resolves(null);
      sinon.stub(passwordUtils, "hashPassword").resolves("hashed-value");
      const createStub = sinon
        .stub(userRepository, "createUser")
        .resolves({ id: "1", name: "A", email: "a@test.com" });

      await authService.registerUser({
        name: "A",
        email: "a@test.com",
        password: "Password123",
      });

      expect(
        createStub.calledWith({
          name: "A",
          email: "a@test.com",
          passwordHash: "hashed-value",
        }),
      ).to.be.true;
    });
  });

  describe("loginUser", () => {
    it("throws 401 with the same message for a missing user or a wrong password", async () => {
      sinon.stub(userRepository, "findByEmail").resolves(null);

      try {
        await authService.loginUser({
          email: "nobody@test.com",
          password: "x",
        });
        expect.fail("expected loginUser to throw");
      } catch (err) {
        expect(err.statusCode).to.equal(401);
        expect(err.message).to.equal("Invalid email or password");
      }
    });

    it("throws 403 for a deactivated account with the correct password", async () => {
      sinon
        .stub(userRepository, "findByEmail")
        .resolves({ id: "1", password_hash: "hash", status: "deactivated" });
      sinon.stub(passwordUtils, "comparePassword").resolves(true);

      try {
        await authService.loginUser({
          email: "a@test.com",
          password: "Password123",
        });
        expect.fail("expected loginUser to throw");
      } catch (err) {
        expect(err.statusCode).to.equal(403);
      }
    });

    it("returns tokens and public user fields on successful login", async () => {
      sinon.stub(userRepository, "findByEmail").resolves({
        id: "u1",
        name: "Aamir",
        email: "a@test.com",
        password_hash: "hash",
        status: "active",
        is_email_verified: true,
      });
      sinon.stub(passwordUtils, "comparePassword").resolves(true);
      sinon.stub(jwtUtils, "signAccessToken").returns("access-token");
      sinon
        .stub(tokenUtils, "generateRefreshToken")
        .returns("raw-refresh-token");
      sinon.stub(tokenUtils, "hashToken").returns("hashed-refresh-token");
      const createStub = sinon
        .stub(refreshTokenRepository, "createRefreshToken")
        .resolves({ id: "rt1" });

      const result = await authService.loginUser({
        email: "a@test.com",
        password: "Password123",
      });

      expect(result.accessToken).to.equal("access-token");
      expect(result.refreshToken).to.equal("raw-refresh-token");
      expect(result.user).to.deep.equal({
        id: "u1",
        name: "Aamir",
        email: "a@test.com",
        isEmailVerified: true,
      });
      expect(createStub.calledOnce).to.be.true;
    });
  });

  describe("logoutUser", () => {
    it("does nothing when no refresh token is provided — never throws", async () => {
      const revokeSpy = sinon.spy(refreshTokenRepository, "revokeByHash");
      await authService.logoutUser({ refreshToken: undefined });
      expect(revokeSpy.called).to.be.false;
    });

    it("revokes the hashed refresh token when one is provided", async () => {
      const revokeStub = sinon
        .stub(refreshTokenRepository, "revokeByHash")
        .resolves({ id: "1" });
      await authService.logoutUser({ refreshToken: "plain-token" });
      expect(revokeStub.calledOnce).to.be.true;
    });
  });

  describe("refreshAccessToken", () => {
    it("throws 401 when no refresh token cookie is present", async () => {
      try {
        await authService.refreshAccessToken({ refreshToken: undefined });
        expect.fail("expected to throw");
      } catch (err) {
        expect(err.statusCode).to.equal(401);
      }
    });

    it("throws 401 when the refresh token is not found or expired", async () => {
      sinon.stub(refreshTokenRepository, "findActiveByHash").resolves(null);
      try {
        await authService.refreshAccessToken({ refreshToken: "stale-token" });
        expect.fail("expected to throw");
      } catch (err) {
        expect(err.statusCode).to.equal(401);
      }
    });

    it("rotates the token: revokes the old one, issues a new access + refresh token", async () => {
      sinon
        .stub(refreshTokenRepository, "findActiveByHash")
        .resolves({ id: "1", user_id: "u1" });
      const revokeStub = sinon
        .stub(refreshTokenRepository, "revokeByHash")
        .resolves({ id: "1" });
      const createStub = sinon
        .stub(refreshTokenRepository, "createRefreshToken")
        .resolves({ id: "2" });
      sinon.stub(jwtUtils, "signAccessToken").returns("new-access-token");

      const result = await authService.refreshAccessToken({
        refreshToken: "valid-token",
      });

      expect(revokeStub.calledOnce).to.be.true;
      expect(createStub.calledOnce).to.be.true;
      expect(result.accessToken).to.equal("new-access-token");
    });
  });

  describe("getCurrentUser", () => {
    it("throws 404 when the user no longer exists", async () => {
      sinon.stub(userRepository, "findById").resolves(null);
      try {
        await authService.getCurrentUser("missing-id");
        expect.fail("expected to throw");
      } catch (err) {
        expect(err.statusCode).to.equal(404);
      }
    });

    it("returns the user when found", async () => {
      const fakeUser = { id: "u1", name: "Aamir", email: "a@test.com" };
      sinon.stub(userRepository, "findById").resolves(fakeUser);
      expect(await authService.getCurrentUser("u1")).to.deep.equal(fakeUser);
    });
  });
});
