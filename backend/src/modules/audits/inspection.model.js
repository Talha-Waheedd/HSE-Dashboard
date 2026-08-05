'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../../database/connection');
const InspectionStatus = require('../../shared/enums/InspectionStatus');

/**
 * Inspection — Routine site/equipment inspections (Leading Indicator).
 * Lifecycle: scheduled → in_progress → completed / overdue / cancelled
 */
const Inspection = sequelize.define('Inspection', {
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
    comment: 'FK → departments.id',
  },
  inspectionNumber: {
    type: DataTypes.STRING(30),
    allowNull: true,
    unique: true,
    comment: 'Auto-generated, e.g. INS-2026-0001',
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  inspectionType: {
    type: DataTypes.ENUM('routine', 'special', 'regulatory'),
    allowNull: false,
    defaultValue: 'routine',
  },
  status: {
    type: DataTypes.ENUM(...Object.values(InspectionStatus)),
    defaultValue: InspectionStatus.SCHEDULED,
    allowNull: false,
  },
  inspectedBy: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'FK → users.id — lead inspector',
  },
  scheduledDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  completedDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  area: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Area/equipment being inspected',
  },
  summary: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  overallResult: {
    type: DataTypes.ENUM('pass', 'fail', 'conditional'),
    allowNull: true,
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
  tableName: 'inspections',
  paranoid: true,
  indexes: [
    { fields: ['inspection_number'], unique: true, name: 'inspections_number_unique' },
    { fields: ['plant_id'], name: 'inspections_plant_id_idx' },
    { fields: ['department_id'], name: 'inspections_department_id_idx' },
    { fields: ['inspected_by'], name: 'inspections_inspected_by_idx' },
    { fields: ['status'], name: 'inspections_status_idx' },
    { fields: ['scheduled_date'], name: 'inspections_date_idx' },
    { fields: ['overall_result'], name: 'inspections_result_idx' },
  ],
});

module.exports = Inspection;
