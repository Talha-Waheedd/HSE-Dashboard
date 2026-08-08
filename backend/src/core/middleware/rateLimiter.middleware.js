'use strict';

const rateLimit = require('express-rate-limit');
const config = require('../../database/config');
const { MESSAGES } = require('../../shared/constants/messages');
const ApiResponse = require('../../shared/utils/ApiResponse');
const { HTTP_STATUS } = require('../../shared/constants/httpStatus');

const handler = (req, res) => {
  res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json(
    ApiResponse.error(MESSAGES.RATE_LIMIT_EXCEEDED),
  );
};

const globalRateLimiter = rateLimit({
  windowMs: config.rateLimiter.windowMs,
  limit: config.rateLimiter.max,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler,
  skip: () => config.env === 'test',
});

const authRateLimiter = rateLimit({
  windowMs: config.rateLimiter.windowMs,
  limit: config.rateLimiter.authMax,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler,
  skip: () => config.env === 'test',
});

const userRateLimiter = rateLimit({
  windowMs: config.rateLimiter.windowMs,
  limit: config.rateLimiter.max,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip,
  handler,
  skip: () => config.env === 'test',
});

module.exports = { globalRateLimiter, authRateLimiter, userRateLimiter };
