'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('incidents', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      s_no: { type: Sequelize.STRING(50), allowNull: true },
      date: { type: Sequelize.DATEONLY, allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      shift: { type: Sequelize.STRING(50), allowNull: true },
      area_manager: { type: Sequelize.STRING(255), allowNull: true },
      gender: { type: Sequelize.STRING(50), allowNull: true },
      location: { type: Sequelize.STRING(255), allowNull: true },
      department_id: { type: Sequelize.STRING(255), allowNull: true },
      incident_category_id: { type: Sequelize.STRING(255), allowNull: true },
      root_cause_id: { type: Sequelize.STRING(255), allowNull: true },
      action_items: { type: Sequelize.TEXT, allowNull: true },
      immediate_cause: { type: Sequelize.TEXT, allowNull: true },
      root_cause: { type: Sequelize.TEXT, allowNull: true },
      corrective_actions: { type: Sequelize.TEXT, allowNull: true },
      preventive_actions: { type: Sequelize.TEXT, allowNull: true },
      responsible_person: { type: Sequelize.STRING(255), allowNull: true },
      risk_rating_id: { type: Sequelize.STRING(255), allowNull: true },
      timeline: { type: Sequelize.DATEONLY, allowNull: true },
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
    await queryInterface.dropTable('incidents');
  },
};
