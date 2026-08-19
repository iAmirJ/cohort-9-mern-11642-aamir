const { expect } = require('chai');
const { generateRefreshToken, hashToken } = require('../../../src/utils/token');

describe('token utils', () => {
  it('generates a different token every call', () => {
    expect(generateRefreshToken()).to.not.equal(generateRefreshToken());
  });

  it('hashToken is deterministic for the same input', () => {
    expect(hashToken('sample')).to.equal(hashToken('sample'));
  });

  it('hashToken never contains the original token', () => {
    expect(hashToken('sample')).to.not.include('sample');
  });
});