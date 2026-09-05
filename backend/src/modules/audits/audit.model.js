'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../../database/connection');
const AuditStatus = require('../../shared/enums/AuditStatus');

/**
 * HseAudit — Formal HSE audits (Leading Indicator).
 * Named HseAudit to avoid conflict with the existing AuditLog model.
 * Lifecycle: planned → in_progress → completed / cancelled
 */
const HseAudit = sequelize.define('HseAudit', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  plantId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'FK → plants.id',
  },
  departmentId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'FK → departments.id — null means plant-wide audit',
  },
  criticalAuditPlanId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'FK to the master Critical Audit Plan row that scheduled this occurrence',
  },
  auditNumber: {
    type: DataTypes.STRING(30),
    allowNull: true,
    unique: true,
    comment: 'Auto-generated, e.g. AUD-2026-0001',
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  areaOwner: { type: DataTypes.TEXT, allowNull: true },
  auditObjective: { type: DataTypes.TEXT, allowNull: true },
  riskRating: { type: DataTypes.STRING(20), allowNull: true },
  auditors: { type: DataTypes.TEXT, allowNull: true },
  frequency: { type: DataTypes.STRING(80), allowNull: true },
  personsInterviewed: { type: DataTypes.TEXT, allowNull: true },
  auditType: {
    type: DataTypes.ENUM('internal', 'external', 'regulatory'),
    allowNull: false,
    defaultValue: 'internal',
  },
  source: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: 'manual',
  },
  status: {
    type: DataTypes.ENUM(...Object.values(AuditStatus)),
    defaultValue: AuditStatus.PLANNED,
    allowNull: false,
  },
  auditedBy: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'FK → users.id — lead auditor',
  },
  scheduledDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  completedDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  scope: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'What was audited',
  },
  summary: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  score: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    comment: 'Overall audit score 0-100',
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  updatedBy: {
    type: DataTypes.UUID,
    allowNull: true,
  },
}, {
  tableName: 'audits',
  paranoid: true,
  indexes: [
    { fields: ['audit_number'], unique: true, name: 'audits_number_unique' },
    { fields: ['plant_id'], name: 'audits_plant_id_idx' },
    { fields: ['department_id'], name: 'audits_department_id_idx' },
    { fields: ['audited_by'], name: 'audits_audited_by_idx' },
    { fields: ['status'], name: 'audits_status_idx' },
    { fields: ['audit_type'], name: 'audits_type_idx' },
    { fields: ['scheduled_date'], name: 'audits_scheduled_date_idx' },
    { fields: ['critical_audit_plan_id'], name: 'audits_critical_plan_idx' },
    { fields: ['critical_audit_plan_id', 'scheduled_date'], unique: true, name: 'audits_plan_scheduled_date_unique' },
  ],
});

module.exports = HseAudit;
