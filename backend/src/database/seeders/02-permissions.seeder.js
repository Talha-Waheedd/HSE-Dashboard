'use strict';

const { v4: uuidv4 } = require('uuid');
const { PERMISSIONS } = require('../../shared/constants/permissions');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const permissionRows = Object.entries(PERMISSIONS).map(([, key]) => {
      const [group, action] = key.split(':');
      return {
        id: uuidv4(),
        key,
        display_name: `${action.charAt(0).toUpperCase() + action.slice(1)} ${group.charAt(0).toUpperCase() + group.slice(1)}`,
        group,
        description: `Allows ${action} on ${group} resources`,
        created_at: now,
        updated_at: now,
      };
    });

    await queryInterface.bulkInsert('permissions', permissionRows, { ignoreDuplicates: true });
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('permissions', null, {});
  },
};
