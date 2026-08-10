'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../../database/connection');
const IncidentType = require('../../shared/enums/IncidentType');
const IncidentStatus = require('../../shared/enums/IncidentStatus');
const SeverityLevel = require('../../shared/enums/SeverityLevel');

/**
 * Incident — Actual safety incidents (Lagging Indicator).
 * Covers: First Aid, MTC (Medical Treatment Case), LTI (Lost Time Injury),
 * RWC (Restricted Work Case), Fatality.
 * Lifecycle: draft → reported → under_investigation → corrective_action → closed
 */
const Incident = sequelize.define('Incident', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  incidentNumber: {
    type: DataTypes.STRING(30),
    allowNull: true,
    unique: true,
    comment: 'Auto-generated, e.g. INC-2026-0001',
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
  incidentType: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: IncidentStatus.DRAFT,
    allowNull: false,
  },
  severityLevel: {
    type: DataTypes.STRING,
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
  },
  incidentDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  incidentTime: {
    type: DataTypes.TIME,
    allowNull: true,
  },
  injuredPersonId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'FK → users.id — injured person if they are a system user',
  },
  injuredPersonName: {
    type: DataTypes.STRING(150),
    allowNull: true,
    comment: 'Name if injured person is not in the system',
  },
  lostDays: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Number of days lost — used for LTI calculations',
  },
  restrictedDays: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Number of restricted work days — used for RWC',
  },
  firstAidGiven: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  immediateAction: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Actions taken immediately after the incident',
  },
  investigatedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'FK → users.id',
  },
  investigationFindings: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  rootCause: {
    type: DataTypes.TEXT,
    allowNull: true,
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
    comment: 'Extensible form data, including incident action rows with responsible_person, responsible_department, timeline, severity, and status',
  },
}, {
  tableName: 'incidents',
  paranoid: true,
  indexes: [
    { fields: ['incident_number'], unique: true, name: 'incidents_number_unique' },
    { fields: ['reported_by'], name: 'incidents_reported_by_idx' },
    { fields: ['plant_id'], name: 'incidents_plant_id_idx' },
    { fields: ['department_id'], name: 'incidents_department_id_idx' },
    { fields: ['incident_type'], name: 'incidents_type_idx' },
    { fields: ['status'], name: 'incidents_status_idx' },
    { fields: ['incident_date'], name: 'incidents_date_idx' },
    { fields: ['severity_level'], name: 'incidents_severity_idx' },
  ],
});

module.exports = Incident;
