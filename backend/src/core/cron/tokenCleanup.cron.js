'use strict';

const tokenRepository = require('../../repositories/token.repository');
const logger = require('../../shared/utils/logger');

/**
 * Deletes all expired tokens from the database.
 * Runs nightly via cron scheduler.
 */
const tokenCleanupCron = async () => {
  try {
    const deleted = await tokenRepository.deleteExpiredTokens();
    logger.info(`[CRON] Token cleanup: deleted ${deleted} expired tokens`);
  } catch (err) {
    logger.error('[CRON] Token cleanup failed:', err);
  }
};

module.exports = tokenCleanupCron;
