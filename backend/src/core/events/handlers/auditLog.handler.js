'use strict';

const auditService = require('../../../modules/audits/audit.service');
const logger = require('../../../shared/utils/logger');

const auditLogHandler = async (data) => {
  try {
    await auditService.log(data);
  } catch (err) {
    logger.error('auditLogHandler error:', err);
  }
};

module.exports = auditLogHandler;
