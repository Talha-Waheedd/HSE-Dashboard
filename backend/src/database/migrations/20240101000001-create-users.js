'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      first_name: { type: Sequelize.STRING(100), allowNull: false },
      last_name: { type: Sequelize.STRING(100), allowNull: false },
      email: { type: Sequelize.STRING(255), allowNull: false, unique: true },
      password: { type: Sequelize.STRING(255), allowNull: true },
      phone: { type: Sequelize.STRING(20), allowNull: true },
      avatar: { type: Sequelize.STRING(500), allowNull: true },
      status: { type: Sequelize.BOOLEAN, defaultValue: true },
      is_email_verified: { type: Sequelize.BOOLEAN, defaultValue: false },
      last_login_at: { type: Sequelize.DATE, allowNull: true },
      role_id: { type: Sequelize.UUID, allowNull: true },
      created_by: { type: Sequelize.UUID, allowNull: true },
      updated_by: { type: Sequelize.UUID, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });

    await queryInterface.addIndex('users', ['email'], { unique: true, name: 'users_email_unique' });
    await queryInterface.addIndex('users', ['status'], { name: 'users_status_idx' });
    await queryInterface.addIndex('users', ['role_id'], { name: 'users_role_id_idx' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('users');
  },
};
