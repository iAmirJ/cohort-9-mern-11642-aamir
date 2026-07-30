class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true; // marks "expected" errors vs. bugs
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ApiError;