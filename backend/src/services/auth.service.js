const userRepository = require('../repositories/user.repository');
const { hashPassword, comparePassword } = require('../utils/password');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const refreshTokenRepository = require('../repositories/refreshToken.repository');
const { signAccessToken } = require('../utils/jwt');
const { generateRefreshToken, hashToken } = require('../utils/token');

const REFRESH_TOKEN_EXPIRES_DAYS = parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS, 10) || 30;

async function registerUser({ name, email, password }) {
  try {
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new ApiError(409, 'An account with this email already exists');
    }

    const passwordHash = await hashPassword(password);
    const user = await userRepository.createUser({ name, email, passwordHash });

    logger.info({ userId: user.id }, 'New user registered');

    return user;
  } catch (err) {
    if (err.code === '23505') {
      throw new ApiError(409, 'An account with this email already exists');
    }
    throw err;
  }
}


async function loginUser({ email, password, userAgent, ipAddress }) {
  try {
    const user = await userRepository.findByEmail(email);

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
      refreshToken,
    };
  } catch (err) {
    throw err;
  }
}

async function logoutUser({ refreshToken }) {
  try {
    if (!refreshToken) {
      return;
    }
    const tokenHash = hashToken(refreshToken);
    await refreshTokenRepository.revokeByHash(tokenHash);
  } catch (err) {
    throw err;
  }
}

async function refreshAccessToken({ refreshToken, userAgent, ipAddress }) {
  try {
    if (!refreshToken) {
      throw new ApiError(401, 'Refresh token missing');
    }

    const tokenHash = hashToken(refreshToken);
    const existing = await refreshTokenRepository.findActiveByHash(tokenHash);

    if (!existing) {
      throw new ApiError(401, 'Invalid or expired refresh token');
    }

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
  } catch (err) {
    throw err;
  }
}

async function getCurrentUser(userId) {
  try {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    return user;
  } catch (err) {
    throw err;
  }
}

module.exports = { registerUser, loginUser, logoutUser, refreshAccessToken, getCurrentUser };