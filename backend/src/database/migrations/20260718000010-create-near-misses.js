'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('near_misses', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      s_no: { type: Sequelize.STRING(50), allowNull: true },
      date: { type: Sequelize.DATEONLY, allowNull: false },
      department_id: { type: Sequelize.STRING(255), allowNull: true },
      reported_by: { type: Sequelize.STRING(255), allowNull: true },
      designation: { type: Sequelize.STRING(255), allowNull: true },
      affected_person: { type: Sequelize.STRING(255), allowNull: true },
      affected_designation: { type: Sequelize.STRING(255), allowNull: true },
      time: { type: Sequelize.TIME, allowNull: true },
      location: { type: Sequelize.STRING(255), allowNull: true },
      details: { type: Sequelize.TEXT, allowNull: true },
      preventive_action: { type: Sequelize.TEXT, allowNull: true },
      responsible_person: { type: Sequelize.STRING(255), allowNull: true },
      investigation_required: { type: Sequelize.STRING(255), allowNull: true },
      root_cause_analysis: { type: Sequelize.TEXT, allowNull: true },
      investigation_notes: { type: Sequelize.TEXT, allowNull: true },
      investigation_officer: { type: Sequelize.STRING(255), allowNull: true },
      reported_in_hazard: { type: Sequelize.STRING(255), allowNull: true },
      status_id: { type: Sequelize.STRING(255), allowNull: true },
      remarks: { type: Sequelize.TEXT, allowNull: true },

      // System tracking
      created_by: { type: Sequelize.UUID, allowNull: true },
      updated_by: { type: Sequelize.UUID, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('near_misses');
  },
};
