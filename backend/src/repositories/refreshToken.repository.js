const pool = require('../config/db');

async function createRefreshToken({ userId, tokenHash, expiresAt, userAgent, ipAddress }) {
  const { rows } = await pool.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, user_agent, ip_address)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, user_id, expires_at, created_at`,
    [userId, tokenHash, expiresAt, userAgent, ipAddress]
  );
  return rows[0];
}

async function revokeByHash(tokenHash) {
  const { rows } = await pool.query(
    `UPDATE refresh_tokens
     SET revoked_at = now()
     WHERE token_hash = $1 AND revoked_at IS NULL
     RETURNING id`,
    [tokenHash]
  );
  return rows[0] || null;
}

async function findActiveByHash(tokenHash) {
  const { rows } = await pool.query(
    `SELECT id, user_id, expires_at
     FROM refresh_tokens
     WHERE token_hash = $1 AND revoked_at IS NULL AND expires_at > now()`,
    [tokenHash]
  );
  return rows[0] || null;
}

module.exports = { createRefreshToken, revokeByHash, findActiveByHash };