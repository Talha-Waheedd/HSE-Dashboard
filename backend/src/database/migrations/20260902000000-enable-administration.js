'use strict';

const { randomUUID } = require('crypto');

const LOCATION_PERMISSIONS = [
  ['location:view', 'View Locations', 'View location master data'],
  ['location:create', 'Create Locations', 'Create location master data'],
  ['location:update', 'Update Locations', 'Update location master data'],
  ['location:delete', 'Deactivate Locations', 'Deactivate location master data'],
];

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await Promise.all(LOCATION_PERMISSIONS.map(([key, displayName, description]) => (
      queryInterface.sequelize.query(
        `INSERT IGNORE INTO permissions (id, \`key\`, display_name, \`group\`, description, created_at, updated_at)
         VALUES (:id, :key, :displayName, 'location', :description, :now, :now)`,
        {
          replacements: {
            id: randomUUID(), key, displayName, description, now,
          },
        },
      )
    )));

    // Administrator roles are API superusers already. Persisting the full
    // matrix makes the database and Administration UI accurately reflect it.
    await queryInterface.sequelize.query(
      `INSERT IGNORE INTO role_permissions (role_id, permission_id, created_at, updated_at)
         SELECT r.id, p.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
         FROM roles r CROSS JOIN permissions p
         WHERE r.deleted_at IS NULL
           AND LOWER(r.name) IN ('system administrator', 'administrator', 'super admin')`,
      {},
    );

    const indexes = await queryInterface.showIndex('departments');
    const names = new Set(indexes.map((index) => index.name));
    if (!names.has('departments_plant_name_unique')) {
      await queryInterface.addIndex('departments', ['plant_id', 'name'], {
        unique: true,
        name: 'departments_plant_name_unique',
      });
    }
    if (!names.has('departments_plant_code_unique')) {
      await queryInterface.addIndex('departments', ['plant_id', 'code'], {
        unique: true,
        name: 'departments_plant_code_unique',
      });
    }
  },

  async down(queryInterface) {
    const indexes = await queryInterface.showIndex('departments');
    const names = new Set(indexes.map((index) => index.name));
    if (names.has('departments_plant_code_unique')) await queryInterface.removeIndex('departments', 'departments_plant_code_unique');
    if (names.has('departments_plant_name_unique')) await queryInterface.removeIndex('departments', 'departments_plant_name_unique');
    await queryInterface.sequelize.query(
      "DELETE FROM permissions WHERE `key` IN ('location:view','location:create','location:update','location:delete')",
    );
  },
};
