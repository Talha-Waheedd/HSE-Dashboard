'use strict';

const config = require('./index');

module.exports = {
  access: {
    secret: config.jwt.accessSecret,
    expiresIn: config.jwt.accessExpiry,
  },
  refresh: {
    secret: config.jwt.refreshSecret,
    expiresIn: config.jwt.refreshExpiry,
  },
  verify: {
    secret: config.jwt.verifySecret,
    expiresIn: config.jwt.verifyExpiry,
  },
  reset: {
    secret: config.jwt.resetSecret,
    expiresIn: config.jwt.resetExpiry,
  },
};
