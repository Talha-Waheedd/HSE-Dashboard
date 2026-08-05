'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Inspections table
    await queryInterface.createTable('inspections', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      plant_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'plants', key: 'id' }, onDelete: 'RESTRICT' },
      department_id: { type: Sequelize.UUID, allowNull: true, references: { model: 'departments', key: 'id' }, onDelete: 'SET NULL' },
      inspection_number: { type: Sequelize.STRING(30), allowNull: true, unique: true },
      title: { type: Sequelize.STRING(255), allowNull: false },
      inspection_type: { type: Sequelize.ENUM('routine', 'special', 'regulatory'), defaultValue: 'routine', allowNull: false },
      status: { type: Sequelize.ENUM('scheduled', 'in_progress', 'completed', 'overdue', 'cancelled'), defaultValue: 'scheduled', allowNull: false },
      inspected_by: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'RESTRICT' },
      scheduled_date: { type: Sequelize.DATEONLY, allowNull: false },
      completed_date: { type: Sequelize.DATEONLY, allowNull: true },
      area: { type: Sequelize.STRING(255), allowNull: true },
      summary: { type: Sequelize.TEXT, allowNull: true },
      overall_result: { type: Sequelize.ENUM('pass', 'fail', 'conditional'), allowNull: true },
      created_by: { type: Sequelize.UUID, allowNull: true },
      updated_by: { type: Sequelize.UUID, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });

    await queryInterface.addIndex('inspections', ['inspection_number'], { unique: true, name: 'inspections_number_unique' });
    await queryInterface.addIndex('inspections', ['plant_id'], { name: 'inspections_plant_id_idx' });
    await queryInterface.addIndex('inspections', ['department_id'], { name: 'inspections_department_id_idx' });
    await queryInterface.addIndex('inspections', ['inspected_by'], { name: 'inspections_inspected_by_idx' });
    await queryInterface.addIndex('inspections', ['status'], { name: 'inspections_status_idx' });
    await queryInterface.addIndex('inspections', ['scheduled_date'], { name: 'inspections_date_idx' });
    await queryInterface.addIndex('inspections', ['overall_result'], { name: 'inspections_result_idx' });

    // Inspection items table
    await queryInterface.createTable('inspection_items', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      inspection_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'inspections', key: 'id' }, onDelete: 'CASCADE' },
      checklist_item: { type: Sequelize.STRING(500), allowNull: false },
      result: { type: Sequelize.ENUM('pass', 'fail', 'na'), allowNull: true },
      remarks: { type: Sequelize.TEXT, allowNull: true },
      severity_level: { type: Sequelize.ENUM('low', 'medium', 'high', 'critical'), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('inspection_items', ['inspection_id'], { name: 'inspection_items_inspection_id_idx' });
    await queryInterface.addIndex('inspection_items', ['result'], { name: 'inspection_items_result_idx' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('inspection_items');
    await queryInterface.dropTable('inspections');
  },
};
