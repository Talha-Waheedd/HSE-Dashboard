'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tokens', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      token: { type: Sequelize.TEXT, allowNull: false },
      type: { type: Sequelize.ENUM('access', 'refresh', 'email_verify', 'password_reset'), allowNull: false },
      user_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      expires_at: { type: Sequelize.DATE, allowNull: false },
      is_revoked: { type: Sequelize.BOOLEAN, defaultValue: false },
      ip_address: { type: Sequelize.STRING(45), allowNull: true },
      user_agent: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('tokens', ['user_id']);
    await queryInterface.addIndex('tokens', ['type']);
    await queryInterface.addIndex('tokens', ['expires_at']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('tokens');
  },
};
