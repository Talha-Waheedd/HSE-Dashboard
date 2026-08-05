'use strict';

const emailService = require('../../../modules/core/email.service');
const logger = require('../../../shared/utils/logger');
const config = require('../../../database/config');

/**
 * Handles 'user.registered' event.
 * Sends a welcome email with email verification link.
 */
const sendWelcomeEmailHandler = async ({ user, token }) => {
  try {
    const verificationUrl = `${config.appUrl}/api/v1/auth/verify-email?token=${token}`;
    await emailService.sendWelcome(user, verificationUrl);
  } catch (err) {
    logger.error('sendWelcomeEmailHandler error:', err);
  }
};

module.exports = sendWelcomeEmailHandler;
