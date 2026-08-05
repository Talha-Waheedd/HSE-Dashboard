'use strict';

const config = require('./index');

module.exports = {
  host: config.mail.host,
  port: config.mail.port,
  secure: config.mail.secure,
  auth: {
    user: config.mail.user,
    pass: config.mail.password,
  },
  from: {
    name: config.mail.fromName,
    email: config.mail.fromEmail,
    formatted: `"${config.mail.fromName}" <${config.mail.fromEmail}>`,
  },
  sendgridApiKey: config.mail.sendgridApiKey,
};
