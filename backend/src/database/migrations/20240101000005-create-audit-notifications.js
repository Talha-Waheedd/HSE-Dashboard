'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('audit_logs', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      user_id: { type: Sequelize.UUID, allowNull: true },
      action: { type: Sequelize.STRING(100), allowNull: false },
      resource: { type: Sequelize.STRING(100), allowNull: true },
      resource_id: { type: Sequelize.STRING(100), allowNull: true },
      old_values: { type: Sequelize.JSON, allowNull: true },
      new_values: { type: Sequelize.JSON, allowNull: true },
      ip_address: { type: Sequelize.STRING(45), allowNull: true },
      user_agent: { type: Sequelize.TEXT, allowNull: true },
      request_id: { type: Sequelize.STRING(36), allowNull: true },
      status_code: { type: Sequelize.INTEGER, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('audit_logs', ['user_id']);
    await queryInterface.addIndex('audit_logs', ['action']);
    await queryInterface.addIndex('audit_logs', ['resource']);
    await queryInterface.addIndex('audit_logs', ['created_at']);

    // Notifications table
    await queryInterface.createTable('notifications', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      user_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      type: { type: Sequelize.ENUM('info', 'success', 'warning', 'error', 'system', 'account'), defaultValue: 'info' },
      title: { type: Sequelize.STRING(255), allowNull: false },
      message: { type: Sequelize.TEXT, allowNull: false },
      data: { type: Sequelize.JSON, allowNull: true },
      is_read: { type: Sequelize.BOOLEAN, defaultValue: false },
      read_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('notifications');
    await queryInterface.dropTable('audit_logs');
  },
};
