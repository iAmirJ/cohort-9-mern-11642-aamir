const { expect } = require('chai');
const { hashPassword, comparePassword } = require('../../../src/utils/password');

describe('password utils', () => {
  it('hashes into a bcrypt hash, never the plain value', async () => {
    const hash = await hashPassword('Password123');
    expect(hash).to.not.equal('Password123');
    expect(hash).to.match(/^\$2[aby]\$/);
  });

  it('comparePassword returns true for the correct password', async () => {
    const hash = await hashPassword('Password123');
    expect(await comparePassword('Password123', hash)).to.be.true;
  });

  it('comparePassword returns false for the wrong password', async () => {
    const hash = await hashPassword('Password123');
    expect(await comparePassword('WrongPassword', hash)).to.be.false;
  });
});