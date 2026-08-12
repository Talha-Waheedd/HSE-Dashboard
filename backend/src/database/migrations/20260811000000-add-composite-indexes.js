'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // Hazards
    await queryInterface.addIndex('hazards', ['plant_id', 'reported_at'], {
      name: 'idx_hazards_plant_date',
    });
    await queryInterface.addIndex('hazards', ['plant_id', 'status'], {
      name: 'idx_hazards_plant_status',
    });

    // Near Misses
    await queryInterface.addIndex('near_misses', ['plant_id', 'reported_at'], {
      name: 'idx_near_misses_plant_date',
    });
    await queryInterface.addIndex('near_misses', ['plant_id', 'status'], {
      name: 'idx_near_misses_plant_status',
    });

    // Incidents
    await queryInterface.addIndex('incidents', ['plant_id', 'incident_date'], {
      name: 'idx_incidents_plant_date',
    });
    await queryInterface.addIndex('incidents', ['plant_id', 'status'], {
      name: 'idx_incidents_plant_status',
    });
  },

  async down(queryInterface) {
    // Hazards
    await queryInterface.removeIndex('hazards', 'idx_hazards_plant_date');
    await queryInterface.removeIndex('hazards', 'idx_hazards_plant_status');

    // Near Misses
    await queryInterface.removeIndex('near_misses', 'idx_near_misses_plant_date');
    await queryInterface.removeIndex('near_misses', 'idx_near_misses_plant_status');

    // Incidents
    await queryInterface.removeIndex('incidents', 'idx_incidents_plant_date');
    await queryInterface.removeIndex('incidents', 'idx_incidents_plant_status');
  },
};
