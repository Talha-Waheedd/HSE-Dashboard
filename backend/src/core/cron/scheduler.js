'use strict';

const cron = require('node-cron');
const logger = require('../../shared/utils/logger');

const tokenCleanupCron = require('./tokenCleanup.cron');

const initCron = () => {
  // Token cleanup — runs every day at midnight
  cron.schedule('0 0 * * *', async () => {
    logger.info('[CRON] Running token cleanup');
    try {
      await tokenCleanupCron();
      logger.info('[CRON] Token cleanup completed');
    } catch (error) {
      logger.error('[CRON] Token cleanup failed', { message: error.message, stack: error.stack });
    }
  });

  logger.info('⏰ Cron scheduler initialized');
};

module.exports = { initCron };
