const jwtUtils = require('../utils/jwt');
const ApiError = require('../utils/ApiError');

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return next(new ApiError(401, 'Authentication required'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwtUtils.verifyAccessToken(token);
    req.user = { id: payload.sub };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'Access token expired'));
    }
    return next(new ApiError(401, 'Invalid access token'));
  }
}

module.exports = authenticate;