'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../../database/connection');
const SeverityLevel = require('../../shared/enums/SeverityLevel');

const NearMissStatus = Object.freeze({
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  UNDER_REVIEW: 'under_review',
  CLOSED: 'closed',
});

/**
 * NearMiss — Events that almost caused an incident (Leading Indicator).
 * Lifecycle: draft → submitted → under_review → closed
 */
const NearMiss = sequelize.define('NearMiss', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  reportedBy: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'FK → users.id',
  },
  plantId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'FK → plants.id',
  },
  departmentId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'FK → departments.id',
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'What happened and how it was avoided',
  },
  location: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  severityLevel: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: NearMissStatus.DRAFT,
    allowNull: false,
  },
  immediateAction: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Action taken immediately after the near miss',
  },
  rootCause: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  assignedTo: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'FK → users.id',
  },
  closedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  closedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'FK → users.id',
  },
  reportedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When the near miss actually occurred',
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  updatedBy: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
  },
}, {
  tableName: 'near_misses',
  paranoid: true,
  indexes: [
    { fields: ['reported_by'], name: 'near_misses_reported_by_idx' },
    { fields: ['plant_id'], name: 'near_misses_plant_id_idx' },
    { fields: ['department_id'], name: 'near_misses_department_id_idx' },
    { fields: ['status'], name: 'near_misses_status_idx' },
    { fields: ['severity_level'], name: 'near_misses_severity_level_idx' },
    { fields: ['created_at'], name: 'near_misses_created_at_idx' },
  ],
});

module.exports = NearMiss;
