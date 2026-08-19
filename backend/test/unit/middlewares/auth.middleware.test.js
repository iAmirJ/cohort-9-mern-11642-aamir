const { expect } = require('chai');
const sinon = require('sinon');
const jwtUtils = require('../../../src/utils/jwt');
const authenticate = require('../../../src/middlewares/auth.middleware');

function mockReqRes(headers = {}) {
  const req = { headers };
  let nextArg;
  const next = (arg) => { nextArg = arg; };
  return { req, next, getNextArg: () => nextArg };
}

describe('auth.middleware', () => {
  afterEach(() => sinon.restore());

  it('calls next with a 401 ApiError when no Authorization header is present', () => {
    const { req, next, getNextArg } = mockReqRes({});
    authenticate(req, {}, next);
    expect(getNextArg().statusCode).to.equal(401);
  });

  it('attaches req.user and calls next() with no error on a valid token', () => {
    sinon.stub(jwtUtils, 'verifyAccessToken').returns({ sub: 'u1' });
    const { req, next, getNextArg } = mockReqRes({ authorization: 'Bearer valid-token' });

    authenticate(req, {}, next);

    expect(req.user).to.deep.equal({ id: 'u1' });
    expect(getNextArg()).to.be.undefined;
  });

  it('gives a distinct message for an expired token vs an invalid one', () => {
    const err = new Error('jwt expired');
    err.name = 'TokenExpiredError';
    sinon.stub(jwtUtils, 'verifyAccessToken').throws(err);

    const { req, next, getNextArg } = mockReqRes({ authorization: 'Bearer expired-token' });
    authenticate(req, {}, next);

    expect(getNextArg().message).to.equal('Access token expired');
  });
});