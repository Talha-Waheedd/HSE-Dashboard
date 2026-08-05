'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('departments', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      plant_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'plants', key: 'id' }, onDelete: 'RESTRICT' },
      name: { type: Sequelize.STRING(150), allowNull: false },
      code: { type: Sequelize.STRING(20), allowNull: true },
      description: { type: Sequelize.TEXT, allowNull: true },
      manager_id: { type: Sequelize.UUID, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_by: { type: Sequelize.UUID, allowNull: true },
      updated_by: { type: Sequelize.UUID, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });

    await queryInterface.addIndex('departments', ['plant_id'], { name: 'departments_plant_id_idx' });
    await queryInterface.addIndex('departments', ['manager_id'], { name: 'departments_manager_id_idx' });
    await queryInterface.addIndex('departments', ['is_active'], { name: 'departments_is_active_idx' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('departments');
  },
};
