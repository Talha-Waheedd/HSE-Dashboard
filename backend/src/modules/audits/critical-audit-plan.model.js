'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../../database/connection');

const CriticalAuditPlan = sequelize.define('CriticalAuditPlan', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  plantId: { type: DataTypes.UUID, allowNull: false },
  sourceKey: { type: DataTypes.STRING(64), allowNull: false, unique: true },
  sourceFile: { type: DataTypes.STRING(255), allowNull: true },
  sourceSheet: { type: DataTypes.STRING(120), allowNull: true },
  sourceTitle: { type: DataTypes.STRING(255), allowNull: true },
  sourceRow: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  serialNumber: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  areaName: { type: DataTypes.TEXT, allowNull: false },
  areaOwners: { type: DataTypes.TEXT, allowNull: true },
  auditObjective: { type: DataTypes.TEXT, allowNull: true },
  riskRating: { type: DataTypes.STRING(20), allowNull: true },
  auditors: { type: DataTypes.TEXT, allowNull: true },
  frequency: { type: DataTypes.STRING(80), allowNull: true },
  status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'Pending' },
  scheduleData: { type: DataTypes.JSON, allowNull: true },
  importedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  importedBy: { type: DataTypes.UUID, allowNull: true },
}, {
  tableName: 'critical_audit_plans',
  paranoid: true,
  indexes: [
    { fields: ['source_key'], unique: true, name: 'critical_audit_plans_source_key_unique' },
    { fields: ['plant_id'], name: 'critical_audit_plans_plant_idx' },
    { fields: ['status'], name: 'critical_audit_plans_status_idx' },
  ],
});

module.exports = CriticalAuditPlan;
