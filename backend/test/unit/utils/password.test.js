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

  it('uses BCRYPT_SALT_ROUNDS from env if provided', async () => {
    process.env.BCRYPT_SALT_ROUNDS = '4'; // fast
    delete require.cache[require.resolve('../../../src/utils/password')];
    const { hashPassword: hp } = require('../../../src/utils/password');
    const hash = await hp('Password123');
    expect(hash).to.match(/^\$2[aby]\$04\$/);
    delete process.env.BCRYPT_SALT_ROUNDS;
    delete require.cache[require.resolve('../../../src/utils/password')];
  });
});