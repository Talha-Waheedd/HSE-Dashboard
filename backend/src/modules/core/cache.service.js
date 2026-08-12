'use strict';

const IORedis = require('ioredis');
const redisConfig = require('../../database/config/redis');
const appConfig = require('../../database/config');
const logger = require('../../shared/utils/logger');

let client;

const getClient = () => {
  if (!appConfig.redis.enabled) return null;
  if (!client) {
    client = new IORedis({ ...redisConfig, lazyConnect: true });
    client.on('connect', () => logger.info('✅ Redis connected'));
    client.on('error', (err) => logger.warn('Redis error (non-fatal):', { message: err.message }));
  }
  return client;
};

class CacheService {
  /**
   * Get a cached value by key.
   * Returns null on cache miss or if Redis is unavailable (graceful degradation).
   * @returns {any} Parsed JSON value or null
   */
  async get(key) {
    if (!appConfig.redis.enabled) return null;
    try {
      const value = await getClient().get(key);
      return value ? JSON.parse(value) : null;
    } catch (err) {
      logger.warn('CacheService.get failed — bypassing cache', { key, message: err.message });
      return null;
    }
  }

  /**
   * Set a cached value with optional TTL.
   * Silently no-ops when Redis is unavailable.
   * @param {string} key
   * @param {any} value
   * @param {number} ttlSeconds - Default 300 (5 min)
   */
  async set(key, value, ttlSeconds = 300) {
    if (!appConfig.redis.enabled) return;
    try {
      await getClient().set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (err) {
      logger.warn('CacheService.set failed — bypassing cache', { key, message: err.message });
    }
  }

  /**
   * Delete a cached key.
   */
  async del(key) {
    if (!appConfig.redis.enabled) return;
    try {
      await getClient().del(key);
    } catch (err) {
      logger.warn('CacheService.del failed', { key, message: err.message });
    }
  }

  /**
   * Delete all keys matching a pattern.
   * Uses SCAN (cursor-based) instead of KEYS to avoid blocking the Redis server
   * on large keyspaces (KEYS is O(N) and holds the event loop).
   */
  async delPattern(pattern) {
    if (!appConfig.redis.enabled) return;
    try {
      const redis = getClient();
      let cursor = '0';
      do {
        const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = nextCursor;
        if (keys.length > 0) {
          await redis.del(keys);
        }
      } while (cursor !== '0');
    } catch (err) {
      logger.warn('CacheService.delPattern failed', { pattern, message: err.message });
    }
  }

  /**
   * Wrap a function with cache-aside pattern.
   * Falls through to the factory function if Redis is unavailable.
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
