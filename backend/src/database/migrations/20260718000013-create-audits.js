'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Audits table
    await queryInterface.createTable('audits', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      plant_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'plants', key: 'id' }, onDelete: 'RESTRICT' },
      department_id: { type: Sequelize.UUID, allowNull: true, references: { model: 'departments', key: 'id' }, onDelete: 'SET NULL' },
      audit_number: { type: Sequelize.STRING(30), allowNull: true, unique: true },
      title: { type: Sequelize.STRING(255), allowNull: false },
      audit_type: { type: Sequelize.ENUM('internal', 'external', 'regulatory'), defaultValue: 'internal', allowNull: false },
      status: { type: Sequelize.ENUM('planned', 'in_progress', 'completed', 'cancelled'), defaultValue: 'planned', allowNull: false },
      audited_by: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'RESTRICT' },
      scheduled_date: { type: Sequelize.DATEONLY, allowNull: false },
      completed_date: { type: Sequelize.DATEONLY, allowNull: true },
      scope: { type: Sequelize.TEXT, allowNull: true },
      summary: { type: Sequelize.TEXT, allowNull: true },
      score: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
      created_by: { type: Sequelize.UUID, allowNull: true },
      updated_by: { type: Sequelize.UUID, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });

    await queryInterface.addIndex('audits', ['audit_number'], { unique: true, name: 'audits_number_unique' });
    await queryInterface.addIndex('audits', ['plant_id'], { name: 'audits_plant_id_idx' });
    await queryInterface.addIndex('audits', ['department_id'], { name: 'audits_department_id_idx' });
    await queryInterface.addIndex('audits', ['audited_by'], { name: 'audits_audited_by_idx' });
    await queryInterface.addIndex('audits', ['status'], { name: 'audits_status_idx' });
    await queryInterface.addIndex('audits', ['audit_type'], { name: 'audits_type_idx' });
    await queryInterface.addIndex('audits', ['scheduled_date'], { name: 'audits_scheduled_date_idx' });

    // Audit findings table
    await queryInterface.createTable('audit_findings', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      audit_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'audits', key: 'id' }, onDelete: 'CASCADE' },
      description: { type: Sequelize.TEXT, allowNull: false },
      severity_level: { type: Sequelize.ENUM('low', 'medium', 'high', 'critical'), allowNull: false },
      recommendation: { type: Sequelize.TEXT, allowNull: true },
      status: { type: Sequelize.ENUM('open', 'closed'), defaultValue: 'open', allowNull: false },
      closed_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('audit_findings', ['audit_id'], { name: 'audit_findings_audit_id_idx' });
    await queryInterface.addIndex('audit_findings', ['status'], { name: 'audit_findings_status_idx' });
    await queryInterface.addIndex('audit_findings', ['severity_level'], { name: 'audit_findings_severity_idx' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('audit_findings');
    await queryInterface.dropTable('audits');
  },
};
