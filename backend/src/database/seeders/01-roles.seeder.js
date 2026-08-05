'use strict';

const { v4: uuidv4 } = require('uuid');
const { ROLES } = require('../../shared/constants/roles');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert('roles', [
      {
        id: uuidv4(),
        name: ROLES.SYSTEM_ADMINISTRATOR,
        display_name: 'System Administrator',
        description: 'Full system access',
        is_system: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        name: ROLES.HSE_MANAGER,
        display_name: 'HSE Manager',
        description: 'Manage HSE reports',
        is_system: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        name: ROLES.HSE_OFFICER,
        display_name: 'HSE Officer',
        description: 'HSE operations',
        is_system: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        name: ROLES.DEPARTMENT_MANAGER,
        display_name: 'Department Manager',
        description: 'Department level manager',
        is_system: false,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        name: ROLES.DATA_ENTRY_OPERATOR,
        display_name: 'Data Entry Operator',
        description: 'Enter data',
        is_system: false,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        name: ROLES.VIEWER,
        display_name: 'Viewer',
        description: 'View only',
        is_system: true,
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('roles', null, {});
  },
};
