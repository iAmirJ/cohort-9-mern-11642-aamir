const bcrypt = require('bcrypt');

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12;

async function hashPassword(plainPassword) {
  try {
    return await bcrypt.hash(plainPassword, SALT_ROUNDS);
  } catch (err) {
    throw err;
  }
}

async function comparePassword(plainPassword, hash) {
  try {
    return await bcrypt.compare(plainPassword, hash);
  } catch (err) {
    throw err;
  }
}

module.exports = { hashPassword, comparePassword };