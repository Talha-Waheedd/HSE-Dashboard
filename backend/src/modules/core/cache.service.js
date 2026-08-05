'use strict';

const IORedis = require('ioredis');
const redisConfig = require('../../database/config/redis');
const logger = require('../../shared/utils/logger');

let client;

const getClient = () => {
  if (!client) {
    client = new IORedis(redisConfig);
    client.on('connect', () => logger.info('✅ Redis connected'));
    client.on('error', (err) => logger.error('Redis error:', err));
  }
  return client;
};

class CacheService {
  /**
   * Get a cached value by key.
   * @returns {any} Parsed JSON value or null
   */
  async get(key) {
    const value = await getClient().get(key);
    return value ? JSON.parse(value) : null;
  }

  /**
   * Set a cached value with optional TTL.
   * @param {string} key
   * @param {any} value
   * @param {number} ttlSeconds - Default 300 (5 min)
   */
  async set(key, value, ttlSeconds = 300) {
    await getClient().set(key, JSON.stringify(value), 'EX', ttlSeconds);
  }

  /**
   * Delete a cached key.
   */
  async del(key) {
    await getClient().del(key);
  }

  /**
   * Delete all keys matching a pattern.
   */
  async delPattern(pattern) {
    const keys = await getClient().keys(pattern);
    if (keys.length > 0) await getClient().del(keys);
  }

  /**
   * Wrap a function with cache-aside pattern.
   */
  async remember(key, ttl, fn) {
    const cached = await this.get(key);
    if (cached !== null) return cached;
    const value = await fn();
    await this.set(key, value, ttl);
    return value;
  }
}

module.exports = new CacheService();
