'use strict';

const auditService = require('../../modules/audits/audit.service');

/**
 * Audit Logging Middleware.
 * Automatically logs an audit entry after a response is sent.
 *
 * @param {string} action - Audit action name (e.g., 'USER_LOGIN')
 * @param {string} resource - Resource type (e.g., 'users')
 * @returns Express middleware
 *
 * @example
 * router.delete('/users/:id', authenticate, auditLog('USER_DELETED', 'users'), handler);
 */
const auditLog = (action, resource = null) => (req, res, next) => {
  // Attach to 'finish' event so logging happens after response is sent
  res.on('finish', () => {
    auditService.log({
      userId: req.user?.id || null,
      action,
      resource,
      resourceId: req.params?.id || null,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      requestId: req.requestId,
      statusCode: res.statusCode,
    });
  });
  next();
};

module.exports = auditLog;
