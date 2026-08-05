'use strict';

const emailService = require('../../../modules/core/email.service');
const logger = require('../../../shared/utils/logger');
const config = require('../../../database/config');

const sendPasswordResetHandler = async ({ user, token }) => {
  try {
    const resetUrl = `${config.clientUrl}/reset-password?token=${token}`;
    await emailService.sendPasswordReset(user, resetUrl);
  } catch (err) {
    logger.error('sendPasswordResetHandler error:', err);
  }
};

module.exports = sendPasswordResetHandler;
