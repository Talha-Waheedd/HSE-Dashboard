'use strict';

/**
 * Supports Hazard Closing's server-side list filters and stable newest-first
 * pagination. This migration is additive and reversible; it does not alter
 * or remove existing hazard data.
 */
module.exports = {
  async up(queryInterface) {
    await queryInterface.addIndex('hazards', ['status', 'created_at', 'id'], {
      name: 'idx_hazards_status_created_id',
    });
    await queryInterface.addIndex('hazards', ['department_id', 'created_at', 'id'], {
      name: 'idx_hazards_department_created_id',
    });
    await queryInterface.addIndex('hazards', ['reported_at', 'created_at', 'id'], {
      name: 'idx_hazards_reported_created_id',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('hazards', 'idx_hazards_status_created_id');
    await queryInterface.removeIndex('hazards', 'idx_hazards_department_created_id');
    await queryInterface.removeIndex('hazards', 'idx_hazards_reported_created_id');
  },
};
