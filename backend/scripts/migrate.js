'use strict';

require('dotenv').config();

const { sequelize } = require('../src/database/connection');
const logger = require('../src/shared/utils/logger');

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
    logger.error('Migration failed:', err);
    process.exit(1);
  }
};

runMigrations();
