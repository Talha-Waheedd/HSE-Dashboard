'use strict';

const { Sequelize } = require('sequelize');
const dbConfig = require('./config/database');
const logger = require('../shared/utils/logger');

const env = process.env.NODE_ENV || 'development';
const config = dbConfig[env];

const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  port: config.port,
  dialect: config.dialect,
  logging: config.logging
    ? (msg) => logger.debug(msg)
    : false,
  pool: config.pool,
  define: config.define,
  dialectOptions: config.dialectOptions || {},
});

// In development, automatically alter tables to match models
// since the models and migrations are currently out of sync mid-refactor.
if (env === 'development') {
  sequelize.sync({ alter: true }).catch(err => {
    logger.error('Failed to sync database:', err);
  });
}

module.exports = { sequelize, Sequelize };

