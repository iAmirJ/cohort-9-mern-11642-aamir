const crypto = require('node:crypto');

function generateRefreshToken() {
  return crypto.randomBytes(32).toString('hex'); // 256 bits of randomness
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

module.exports = { generateRefreshToken, hashToken };