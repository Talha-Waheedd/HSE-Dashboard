'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('hazards', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      s_no: { type: Sequelize.STRING(50), allowNull: true },
      date: { type: Sequelize.DATEONLY, allowNull: false },
      department_id: { type: Sequelize.STRING(255), allowNull: true },
      location: { type: Sequelize.STRING(255), allowNull: true },
      originator: { type: Sequelize.STRING(255), allowNull: true },
      hazard_category_id: { type: Sequelize.STRING(255), allowNull: true },
      description: { type: Sequelize.TEXT, allowNull: true },
      unsafe_type: { type: Sequelize.STRING(255), allowNull: true },
      person_name: { type: Sequelize.STRING(255), allowNull: true },
      person_category: { type: Sequelize.STRING(255), allowNull: true },
      corrective_action: { type: Sequelize.TEXT, allowNull: true },
      responsible_person: { type: Sequelize.STRING(255), allowNull: true },
      target_date: { type: Sequelize.DATEONLY, allowNull: true },
      risk_rating_id: { type: Sequelize.STRING(255), allowNull: true },
      contractor_name: { type: Sequelize.STRING(255), allowNull: true },
      contractor_company: { type: Sequelize.STRING(255), allowNull: true },
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
    await queryInterface.dropTable('hazards');
  },
};
