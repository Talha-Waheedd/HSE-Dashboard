'use strict';

const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const defaultUserId = '00000000-0000-0000-0000-000000000001'; // Fallback Super Admin ID

    // Try to get super admin user ID to associate creation
    let adminId = defaultUserId;
    try {
      const users = await queryInterface.sequelize.query(
        `SELECT id FROM users WHERE email = 'admin@cbl.com' LIMIT 1;`
      );
      if (users[0] && users[0].length > 0) {
        adminId = users[0][0].id;
      }
    } catch (e) {
      // Ignore if table doesn't exist or query fails
    }

    const plants = [
      {
        id: '5126923e-b77f-4eb6-8b98-d5fc9db8d71b', // Fixed UUID to match DEFAULT_PLANT_ID in frontend/backend
        name: 'CBL Plant Alpha',
        code: 'PLANT-A',
        location: 'Karachi, Sindh',
        country: 'Pakistan',
        is_active: true,
        created_by: adminId,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: uuidv4(),
        name: 'CBL Plant Beta',
        code: 'PLANT-B',
        location: 'Lahore, Punjab',
        country: 'Pakistan',
        is_active: true,
        created_by: adminId,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    await queryInterface.bulkInsert('plants', plants, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('plants', null, {});
  }
};
