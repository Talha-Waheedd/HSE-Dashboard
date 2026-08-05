'use strict';

const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const { ROLES } = require('../../shared/constants/roles');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    // Get super_admin role
    const [roles] = await queryInterface.sequelize.query(
      `SELECT id FROM roles WHERE name = '${ROLES.SYSTEM_ADMINISTRATOR}' LIMIT 1`,
    );

    const superAdminRoleId = roles[0]?.id;
    if (!superAdminRoleId) throw new Error('Super admin role not found. Run roles seeder first.');

    const hashedPassword = await bcrypt.hash('Admin@123!', 12);

    await queryInterface.bulkInsert('users', [
      {
        id: uuidv4(),
        first_name: 'Super',
        last_name: 'Admin',
        email: 'superadmin@cblapp.com',
        password: hashedPassword,
        status: true,
        is_email_verified: true,
        role_id: superAdminRoleId,
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('users', { email: 'superadmin@cblapp.com' }, {});
  },
};
