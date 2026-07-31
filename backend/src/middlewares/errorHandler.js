const logger = require('../utils/logger');

function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'Internal server error';
  const details = err.isOperational ? err.details : undefined;

  const logMethod = statusCode >= 500 ? 'error' : 'warn';
  logger[logMethod]({ err }, message);

  res.status(statusCode).json({
    success: false,
    message,
    ...(details && { details }),
  });
}

module.exports = errorHandler;