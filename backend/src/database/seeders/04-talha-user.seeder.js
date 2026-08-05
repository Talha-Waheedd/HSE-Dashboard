'use strict';

const { v4: uuidv4 } = require('uuid');
const { ROLES } = require('../../shared/constants/roles');
const { hashPassword } = require('../../shared/utils/hashHelper');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();
    
    // Get the System Administrator role id
    const roles = await queryInterface.sequelize.query(
      `SELECT id FROM roles WHERE name = '${ROLES.SYSTEM_ADMINISTRATOR}' LIMIT 1`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (roles.length === 0) {
      console.warn('System Administrator role not found, skipping seeder.');
      return;
    }

    const roleId = roles[0].id;
    const passwordHash = await hashPassword('Admin@123!');

    await queryInterface.bulkInsert('users', [
      {
        id: uuidv4(),
        role_id: roleId,
        email: 'talhawaheed477@gmail.com',
        password: passwordHash,
        first_name: 'Talha',
        last_name: 'Waheed',
        status: true,
        is_email_verified: true,
        created_at: now,
        updated_at: now
      }
    ], { ignoreDuplicates: true });
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('users', { email: 'talhawaheed477@gmail.com' }, {});
  }
};
