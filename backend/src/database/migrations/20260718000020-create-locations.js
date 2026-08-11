'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('locations', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      plant_id: { type: Sequelize.UUID, allowNull: true, references: { model: 'plants', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      name: { type: Sequelize.STRING(255), allowNull: false },
      normalized_name: { type: Sequelize.STRING(255), allowNull: false, unique: true },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      created_by: { type: Sequelize.UUID, allowNull: true },
      updated_by: { type: Sequelize.UUID, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });
    await queryInterface.addIndex('locations', ['normalized_name'], { unique: true, name: 'locations_normalized_name_unique' });
    await queryInterface.addIndex('locations', ['plant_id', 'is_active'], { name: 'locations_plant_active_idx' });
  },
  async down(queryInterface) { await queryInterface.dropTable('locations'); },
};
