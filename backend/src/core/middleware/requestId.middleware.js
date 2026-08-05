'use strict';

const { v4: uuidv4 } = require('uuid');

/**
 * Request ID Middleware.
 * Injects a UUID into every request for distributed tracing.
 * Reads X-Request-ID from incoming header if present (for proxy/gateway forwarding).
 * Exposes it back on the response header.
 */
const requestIdMiddleware = (req, res, next) => {
  const requestId = req.headers['x-request-id'] || uuidv4();
  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
};

module.exports = requestIdMiddleware;
