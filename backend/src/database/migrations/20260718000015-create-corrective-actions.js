'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('corrective_actions', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      s_no: { type: Sequelize.STRING(50), allowNull: true },
      date: { type: Sequelize.DATEONLY, allowNull: false },
      auditor_name: { type: Sequelize.STRING(255), allowNull: true },
      action_driven_from: { type: Sequelize.STRING(255), allowNull: true },
      audit_description: { type: Sequelize.TEXT, allowNull: true },
      area_clauses: { type: Sequelize.STRING(255), allowNull: true },
      actions_recommendation: { type: Sequelize.TEXT, allowNull: true },
      severity: { type: Sequelize.STRING(255), allowNull: true },
      department_id: { type: Sequelize.STRING(255), allowNull: true },
      responsible_manager: { type: Sequelize.STRING(255), allowNull: true },
      target_date: { type: Sequelize.DATEONLY, allowNull: true },
      status_id: { type: Sequelize.STRING(255), allowNull: true },

      // System tracking
      created_by: { type: Sequelize.UUID, allowNull: true },
      updated_by: { type: Sequelize.UUID, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('corrective_actions');
  },
};
