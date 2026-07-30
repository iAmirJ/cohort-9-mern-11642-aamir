const userRepository = require('../repositories/user.repository');
const { hashPassword, comparePassword } = require('../utils/password');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const refreshTokenRepository = require('../repositories/refreshToken.repository');
const { signAccessToken } = require('../utils/jwt');
const { generateRefreshToken, hashToken } = require('../utils/token');

const REFRESH_TOKEN_EXPIRES_DAYS = parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS, 10) || 30;

async function registerUser({ name, email, password }) {
  const existingUser = await userRepository.findByEmail(email);
  if (existingUser) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  const passwordHash = await hashPassword(password);
  const user = await userRepository.createUser({ name, email, passwordHash });

  logger.info({ userId: user.id }, 'New user registered');

  return user;
}


async function loginUser({ email, password, userAgent, ipAddress }) {
  const user = await userRepository.findByEmail(email);

  // Same error whether the email doesn't exist or the password is wrong —
  // never let an attacker distinguish "no such account" from "wrong password"
  if (!user || !(await comparePassword(password, user.password_hash))) {
    throw new ApiError(401, 'Invalid email or password');
  }

  if (user.status !== 'active') {
    throw new ApiError(403, 'This account has been deactivated');
  }

  const accessToken = signAccessToken({ sub: user.id });

  const refreshToken = generateRefreshToken();
  const refreshTokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000);

  await refreshTokenRepository.createRefreshToken({
    userId: user.id,
    tokenHash: refreshTokenHash,
    expiresAt,
    userAgent,
    ipAddress,
  });

  logger.info({ userId: user.id }, 'User logged in');

  return {
    user: { id: user.id, name: user.name, email: user.email, isEmailVerified: user.is_email_verified },
    accessToken,
    refreshToken, // the PLAIN value — only the controller touches this, to put it in a cookie
  };
}

async function logoutUser({ refreshToken }) {
  if (!refreshToken) {
    return; // nothing to revoke — treat it as already logged out
  }
  const tokenHash = hashToken(refreshToken);
  await refreshTokenRepository.revokeByHash(tokenHash);
}

async function refreshAccessToken({ refreshToken, userAgent, ipAddress }) {
  if (!refreshToken) {
    throw new ApiError(401, 'Refresh token missing');
  }

  const tokenHash = hashToken(refreshToken);
  const existing = await refreshTokenRepository.findActiveByHash(tokenHash);

  if (!existing) {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  // Rotation: the used token is burned, a new one takes its place.
  // If a stolen refresh token is ever replayed after the real user has
  // already rotated it, this lookup will simply fail — an early signal of theft.
  await refreshTokenRepository.revokeByHash(tokenHash);

  const newRefreshToken = generateRefreshToken();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000);

  await refreshTokenRepository.createRefreshToken({
    userId: existing.user_id,
    tokenHash: hashToken(newRefreshToken),
    expiresAt,
    userAgent,
    ipAddress,
  });

  const accessToken = signAccessToken({ sub: existing.user_id });

  return { accessToken, refreshToken: newRefreshToken };
}

async function getCurrentUser(userId) {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  return user;
}

module.exports = { registerUser, loginUser, logoutUser, refreshAccessToken, getCurrentUser };