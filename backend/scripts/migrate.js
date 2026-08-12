'use strict';

require('dotenv').config();

const { sequelize } = require('../src/database/connection');
const logger = require('../src/shared/utils/logger');

const describeDatabaseError = (err) => ({
  name: err?.name,
  message: err?.message,
  sqlMessage: err?.original?.sqlMessage || err?.parent?.sqlMessage,
  code: err?.original?.code || err?.parent?.code,
  errno: err?.original?.errno || err?.parent?.errno,
  sql: err?.sql || err?.original?.sql || err?.parent?.sql,
});

const runMigrations = async () => {
  try {
    logger.info('Running database migrations...');
    await sequelize.authenticate();
    // Use Sequelize CLI for actual migrations
    // This script is a hook for CI/CD pipelines
    const { Umzug, SequelizeStorage } = require('umzug');
    const umzug = new Umzug({
      migrations: { glob: 'src/database/migrations/*.js' },
      context: sequelize.getQueryInterface(),
      storage: new SequelizeStorage({ sequelize }),
      logger,
    });

    const migrations = await umzug.up();
    logger.info(`Applied ${migrations.length} migration(s)`);
    process.exit(0);
  } catch (err) {
    logger.error(`Migration failed: ${JSON.stringify(describeDatabaseError(err))}`);
    process.exit(1);
  }
};

runMigrations();
