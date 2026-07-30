const logger = require('../utils/logger');

function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'Internal server error';
  const details = err.isOperational ? err.details : undefined;

  logger.error({ err }, message);

  res.status(statusCode).json({
    success: false,
    message,
    ...(details && { details }),
  });
}

module.exports = errorHandler;