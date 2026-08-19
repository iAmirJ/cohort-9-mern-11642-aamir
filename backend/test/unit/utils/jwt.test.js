const { expect } = require('chai');
const jwt = require('jsonwebtoken');
const jwtUtils = require('../../../src/utils/jwt');

describe('jwt utils', () => {
  it('signAccessToken returns a well-formed JWT string', () => {
    const token = jwtUtils.signAccessToken({ sub: 'user-1' });
    expect(token).to.be.a('string');
    expect(token.split('.')).to.have.lengthOf(3);
  });

  it('verifyAccessToken decodes a token signed by signAccessToken and returns the original sub', () => {
    const token = jwtUtils.signAccessToken({ sub: 'user-1' });
    const payload = jwtUtils.verifyAccessToken(token);
    expect(payload.sub).to.equal('user-1');
  });

  it('verifyAccessToken throws for a garbage/tampered token', () => {
    expect(() => jwtUtils.verifyAccessToken('not.a.valid.token')).to.throw();
  });

  it('verifyAccessToken throws for a token signed with a different secret', () => {
    const fakeToken = jwt.sign({ sub: 'user-1' }, 'wrong-secret');
    expect(() => jwtUtils.verifyAccessToken(fakeToken)).to.throw();
  });
});