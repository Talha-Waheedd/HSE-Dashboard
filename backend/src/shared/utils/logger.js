'use strict';

const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const config = require('../../database/config');

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

const LOG_DIR = path.resolve(config.log.dir || 'logs');

// ─── Custom log format for console ───────────────────────────────────────────
const consoleFormat = printf(({ level, message, timestamp: ts, requestId, stack }) => {
  const rid = requestId ? `[${requestId}] ` : '';
  return `${ts} ${level}: ${rid}${stack || message}`;
});

// ─── Transports ──────────────────────────────────────────────────────────────
const transports = [
  // Console (development)
  new winston.transports.Console({
    format: combine(
      colorize({ all: true }),
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      errors({ stack: true }),
      consoleFormat,
    ),
    silent: process.env.NODE_ENV === 'test',
  }),

  // Daily rotating combined log
  new DailyRotateFile({
    dirname: LOG_DIR,
    filename: 'combined-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '30d',
    format: combine(timestamp(), errors({ stack: true }), json()),
  }),

  // Error-only log file
  new DailyRotateFile({
    dirname: LOG_DIR,
    filename: 'error-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '90d',
    format: combine(timestamp(), errors({ stack: true }), json()),
  }),
];

const logger = winston.createLogger({
  level: config.log.level || 'info',
  levels: winston.config.npm.levels,
  defaultMeta: { service: config.appName },
  transports,
  exitOnError: false,
});

module.exports = logger;
