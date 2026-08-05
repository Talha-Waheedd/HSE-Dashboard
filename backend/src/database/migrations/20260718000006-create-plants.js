'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('plants', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      name: { type: Sequelize.STRING(200), allowNull: false },
      code: { type: Sequelize.STRING(20), allowNull: false, unique: true },
      location: { type: Sequelize.STRING(200), allowNull: true },
      address: { type: Sequelize.TEXT, allowNull: true },
      country: { type: Sequelize.STRING(100), allowNull: true, defaultValue: 'Pakistan' },
      contact_name: { type: Sequelize.STRING(100), allowNull: true },
      contact_email: { type: Sequelize.STRING(255), allowNull: true },
      contact_phone: { type: Sequelize.STRING(20), allowNull: true },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_by: { type: Sequelize.UUID, allowNull: true },
      updated_by: { type: Sequelize.UUID, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });

    await queryInterface.addIndex('plants', ['code'], { unique: true, name: 'plants_code_unique' });
    await queryInterface.addIndex('plants', ['is_active'], { name: 'plants_is_active_idx' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('plants');
  },
};
