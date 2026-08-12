'use strict';

require('dotenv').config();
const Joi = require('joi');

// ─── Validate required env vars at startup ────────────────────────────────────
const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(5000),
  APP_NAME: Joi.string().default('CBL-Backend'),
  APP_URL: Joi.string().uri().default('http://localhost:5000'),
  CLIENT_URL: Joi.string().uri().default('http://localhost:3000'),

  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(3306),
  DB_NAME: Joi.string().required(),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().allow('').default(''),

  JWT_ACCESS_SECRET: Joi.string().min(16).required(),
  JWT_REFRESH_SECRET: Joi.string().min(16).required(),
  JWT_ACCESS_EXPIRY: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRY: Joi.string().default('7d'),
  JWT_VERIFY_SECRET: Joi.string().min(16).required(),
  JWT_VERIFY_EXPIRY: Joi.string().default('24h'),
  JWT_RESET_SECRET: Joi.string().min(16).required(),
  JWT_RESET_EXPIRY: Joi.string().default('1h'),

  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_ENABLED: Joi.boolean().truthy('true').falsy('false').default(false),

  MAIL_HOST: Joi.string().required(),
  MAIL_PORT: Joi.number().default(587),
  MAIL_USER: Joi.string().required(),
  MAIL_PASSWORD: Joi.string().required(),

  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'http', 'debug').default('info'),
  ALLOWED_ORIGINS: Joi.string().default('http://localhost:3000'),
  STORAGE_DRIVER: Joi.string().valid('local', 's3').default('local'),
  ENCRYPTION_KEY: Joi.string().length(32).optional(),
  MSAL_CLIENT_ID: Joi.string().optional(),
  MSAL_TENANT_ID: Joi.string().optional(),
}).unknown(true);

const { error, value: envVars } = envSchema.validate(process.env, { abortEarly: false });

if (error && process.env.NODE_ENV !== 'test') {
  throw new Error(`Config validation error:\n${error.details.map((d) => d.message).join('\n')}`);
}

const config = Object.freeze({
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  appName: envVars.APP_NAME,
  appUrl: envVars.APP_URL,
  clientUrl: envVars.CLIENT_URL,

  db: {
    host: envVars.DB_HOST,
    port: envVars.DB_PORT,
    name: envVars.DB_NAME,
    user: envVars.DB_USER,
    password: envVars.DB_PASSWORD,
    poolMin: parseInt(envVars.DB_POOL_MIN, 10) || 2,
    poolMax: parseInt(envVars.DB_POOL_MAX, 10) || 10,
  },

  jwt: {
    accessSecret: envVars.JWT_ACCESS_SECRET,
    refreshSecret: envVars.JWT_REFRESH_SECRET,
    accessExpiry: envVars.JWT_ACCESS_EXPIRY,
    refreshExpiry: envVars.JWT_REFRESH_EXPIRY,
    verifySecret: envVars.JWT_VERIFY_SECRET,
    verifyExpiry: envVars.JWT_VERIFY_EXPIRY,
    resetSecret: envVars.JWT_RESET_SECRET,
    resetExpiry: envVars.JWT_RESET_EXPIRY,
  },

  redis: {
    enabled: envVars.REDIS_ENABLED,
    host: envVars.REDIS_HOST,
    port: envVars.REDIS_PORT,
    password: envVars.REDIS_PASSWORD || undefined,
    db: parseInt(envVars.REDIS_DB, 10) || 0,
  },

  mail: {
    host: envVars.MAIL_HOST,
    port: envVars.MAIL_PORT,
    secure: envVars.MAIL_SECURE === 'true',
    user: envVars.MAIL_USER,
    password: envVars.MAIL_PASSWORD,
    fromName: envVars.MAIL_FROM_NAME || 'CBL App',
    fromEmail: envVars.MAIL_FROM_EMAIL || envVars.MAIL_USER,
    sendgridApiKey: envVars.SENDGRID_API_KEY,
  },

  aws: {
    accessKeyId: envVars.AWS_ACCESS_KEY_ID,
    secretAccessKey: envVars.AWS_SECRET_ACCESS_KEY,
    region: envVars.AWS_REGION || 'us-east-1',
    s3Bucket: envVars.AWS_S3_BUCKET,
  },

  rateLimiter: {
    windowMs: parseInt(envVars.RATE_LIMIT_WINDOW_MS, 10) || 900000,
    max: parseInt(envVars.RATE_LIMIT_MAX, 10) || 100,
    authMax: parseInt(envVars.AUTH_RATE_LIMIT_MAX, 10) || 10,
  },

  log: {
    level: envVars.LOG_LEVEL,
    dir: envVars.LOG_DIR || 'logs',
  },

  // Keep the local development origins available even when a parent shell or
  // process manager supplies a stale ALLOWED_ORIGINS value. Production still
  // uses only the explicitly configured origins.
  allowedOrigins: [
    ...new Set([
      ...envVars.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean),
      ...(envVars.NODE_ENV === 'development'
        ? ['http://localhost:5173', 'http://127.0.0.1:5173']
        : []),
    ]),
  ],
  storageDriver: envVars.STORAGE_DRIVER,
  encryptionKey: envVars.ENCRYPTION_KEY,
  msal: {
    clientId: envVars.MSAL_CLIENT_ID,
    tenantId: envVars.MSAL_TENANT_ID,
  },
});

module.exports = config;
