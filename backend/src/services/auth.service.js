const userRepository = require('../repositories/user.repository');
const refreshTokenRepository = require('../repositories/refreshToken.repository');
const passwordUtils = require('../utils/password');
const jwtUtils = require('../utils/jwt');
const tokenUtils = require('../utils/token');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

const REFRESH_TOKEN_EXPIRES_DAYS = Number.parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS, 10) || 30;

async function registerUser({ name, email, password }) {
  const existingUser = await userRepository.findByEmail(email);
  if (existingUser) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  const passwordHash = await passwordUtils.hashPassword(password);
  const user = await userRepository.createUser({ name, email, passwordHash });

  logger.info({ userId: user.id }, 'New user registered');
  return user;
}

async function loginUser({ email, password, userAgent, ipAddress }) {
  const user = await userRepository.findByEmail(email);

  if (!user || !(await passwordUtils.comparePassword(password, user.password_hash))) {
    throw new ApiError(401, 'Invalid email or password');
  }

  if (user.status !== 'active') {
    throw new ApiError(403, 'This account has been deactivated');
  }

  const accessToken = jwtUtils.signAccessToken({ sub: user.id });

  const refreshToken = tokenUtils.generateRefreshToken();
  const refreshTokenHash = tokenUtils.hashToken(refreshToken);
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
    refreshToken,
  };
}

async function logoutUser({ refreshToken }) {
  if (!refreshToken) return;
  const tokenHash = tokenUtils.hashToken(refreshToken);
  await refreshTokenRepository.revokeByHash(tokenHash);
}

async function refreshAccessToken({ refreshToken, userAgent, ipAddress }) {
  if (!refreshToken) {
    throw new ApiError(401, 'Refresh token missing');
  }

  const tokenHash = tokenUtils.hashToken(refreshToken);
  const existing = await refreshTokenRepository.findActiveByHash(tokenHash);

  if (!existing) {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  await refreshTokenRepository.revokeByHash(tokenHash);

  const newRefreshToken = tokenUtils.generateRefreshToken();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000);

  await refreshTokenRepository.createRefreshToken({
    userId: existing.user_id,
    tokenHash: tokenUtils.hashToken(newRefreshToken),
    expiresAt,
    userAgent,
    ipAddress,
  });

  const accessToken = jwtUtils.signAccessToken({ sub: existing.user_id });

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