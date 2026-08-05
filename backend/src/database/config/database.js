'use strict';

const config = require('./index');

module.exports = {
  development: {
    username: config.db.user,
    password: config.db.password,
    database: config.db.name,
    host: config.db.host,
    port: config.db.port,
    dialect: 'mysql',
    logging: config.env === 'development' ? console.log : false,
    pool: {
      min: config.db.poolMin,
      max: config.db.poolMax,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      underscored: true,
      timestamps: true,
      paranoid: true, // Soft deletes (deletedAt)
    },
  },
  test: {
    username: config.db.user,
    password: config.db.password,
    database: `${config.db.name}_test`,
    host: config.db.host,
    port: config.db.port,
    dialect: 'mysql',
    logging: false,
    pool: { min: 1, max: 5 },
    define: { underscored: true, timestamps: true, paranoid: true },
  },
  production: {
    username: config.db.user,
    password: config.db.password,
    database: config.db.name,
    host: config.db.host,
    port: config.db.port,
    dialect: 'mysql',
    logging: false,
    pool: {
      min: config.db.poolMin,
      max: config.db.poolMax,
      acquire: 60000,
      idle: 20000,
    },
    define: { underscored: true, timestamps: true, paranoid: true },
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  },
};
