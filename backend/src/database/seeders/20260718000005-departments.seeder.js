'use strict';

const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    let plantId;
    let adminId = '00000000-0000-0000-0000-000000000001';

    try {
      // Find the first plant to associate departments with
      const plants = await queryInterface.sequelize.query(
        `SELECT id FROM plants LIMIT 1;`
      );
      if (plants[0] && plants[0].length > 0) {
        plantId = plants[0][0].id;
      }
      
      const users = await queryInterface.sequelize.query(
        `SELECT id FROM users WHERE email = 'admin@cbl.com' LIMIT 1;`
      );
      if (users[0] && users[0].length > 0) {
        adminId = users[0][0].id;
      }
    } catch (e) {}

    // If no plant exists, do not seed departments to avoid FK constraints
    if (!plantId) return;

    const departments = [
      {
        id: uuidv4(),
        plant_id: plantId,
        name: 'HSE Department',
        code: 'DEPT-HSE',
        is_active: true,
        created_by: adminId,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: uuidv4(),
        plant_id: plantId,
        name: 'Production',
        code: 'DEPT-PROD',
        is_active: true,
        created_by: adminId,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: uuidv4(),
        plant_id: plantId,
        name: 'Maintenance',
        code: 'DEPT-MAINT',
        is_active: true,
        created_by: adminId,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    await queryInterface.bulkInsert('departments', departments, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('departments', null, {});
  }
};
