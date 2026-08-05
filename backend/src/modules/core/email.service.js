'use strict';

const nodemailer = require('nodemailer');
const mailConfig = require('../../database/config/mail');
const { renderEmailTemplate } = require('../../shared/helpers/email.helper');
const logger = require('../../shared/utils/logger');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: mailConfig.host,
      port: mailConfig.port,
      secure: mailConfig.secure,
      auth: { user: mailConfig.auth.user, pass: mailConfig.auth.pass },
    });
  }

  async send({ to, subject, templateName, variables = {}, html = null }) {
    try {
      const htmlContent = html || renderEmailTemplate(templateName, variables);
      const info = await this.transporter.sendMail({
        from: mailConfig.from.formatted,
        to,
        subject,
        html: htmlContent,
      });
      logger.info(`Email sent to ${to}: ${info.messageId}`);
      return info;
    } catch (err) {
      logger.error(`Failed to send email to ${to}:`, err);
      throw err;
    }
  }

  async sendWelcome(user, verificationUrl) {
    return this.send({
      to: user.email,
      subject: 'Welcome! Please verify your email',
      templateName: 'welcome',
      variables: { name: user.firstName, verificationUrl },
    });
  }

  async sendVerification(user, verificationUrl) {
    return this.send({
      to: user.email,
      subject: 'Verify your email address',
      templateName: 'verification',
      variables: { name: user.firstName, verificationUrl },
    });
  }

  async sendPasswordReset(user, resetUrl) {
    return this.send({
      to: user.email,
      subject: 'Reset your password',
      templateName: 'password-reset',
      variables: { name: user.firstName, resetUrl, expiresIn: '1 hour' },
    });
  }
}

module.exports = new EmailService();
