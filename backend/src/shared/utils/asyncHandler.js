'use strict';

/**
 * Wraps an async route handler and forwards errors to Express error middleware.
 * Eliminates repetitive try/catch blocks in every controller.
 *
 * @param {Function} fn - Async controller function (req, res, next)
 * @returns {Function} Express middleware
 *
 * @example
 * router.get('/users', asyncHandler(UserController.getAll));
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
