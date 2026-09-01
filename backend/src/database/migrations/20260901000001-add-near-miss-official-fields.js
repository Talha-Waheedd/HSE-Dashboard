'use strict';

/**
 * Adds the fields used by the official Near Miss Record format.
 *
 * The current near_misses table is a normalized table with an extensible
 * metadata column. These nullable columns make the official fields queryable
 * and typed without rewriting historical metadata records.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const existing = await queryInterface.describeTable('near_misses');
    const columns = {
      responsible_department_id: {
        type: Sequelize.UUID,
        allowNull: true,
        comment: 'Department responsible for the preventive/corrective action',
      },
      further_investigation_required: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      reported_in_hazard: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      remarks: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    };

    for (const [name, definition] of Object.entries(columns)) {
      if (!existing[name]) await queryInterface.addColumn('near_misses', name, definition);
    }

    try {
      await queryInterface.addIndex('near_misses', ['responsible_department_id'], {
        name: 'near_misses_responsible_department_idx',
      });
    } catch (error) {
      if (!/duplicate|exists|too many keys|max 64 keys/i.test(error.message || '')) throw error;
    }
  },

  async down(queryInterface) {
    const existing = await queryInterface.describeTable('near_misses');
    try { await queryInterface.removeIndex('near_misses', 'near_misses_responsible_department_idx'); } catch (error) {
      if (!/doesn't exist|unknown|not found/i.test(error.message || '')) throw error;
    }
    for (const name of ['responsible_department_id', 'further_investigation_required', 'reported_in_hazard', 'remarks']) {
      if (existing[name]) await queryInterface.removeColumn('near_misses', name);
    }
  },
};
