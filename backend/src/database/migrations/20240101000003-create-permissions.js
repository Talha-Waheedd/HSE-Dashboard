'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Permissions table
    await queryInterface.createTable('permissions', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      key: { type: Sequelize.STRING(100), allowNull: false, unique: true },
      display_name: { type: Sequelize.STRING(150), allowNull: false },
      group: { type: Sequelize.STRING(50), allowNull: true },
      description: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });

    // Role-Permission pivot table
    await queryInterface.createTable('role_permissions', {
      role_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'roles', key: 'id' }, onDelete: 'CASCADE' },
      permission_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'permissions', key: 'id' }, onDelete: 'CASCADE' },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });

    await queryInterface.addConstraint('role_permissions', {
      fields: ['role_id', 'permission_id'],
      type: 'primary key',
      name: 'role_permissions_pk',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('role_permissions');
    await queryInterface.dropTable('permissions');
  },
};
