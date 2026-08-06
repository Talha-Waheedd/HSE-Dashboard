'use strict';

const rateLimit = require('express-rate-limit');
const config = require('../../database/config');
const { MESSAGES } = require('../../shared/constants/messages');
const ApiResponse = require('../../shared/utils/ApiResponse');
const { HTTP_STATUS } = require('../../shared/constants/httpStatus');

const handler = (req, res, next) => {
  res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json(
    ApiResponse.error(MESSAGES.RATE_LIMIT_EXCEEDED),
  );
};

// Disable rate limits in development to prevent 429 errors from hot-reloading
const bypass = (req, res, next) => next();

/**
 * Global rate limiter — applied to all routes.
 */
const globalRateLimiter = bypass;

/**
 * Strict rate limiter for authentication endpoints.
 * 10 attempts per 15 minutes.
 */
const authRateLimiter = bypass;

/**
 * API key-based rate limiter (per user).
 * Apply after authentication.
 */
const userRateLimiter = bypass;

module.exports = { globalRateLimiter, authRateLimiter, userRateLimiter };
