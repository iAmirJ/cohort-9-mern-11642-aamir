const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');

const PG_UNIQUE_VIOLATION = '23505';

function normalizeError(err) {
  if (err instanceof ApiError) {
    return err;
  }
  // Defense in depth: service layer already checks for an existing email
  // before inserting, but two simultaneous registrations can both pass
  // that check and race to INSERT. The DB's UNIQUE constraint is the real
  // safety net — this converts that low-level PG error into a clean 409.
  if (err.code === PG_UNIQUE_VIOLATION) {
    return new ApiError(409, 'An account with this email already exists');
  }
  return err;
}

function errorHandler(err, req, res, next) {
  const normalized = normalizeError(err);
  const statusCode = normalized.statusCode || 500;
  const message = normalized.isOperational ? normalized.message : 'Internal server error';
  const details = normalized.isOperational ? normalized.details : undefined;

  const logMethod = statusCode >= 500 ? 'error' : 'warn';
  logger[logMethod]({ err: normalized }, message);

  res.status(statusCode).json({
    success: false,
    message,
    ...(details && { details }),
  });
}

module.exports = errorHandler;