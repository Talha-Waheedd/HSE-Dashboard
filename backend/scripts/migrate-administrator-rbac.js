'use strict';

require('dotenv').config({ override: true });

const { sequelize, Sequelize } = require('../src/database/connection');
const migration = require('../src/database/migrations/20260812000001-grant-administrator-industry-permissions');

async function main() {
  try {
    await sequelize.authenticate();
    await migration.up(sequelize.getQueryInterface(), Sequelize);
    console.log('Administrator RBAC permissions synchronized successfully.');
  } catch (error) {
    console.error('Administrator RBAC synchronization failed:', {
      name: error?.name,
      message: error?.message,
      sqlMessage: error?.original?.sqlMessage || error?.parent?.sqlMessage,
      code: error?.original?.code || error?.parent?.code,
      errno: error?.original?.errno || error?.parent?.errno,
      sql: error?.sql || error?.original?.sql || error?.parent?.sql,
    });
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

main();
