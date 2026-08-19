const { expect } = require('chai');
const { generateRefreshToken, hashToken } = require('../../../src/utils/token');

describe('token utils', () => {
  it('generates a different token every call', () => {
    const token1 = generateRefreshToken();
    const token2 = generateRefreshToken();
    expect(token1).to.not.equal(token2);
  });

  it('hashToken is deterministic for the same input', () => {
    const hash1 = hashToken('sample');
    const hash2 = hashToken('sample');
    expect(hash1).to.equal(hash2);
  });

  it('hashToken never contains the original token', () => {
    const originalText = 'sample';
    const hashedText = hashToken(originalText);
    expect(hashedText).to.not.include(originalText);
  });
});