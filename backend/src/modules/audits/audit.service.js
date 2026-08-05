'use strict';

const auditRepository = require('../../repositories/audit.repository');
const logger = require('../../shared/utils/logger');

class AuditService {
  async log({ userId, action, resource, resourceId, oldValues, newValues, ipAddress, userAgent, requestId, statusCode }) {
    try {
      return await auditRepository.log({
        userId: userId || null,
        action,
        resource: resource || null,
        resourceId: resourceId ? String(resourceId) : null,
        oldValues: oldValues || null,
        newValues: newValues || null,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        requestId: requestId || null,
        statusCode: statusCode || null,
      });
    } catch (err) {
      // Audit failures must never break the main request flow
      logger.error('Audit log failed:', err);
    }
  }
}

module.exports = new AuditService();
