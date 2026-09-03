'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../../database/connection');
const SeverityLevel = require('../../shared/enums/SeverityLevel');

/**
 * AuditFinding — Individual findings raised during an HSE audit.
 * Many findings can exist per audit.
 */
const AuditFinding = sequelize.define('AuditFinding', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  auditId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'FK → audits.id',
  },
  standardReference: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'What was found',
  },
  severityLevel: {
    type: DataTypes.ENUM(...Object.values(SeverityLevel)),
    allowNull: true,
  },
  standardLimitRequirement: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  score: {
    type: DataTypes.TINYINT.UNSIGNED,
    allowNull: true,
    validate: { min: 1, max: 4 },
  },
  recommendation: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Recommended corrective action',
  },
  targetDate: { type: DataTypes.DATEONLY, allowNull: true },
  responsibility: { type: DataTypes.TEXT, allowNull: true },
  responsibleDepartmentId: { type: DataTypes.UUID, allowNull: true },
  sortOrder: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
  status: {
    type: DataTypes.ENUM('open', 'closed'),
    defaultValue: 'open',
    allowNull: false,
  },
  closedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'audit_findings',
  paranoid: false,
  indexes: [
    { fields: ['audit_id'], name: 'audit_findings_audit_id_idx' },
    { fields: ['status'], name: 'audit_findings_status_idx' },
    { fields: ['severity_level'], name: 'audit_findings_severity_idx' },
    { fields: ['responsible_department_id'], name: 'audit_findings_responsible_department_idx' },
  ],
});

module.exports = AuditFinding;
