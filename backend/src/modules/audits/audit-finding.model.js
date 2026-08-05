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
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'What was found',
  },
  severityLevel: {
    type: DataTypes.ENUM(...Object.values(SeverityLevel)),
    allowNull: false,
  },
  recommendation: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Recommended corrective action',
  },
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
  ],
});

module.exports = AuditFinding;
