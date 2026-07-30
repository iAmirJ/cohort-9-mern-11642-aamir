const asyncHandler = require('../utils/asyncHandler');
const authService = require('../services/auth.service');
const { successResponse } = require('../utils/apiResponse');

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const user = await authService.registerUser({ name, email, password });
  return successResponse(res, 201, 'User registered successfully', user);
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const { user, accessToken, refreshToken } = await authService.loginUser({
    email,
    password,
    userAgent: req.get('user-agent'),
    ipAddress: req.ip,
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: 'strict',
    maxAge: (parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS, 10) || 30) * 24 * 60 * 60 * 1000,
    path: '/api/auth', // browser only attaches this cookie on requests to /api/auth/*
  });

  return successResponse(res, 200, 'Logged in successfully', { user, accessToken });
});

const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.cookies;
  await authService.logoutUser({ refreshToken });

  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: 'strict',
    path: '/api/auth',
  });

  return successResponse(res, 200, 'Logged out successfully');
});

const refresh = asyncHandler(async (req, res) => {
  const { accessToken, refreshToken } = await authService.refreshAccessToken({
    refreshToken: req.cookies.refreshToken,
    userAgent: req.get('user-agent'),
    ipAddress: req.ip,
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: 'strict',
    maxAge: (parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS, 10) || 30) * 24 * 60 * 60 * 1000,
    path: '/api/auth',
  });

  return successResponse(res, 200, 'Token refreshed successfully', { accessToken });
});

const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getCurrentUser(req.user.id);
  return successResponse(res, 200, 'Current user fetched', user);
});

module.exports = { register, login, logout, refresh, getMe };