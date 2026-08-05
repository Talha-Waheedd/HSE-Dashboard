'use strict';

const config = require('./index');

module.exports = {
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  db: config.redis.db,
  maxRetriesPerRequest: null, // Required by BullMQ
  enableReadyCheck: false,
  retryStrategy: (times) => Math.min(times * 100, 3000),
};
