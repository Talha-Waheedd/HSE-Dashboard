'use strict';

/**
 * XSS Sanitization Middleware.
 * Recursively strips script tags and dangerous HTML from all string values
 * in req.body, req.query, and req.params.
 */
const sanitizeValue = (value) => {
  if (typeof value === 'string') {
    return value
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '');
  }
  if (typeof value === 'object' && value !== null) {
    return Object.keys(value).reduce((acc, key) => {
      acc[key] = sanitizeValue(value[key]);
      return acc;
    }, Array.isArray(value) ? [] : {});
  }
  return value;
};

const sanitizeMiddleware = (req, res, next) => {
  if (req.body) req.body = sanitizeValue(req.body);
  if (req.query) req.query = sanitizeValue(req.query);
  if (req.params) req.params = sanitizeValue(req.params);
  next();
};

module.exports = sanitizeMiddleware;
