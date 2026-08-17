'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const safeAdd = async (table, fields, name) => {
      try {
        await queryInterface.addIndex(table, fields, { name });
      } catch (error) {
        // Deployments may already contain equivalent indexes or may be at
        // MySQL's per-table index limit. Indexes are performance-only; never
        // fail a data migration because one cannot be added.
        if (!/duplicate|exists|too many keys|max 64 keys/i.test(error.message || '')) throw error;
      }
    };
    // Hazards
    await safeAdd('hazards', ['plant_id', 'reported_at'], 'idx_hazards_plant_date');
    await safeAdd('hazards', ['plant_id', 'status'], 'idx_hazards_plant_status');

    // Near Misses
    await safeAdd('near_misses', ['plant_id', 'reported_at'], 'idx_near_misses_plant_date');
    await safeAdd('near_misses', ['plant_id', 'status'], 'idx_near_misses_plant_status');

    // Incidents
    await safeAdd('incidents', ['plant_id', 'incident_date'], 'idx_incidents_plant_date');
    await safeAdd('incidents', ['plant_id', 'status'], 'idx_incidents_plant_status');
  },

  async down(queryInterface) {
    const safeRemove = async (table, name) => {
      try { await queryInterface.removeIndex(table, name); } catch (error) {
        if (!/doesn't exist|unknown|not found/i.test(error.message || '')) throw error;
      }
    };
    // Hazards
    await safeRemove('hazards', 'idx_hazards_plant_date');
    await safeRemove('hazards', 'idx_hazards_plant_status');

    // Near Misses
    await safeRemove('near_misses', 'idx_near_misses_plant_date');
    await safeRemove('near_misses', 'idx_near_misses_plant_status');

    // Incidents
    await safeRemove('incidents', 'idx_incidents_plant_date');
    await safeRemove('incidents', 'idx_incidents_plant_status');
  },
};
