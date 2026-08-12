'use strict';

/**
 * Reconcile the Location model with an existing locations table without
 * sequelize.sync({ alter: true }). This migration is intentionally additive
 * and reversible; it never drops or truncates location data.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('locations');

    if (!table.code) {
      await queryInterface.addColumn('locations', 'code', {
        type: Sequelize.STRING(80),
        allowNull: true,
      });
    }
    if (!table.normalized_name) {
      await queryInterface.addColumn('locations', 'normalized_name', {
        type: Sequelize.STRING(255),
        allowNull: true,
      });
      await queryInterface.sequelize.query(
        "UPDATE locations SET normalized_name = LOWER(TRIM(name)) WHERE normalized_name IS NULL OR normalized_name = ''",
      );
      await queryInterface.changeColumn('locations', 'normalized_name', {
        type: Sequelize.STRING(255),
        allowNull: false,
      });
    }

    const indexes = await queryInterface.showIndex('locations');
    const hasIndex = (name) => indexes.some((index) => index.name === name);

    if (!hasIndex('locations_normalized_name_unique')) {
      await queryInterface.addIndex('locations', ['normalized_name'], {
        unique: true,
        name: 'locations_normalized_name_unique',
      });
    }
    if (!hasIndex('locations_code_unique')) {
      await queryInterface.addIndex('locations', ['code'], {
        unique: true,
        name: 'locations_code_unique',
      });
    }
    if (!hasIndex('locations_plant_active_idx')) {
      await queryInterface.addIndex('locations', ['plant_id', 'is_active'], {
        name: 'locations_plant_active_idx',
      });
    }
  },

  async down(queryInterface) {
    // Roll back only indexes/columns introduced by this reconciliation. The
    // original locations table and its records remain intact.
    const indexes = await queryInterface.showIndex('locations');
    const hasIndex = (name) => indexes.some((index) => index.name === name);
    if (hasIndex('locations_plant_active_idx')) await queryInterface.removeIndex('locations', 'locations_plant_active_idx');
    if (hasIndex('locations_code_unique')) await queryInterface.removeIndex('locations', 'locations_code_unique');
    if (hasIndex('locations_normalized_name_unique')) await queryInterface.removeIndex('locations', 'locations_normalized_name_unique');

    const table = await queryInterface.describeTable('locations');
    if (table.code) await queryInterface.removeColumn('locations', 'code');
    // Do not remove normalized_name on rollback because it may predate this
    // migration and is required by the current Location model.
  },
};
