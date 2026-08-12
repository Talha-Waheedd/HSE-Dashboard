'use strict';

require('dotenv').config({ override: true });

const { sequelize, Sequelize } = require('../src/database/connection');
const migration = require('../src/database/migrations/20260812000000-reconcile-locations-schema');
const logger = require('../src/shared/utils/logger');

const migrationName = '20260812000000-reconcile-locations-schema.js';

const errorDetails = (err) => ({
  name: err?.name,
  message: err?.message,
  sqlMessage: err?.original?.sqlMessage || err?.parent?.sqlMessage,
  code: err?.original?.code || err?.parent?.code,
  errno: err?.original?.errno || err?.parent?.errno,
  sql: err?.sql || err?.original?.sql || err?.parent?.sql,
});

async function main() {
  try {
    await sequelize.authenticate();
    const queryInterface = sequelize.getQueryInterface();
    const [rows] = await sequelize.query(
      'SELECT name FROM SequelizeMeta WHERE name = :name LIMIT 1',
      { replacements: { name: migrationName } },
    );

    if (rows.length > 0) {
      logger.info(`Location migration already applied: ${migrationName}`);
      return;
    }

    await migration.up(queryInterface, Sequelize);
    await sequelize.query(
      'INSERT INTO SequelizeMeta (name) VALUES (:name)',
      { replacements: { name: migrationName } },
    );
    logger.info(`Applied Location migration: ${migrationName}`);
  } catch (err) {
    logger.error(`Location migration failed: ${JSON.stringify(errorDetails(err))}`);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

main();
