'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../../database/connection');
const HazardStatus = require('../../shared/enums/HazardStatus');
const HazardCategory = require('../../shared/enums/HazardCategory');
const SeverityLevel = require('../../shared/enums/SeverityLevel');

/**
 * Hazard — Unsafe condition reports (Leading Indicator).
 * Lifecycle: draft → submitted → under_review → resolved / closed
 */
const Hazard = sequelize.define('Hazard', {
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
  category: {
    type: DataTypes.ENUM(...Object.values(HazardCategory)),
    allowNull: false,
  },
  severityLevel: {
    type: DataTypes.ENUM(...Object.values(SeverityLevel)),
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  location: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Specific location within the plant',
  },
  status: {
    type: DataTypes.ENUM(...Object.values(HazardStatus)),
    defaultValue: HazardStatus.DRAFT,
    allowNull: false,
  },
  assignedTo: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'FK → users.id — HSE officer assigned to handle',
  },
  actionTaken: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  resolvedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  resolvedBy: {
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
    comment: 'When the hazard was actually observed (may differ from createdAt)',
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
  tableName: 'hazards',
  paranoid: true,
  indexes: [
    { fields: ['reported_by'], name: 'hazards_reported_by_idx' },
    { fields: ['plant_id'], name: 'hazards_plant_id_idx' },
    { fields: ['department_id'], name: 'hazards_department_id_idx' },
    { fields: ['status'], name: 'hazards_status_idx' },
    { fields: ['severity_level'], name: 'hazards_severity_level_idx' },
    { fields: ['category'], name: 'hazards_category_idx' },
    { fields: ['created_at'], name: 'hazards_created_at_idx' },
  ],
});

module.exports = Hazard;
