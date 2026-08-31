'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../../database/connection');

const HseActionItem = sequelize.define('HseActionItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  sourceHash: {
    type: DataTypes.STRING(64),
    allowNull: false,
    unique: true,
    field: 'source_hash',
    comment: 'SHA-256 hash of core fields to prevent duplicate imports',
  },
  srNo: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'sr_no',
  },
  dateText: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'date_text',
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  month: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  auditorName: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'auditor_name',
  },
  actionDerivedFrom: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'action_derived_from',
  },
  auditDescription: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'audit_description',
  },
  areaClauses: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'area_clauses',
  },
  recommendation: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  severity: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  responsibleDepartment: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'responsible_department',
  },
  responsibleManager: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'responsible_manager',
  },
  targetDateText: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'target_date_text',
  },
  targetDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'target_date',
  },
  status: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  plantId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'plant_id',
  },
}, {
  tableName: 'hse_action_items',
  paranoid: true,
  underscored: true,
  indexes: [
    { fields: ['source_hash'], name: 'hse_action_items_source_hash_idx' },
    { fields: ['date'], name: 'hse_action_items_date_idx' },
    { fields: ['plant_id'], name: 'hse_action_items_plant_id_idx' },
  ],
});

module.exports = HseActionItem;
