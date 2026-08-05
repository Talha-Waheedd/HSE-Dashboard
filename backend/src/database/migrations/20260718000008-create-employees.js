'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('employees', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      user_id: { type: Sequelize.UUID, allowNull: false, unique: true, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      employee_id: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      department_id: { type: Sequelize.UUID, allowNull: true, references: { model: 'departments', key: 'id' }, onDelete: 'SET NULL' },
      plant_id: { type: Sequelize.UUID, allowNull: true, references: { model: 'plants', key: 'id' }, onDelete: 'SET NULL' },
      designation: { type: Sequelize.STRING(150), allowNull: true },
      job_title: { type: Sequelize.STRING(150), allowNull: true },
      joining_date: { type: Sequelize.DATEONLY, allowNull: true },
      employment_type: { type: Sequelize.ENUM('permanent', 'contract', 'intern'), defaultValue: 'permanent' },
      emergency_contact_name: { type: Sequelize.STRING(100), allowNull: true },
      emergency_contact_phone: { type: Sequelize.STRING(20), allowNull: true },
      blood_group: { type: Sequelize.STRING(10), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('employees', ['user_id'], { unique: true, name: 'employees_user_id_unique' });
    await queryInterface.addIndex('employees', ['employee_id'], { unique: true, name: 'employees_employee_id_unique' });
    await queryInterface.addIndex('employees', ['department_id'], { name: 'employees_department_id_idx' });
    await queryInterface.addIndex('employees', ['plant_id'], { name: 'employees_plant_id_idx' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('employees');
  },
};
