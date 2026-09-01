'use strict';

const multer = require('multer');
const ApiError = require('../../shared/utils/ApiError');
const ApiResponse = require('../../shared/utils/ApiResponse');
const logger = require('../../shared/utils/logger');
const { HTTP_STATUS } = require('../../shared/constants/httpStatus');

/**
 * Global Error Handling Middleware.
 * Must be the LAST middleware registered in app.js.
 *
 * Distinguishes between:
 *  - Operational errors (ApiError instances) — return clean JSON
 *  - Programmer errors — log full stack, return 500
 *  - Sequelize errors — map to appropriate HTTP codes
 */
// eslint-disable-next-line no-unused-vars
const errorMiddleware = (err, req, res, next) => {
  const requestId = req.requestId || 'unknown';

  if (err instanceof multer.MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE'
      ? 'Image size must not exceed 10 MB.'
      : 'Image upload could not be processed.';
    logger.warn(`[${requestId}] Image upload rejected: ${err.code}`);
    return res.status(HTTP_STATUS.BAD_REQUEST).json(ApiResponse.error(message));
  }

  // ─── Sequelize Validation Error ──────────────────────────────────────────
  if (err.name === 'SequelizeValidationError') {
    const errors = err.errors.map((e) => ({ field: e.path, message: e.message }));
    return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json(
      ApiResponse.error('Validation error', errors),
    );
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = err.errors?.[0]?.path;
    return res.status(HTTP_STATUS.CONFLICT).json(
      ApiResponse.error(`${field ? `${field} already exists` : 'Duplicate entry'}`),
    );
  }

  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(HTTP_STATUS.BAD_REQUEST).json(
      ApiResponse.error('Invalid reference: related resource does not exist'),
    );
  }

  if (err.name === 'SequelizeDatabaseError') {
    logger.error(`[${requestId}] Database error:`, { message: err.message, parent: err.parent?.message });
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      ApiResponse.error('Database query failed. Please contact support.'),
    );
  }

  if (err.name === 'SequelizeTimeoutError' || err.name === 'SequelizeConnectionError') {
    logger.error(`[${requestId}] Database connection/timeout error:`, { message: err.message });
    return res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json(
      ApiResponse.error('Service temporarily unavailable due to database overload.'),
    );
  }

  // ─── Operational Errors (ApiError) ───────────────────────────────────────
  if (err instanceof ApiError && err.isOperational) {
    logger.warn(`[${requestId}] Operational error ${err.statusCode}: ${err.message}`);
    return res.status(err.statusCode).json(
      ApiResponse.error(err.message, err.errors?.length ? err.errors : undefined),
    );
  }

  // ─── Unknown / Programmer Errors ─────────────────────────────────────────
  logger.error(`[${requestId}] Unhandled error:`, { message: err.message, stack: err.stack });

  return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
    ApiResponse.error(
      process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message,
    ),
  );
};

module.exports = errorMiddleware;
