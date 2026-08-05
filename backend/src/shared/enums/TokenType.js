'use strict';

const TokenType = Object.freeze({
  ACCESS: 'access',
  REFRESH: 'refresh',
  EMAIL_VERIFY: 'email_verify',
  PASSWORD_RESET: 'password_reset',
});

module.exports = TokenType;
