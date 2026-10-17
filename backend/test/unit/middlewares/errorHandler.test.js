const { expect } = require('chai');
const sinon = require('sinon');
const logger = require('../../../src/utils/logger');
const ApiError = require('../../../src/utils/ApiError');
const errorHandler = require('../../../src/middlewares/errorHandler');

function mockRes() {
  const res = {};
  res.statusCode = null;
  res.body = null;
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (payload) => { res.body = payload; return res; };
  return res;
}

describe('errorHandler', () => {
  afterEach(() => sinon.restore());

  it('passes an ApiError through unchanged — status, message, and details', () => {
    sinon.stub(logger, 'warn');
    const err = new ApiError(422, 'Validation failed', [{ path: 'email', msg: 'Must be a valid email address' }]);
    const res = mockRes();

    errorHandler(err, {}, res, () => {});

    expect(res.statusCode).to.equal(422);
    expect(res.body.success).to.be.false;
    expect(res.body.message).to.equal('Validation failed');
    expect(res.body.details).to.deep.equal([{ path: 'email', msg: 'Must be a valid email address' }]);
  });

  it('masks a non-operational error behind a generic 500 message', () => {
    sinon.stub(logger, 'error');
    const err = new Error('something exploded in the DB driver');
    const res = mockRes();

    errorHandler(err, {}, res, () => {});

    expect(res.statusCode).to.equal(500);
    expect(res.body.message).to.equal('Internal server error');
    expect(res.body.details).to.be.undefined;
  });

  it('normalizes a Postgres unique-violation (23505) into a clean 409', () => {
    sinon.stub(logger, 'warn');
    const pgErr = new Error('duplicate key value violates unique constraint');
    pgErr.code = '23505';
    const res = mockRes();

    errorHandler(pgErr, {}, res, () => {});

    expect(res.statusCode).to.equal(409);
    expect(res.body.message).to.equal('An account with this email already exists');
  });

  it('logs 5xx errors with logger.error and 4xx with logger.warn', () => {
    const errorSpy = sinon.stub(logger, 'error');
    const warnSpy = sinon.stub(logger, 'warn');

    errorHandler(new Error('boom'), {}, mockRes(), () => {});
    expect(errorSpy.calledOnce).to.be.true;
    expect(warnSpy.called).to.be.false;

    errorSpy.resetHistory();
    warnSpy.resetHistory();

    errorHandler(new ApiError(400, 'Bad request'), {}, mockRes(), () => {});
    expect(warnSpy.calledOnce).to.be.true;
    expect(errorSpy.called).to.be.false;
  });
});