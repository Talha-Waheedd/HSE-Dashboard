'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('critical_audit_plans', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      plant_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'plants', key: 'id' }, onDelete: 'RESTRICT' },
      source_key: { type: Sequelize.STRING(64), allowNull: false },
      source_file: { type: Sequelize.STRING(255), allowNull: true },
      source_sheet: { type: Sequelize.STRING(120), allowNull: true },
      source_title: { type: Sequelize.STRING(255), allowNull: true },
      source_row: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true },
      serial_number: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true },
      area_name: { type: Sequelize.TEXT, allowNull: false },
      area_owners: { type: Sequelize.TEXT, allowNull: true },
      audit_objective: { type: Sequelize.TEXT, allowNull: true },
      risk_rating: { type: Sequelize.STRING(20), allowNull: true },
      auditors: { type: Sequelize.TEXT, allowNull: true },
      frequency: { type: Sequelize.STRING(80), allowNull: true },
      status: { type: Sequelize.STRING(20), allowNull: false, defaultValue: 'Pending' },
      schedule_data: { type: Sequelize.JSON, allowNull: true },
      imported_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      imported_by: { type: Sequelize.UUID, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });

    await queryInterface.addIndex('critical_audit_plans', ['source_key'], { unique: true, name: 'critical_audit_plans_source_key_unique' });
    await queryInterface.addIndex('critical_audit_plans', ['plant_id'], { name: 'critical_audit_plans_plant_idx' });
    await queryInterface.addIndex('critical_audit_plans', ['status'], { name: 'critical_audit_plans_status_idx' });

    await queryInterface.addColumn('audits', 'critical_audit_plan_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'critical_audit_plans', key: 'id' },
      onDelete: 'RESTRICT',
      after: 'department_id',
    });
    await queryInterface.addColumn('audits', 'area_owner', { type: Sequelize.TEXT, allowNull: true, after: 'title' });
    await queryInterface.addColumn('audits', 'audit_objective', { type: Sequelize.TEXT, allowNull: true, after: 'area_owner' });
    await queryInterface.addColumn('audits', 'risk_rating', { type: Sequelize.STRING(20), allowNull: true, after: 'audit_objective' });
    await queryInterface.addColumn('audits', 'auditors', { type: Sequelize.TEXT, allowNull: true, after: 'risk_rating' });
    await queryInterface.addColumn('audits', 'frequency', { type: Sequelize.STRING(80), allowNull: true, after: 'auditors' });
    await queryInterface.addColumn('audits', 'persons_interviewed', { type: Sequelize.TEXT, allowNull: true, after: 'frequency' });
    await queryInterface.addIndex('audits', ['critical_audit_plan_id'], { name: 'audits_critical_plan_idx' });
    await queryInterface.addIndex('audits', ['critical_audit_plan_id', 'scheduled_date'], {
      unique: true,
      name: 'audits_plan_scheduled_date_unique',
    });

    await queryInterface.changeColumn('audit_findings', 'severity_level', {
      type: Sequelize.ENUM('low', 'medium', 'high', 'critical'),
      allowNull: true,
    });
    await queryInterface.addColumn('audit_findings', 'standard_reference', { type: Sequelize.STRING(255), allowNull: true, after: 'audit_id' });
    await queryInterface.addColumn('audit_findings', 'standard_limit_requirement', { type: Sequelize.TEXT, allowNull: true, after: 'description' });
    await queryInterface.addColumn('audit_findings', 'score', { type: Sequelize.TINYINT.UNSIGNED, allowNull: true, after: 'standard_limit_requirement' });
    await queryInterface.addColumn('audit_findings', 'target_date', { type: Sequelize.DATEONLY, allowNull: true, after: 'recommendation' });
    await queryInterface.addColumn('audit_findings', 'responsibility', { type: Sequelize.TEXT, allowNull: true, after: 'target_date' });
    await queryInterface.addColumn('audit_findings', 'responsible_department_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'departments', key: 'id' },
      onDelete: 'SET NULL',
      after: 'responsibility',
    });
    await queryInterface.addColumn('audit_findings', 'sort_order', { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0, after: 'responsible_department_id' });
    await queryInterface.addIndex('audit_findings', ['responsible_department_id'], { name: 'audit_findings_responsible_department_idx' });
    await queryInterface.sequelize.query(
      'ALTER TABLE `audit_findings` ADD CONSTRAINT `audit_findings_score_range` CHECK (`score` IS NULL OR (`score` BETWEEN 1 AND 4))',
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query('ALTER TABLE `audit_findings` DROP CHECK `audit_findings_score_range`');
    await queryInterface.removeIndex('audit_findings', 'audit_findings_responsible_department_idx');
    await queryInterface.removeColumn('audit_findings', 'sort_order');
    await queryInterface.removeColumn('audit_findings', 'responsible_department_id');
    await queryInterface.removeColumn('audit_findings', 'responsibility');
    await queryInterface.removeColumn('audit_findings', 'target_date');
    await queryInterface.removeColumn('audit_findings', 'score');
    await queryInterface.removeColumn('audit_findings', 'standard_limit_requirement');
    await queryInterface.removeColumn('audit_findings', 'standard_reference');
    await queryInterface.sequelize.query("UPDATE `audit_findings` SET `severity_level` = 'low' WHERE `severity_level` IS NULL");
    await queryInterface.changeColumn('audit_findings', 'severity_level', {
      type: Sequelize.ENUM('low', 'medium', 'high', 'critical'),
      allowNull: false,
    });

    await queryInterface.removeIndex('audits', 'audits_plan_scheduled_date_unique');
    await queryInterface.removeIndex('audits', 'audits_critical_plan_idx');
    await queryInterface.removeColumn('audits', 'persons_interviewed');
    await queryInterface.removeColumn('audits', 'frequency');
    await queryInterface.removeColumn('audits', 'auditors');
    await queryInterface.removeColumn('audits', 'risk_rating');
    await queryInterface.removeColumn('audits', 'audit_objective');
    await queryInterface.removeColumn('audits', 'area_owner');
    await queryInterface.removeColumn('audits', 'critical_audit_plan_id');
    await queryInterface.dropTable('critical_audit_plans');
  },
};
