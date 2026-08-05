'use strict';

const { HTTP_STATUS } = require('../constants/httpStatus');

/**
 * Custom operational error class.
 * Use this for all known/expected errors (validation, not-found, unauthorized).
 * The global error handler checks `isOperational` to distinguish these from programmer errors.
 */
class ApiError extends Error {
  /**
   * @param {string} message - Human-readable error message
   * @param {number} statusCode - HTTP status code
   * @param {Array} errors - Additional validation/field errors
   * @param {boolean} isOperational - True = expected error, False = programming error
   */
  constructor(message, statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, errors = [], isOperational = true) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }

  // ─── Factory Methods ────────────────────────────────────────────────────────
  static badRequest(message, errors = []) {
    return new ApiError(message, HTTP_STATUS.BAD_REQUEST, errors);
  }

  static unauthorized(message = 'Unauthorized') {
    return new ApiError(message, HTTP_STATUS.UNAUTHORIZED);
  }

  static forbidden(message = 'Forbidden') {
    return new ApiError(message, HTTP_STATUS.FORBIDDEN);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(message, HTTP_STATUS.NOT_FOUND);
  }

  static conflict(message = 'Resource already exists') {
    return new ApiError(message, HTTP_STATUS.CONFLICT);
  }

  static unprocessable(message, errors = []) {
    return new ApiError(message, HTTP_STATUS.UNPROCESSABLE_ENTITY, errors);
  }

  static tooManyRequests(message = 'Too many requests') {
    return new ApiError(message, HTTP_STATUS.TOO_MANY_REQUESTS);
  }

  static internal(message = 'Internal server error') {
    return new ApiError(message, HTTP_STATUS.INTERNAL_SERVER_ERROR, [], false);
  }
}

module.exports = ApiError;
