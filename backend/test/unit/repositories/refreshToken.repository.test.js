const { expect } = require('chai');
const sinon = require('sinon');
const pool = require('../../../src/config/db');
const refreshTokenRepository = require('../../../src/repositories/refreshToken.repository');

describe('refreshToken.repository', () => {
  afterEach(() => sinon.restore());

  it('createRefreshToken inserts and returns the new row', async () => {
    const fakeRow = { id: '1', user_id: 'u1', expires_at: new Date() };
    sinon.stub(pool, 'query').resolves({ rows: [fakeRow] });

    const result = await refreshTokenRepository.createRefreshToken({
      userId: 'u1', tokenHash: 'hash', expiresAt: new Date(), userAgent: 'test', ipAddress: '127.0.0.1',
    });

    expect(result).to.deep.equal(fakeRow);
  });

  it('findActiveByHash returns null when nothing matches', async () => {
    sinon.stub(pool, 'query').resolves({ rows: [] });
    expect(await refreshTokenRepository.findActiveByHash('missing-hash')).to.be.null;
  });

  it('revokeByHash returns null when the token was already revoked (idempotency)', async () => {
    sinon.stub(pool, 'query').resolves({ rows: [] });
    expect(await refreshTokenRepository.revokeByHash('already-revoked-hash')).to.be.null;
  });
});