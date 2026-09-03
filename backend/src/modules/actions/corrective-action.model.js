'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../../database/connection');
const CorrectiveActionStatus = require('../../shared/enums/CorrectiveActionStatus');
const CorrectiveActionSource = require('../../shared/enums/CorrectiveActionSource');
const SeverityLevel = require('../../shared/enums/SeverityLevel');

/**
 * CorrectiveAction — Actions assigned to resolve findings from any HSE source.
 * Polymorphic: sourceType + sourceId links to hazard, incident, audit, or inspection.
 * No hard FK on sourceId since the target table varies (same pattern as audit_logs.resource).
 */
const CorrectiveAction = sequelize.define('CorrectiveAction', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  capaNumber: {
    type: DataTypes.STRING(40),
    allowNull: false,
    unique: true,
    comment: 'Readable register reference; the UUID remains the primary key',
  },
  sourceType: {
    type: DataTypes.ENUM(...Object.values(CorrectiveActionSource)),
    allowNull: false,
    comment: 'Type of source record this action addresses',
  },
  sourceId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'Polymorphic FK — ID of the source record (hazard/incident/audit/inspection)',
  },
  sourceItemId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'Optional child item ID, such as an Audit Finding',
  },
  sourceItemKey: {
    type: DataTypes.STRING(80),
    allowNull: false,
    comment: 'Stable deduplication key within the source record',
  },
  sourceReference: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  incidentCategory: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  plantId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'FK → plants.id',
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  responsibleDepartmentId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'FK to the central departments master',
  },
  responsibility: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Source-provided person or responsibility text',
  },
  assignedTo: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'FK → users.id — who must complete this action',
  },
  assignedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'FK → users.id — who assigned this action',
  },
  dueDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM(...Object.values(CorrectiveActionStatus)),
    defaultValue: CorrectiveActionStatus.OPEN,
    allowNull: false,
  },
  priority: {
    type: DataTypes.ENUM(...Object.values(SeverityLevel)),
    allowNull: true,
    defaultValue: null,
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  completedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'FK → users.id',
  },
  verifiedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  verifiedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'FK → users.id — HSE officer who verified completion',
  },
  verificationNotes: {
    type: DataTypes.TEXT,
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
  lastSyncedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'corrective_actions',
  paranoid: true,
  indexes: [
    { fields: ['source_type', 'source_id'], name: 'ca_source_idx' },
    { fields: ['capa_number'], unique: true, name: 'corrective_actions_capa_number_unique' },
    { fields: ['source_type', 'source_id', 'source_item_key'], unique: true, name: 'corrective_actions_source_item_unique' },
    { fields: ['incident_category'], name: 'corrective_actions_incident_category_idx' },
    { fields: ['responsible_department_id'], name: 'corrective_actions_responsible_department_idx' },
    { fields: ['plant_id'], name: 'ca_plant_id_idx' },
    { fields: ['assigned_to'], name: 'ca_assigned_to_idx' },
    { fields: ['status'], name: 'ca_status_idx' },
    { fields: ['due_date'], name: 'ca_due_date_idx' },
    { fields: ['priority'], name: 'ca_priority_idx' },
  ],
});

module.exports = CorrectiveAction;
