'use strict';

require('dotenv').config();
const { sequelize } = require('../src/database/connection');

const run = async () => {
  const query = (sql) => sequelize.query(sql, { type: sequelize.QueryTypes.SELECT });
  const report = {
    tables: await query(`
      SELECT TABLE_NAME AS tableName, TABLE_ROWS AS estimatedRows
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME IN ('incidents', 'incident_injuries', 'departments', 'locations', 'plants', 'users')
      ORDER BY TABLE_NAME
    `),
    incidentColumns: await query(`
      SELECT COLUMN_NAME AS name, COLUMN_TYPE AS type, IS_NULLABLE AS nullable, COLUMN_KEY AS columnKey
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'incidents'
      ORDER BY ORDINAL_POSITION
    `),
    incidentIndexes: await query(`
      SELECT INDEX_NAME AS name, NON_UNIQUE AS nonUnique,
             GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS columnsList
      FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'incidents'
      GROUP BY INDEX_NAME, NON_UNIQUE
      ORDER BY INDEX_NAME
    `),
    incidents: await query(`
      SELECT COUNT(*) AS total, SUM(deleted_at IS NULL) AS active,
             MIN(incident_date) AS minDate, MAX(incident_date) AS maxDate
      FROM incidents
    `),
    incidentTypes: await query(`
      SELECT incident_type AS incidentType, status, COUNT(*) AS count
      FROM incidents
      WHERE deleted_at IS NULL
      GROUP BY incident_type, status
      ORDER BY incident_type, status
    `),
    plants: await query('SELECT id, name, code FROM plants WHERE deleted_at IS NULL'),
    departments: await query(`
      SELECT id, name, code, is_active AS isActive, deleted_at AS deletedAt
      FROM departments
      ORDER BY name
    `),
    locations: await query(`
      SELECT id, name, code, normalized_name AS normalizedName, is_active AS isActive, deleted_at AS deletedAt
      FROM locations
      ORDER BY name
    `),
    users: await query(`
      SELECT id, email
      FROM users
      WHERE deleted_at IS NULL
      ORDER BY created_at
      LIMIT 10
    `),
  };

  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
};

run()
  .then(() => sequelize.close())
  .catch(async (error) => {
    console.error(error);
    await sequelize.close().catch(() => undefined);
    process.exit(1);
  });
