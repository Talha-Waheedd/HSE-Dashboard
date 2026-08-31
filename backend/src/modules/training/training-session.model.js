'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../../database/connection');
const TrainingStatus = require('../../shared/enums/TrainingStatus');
const TrainingType = require('../../shared/enums/TrainingType');

/**
 * TrainingSession — Safety training sessions (Leading Indicator).
 * Lifecycle: scheduled → in_progress → completed / cancelled
 */
const TrainingSession = sequelize.define('TrainingSession', {
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
    comment: 'FK → departments.id — null means all departments',
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  trainingType: {
    type: DataTypes.ENUM(...Object.values(TrainingType)),
    allowNull: true,
  },
  customTrainingType: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM(...Object.values(TrainingStatus)),
    defaultValue: TrainingStatus.SCHEDULED,
    allowNull: false,
  },
  trainerId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'FK → users.id — who is conducting the training',
  },
  trainerName: { type: DataTypes.STRING(255), allowNull: true },
  scheduledDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  scheduledTime: {
    type: DataTypes.TIME,
    allowNull: true,
  },
  durationMinutes: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Planned duration in minutes',
  },
  venue: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  maxAttendees: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  participantCount: { type: DataTypes.INTEGER, allowNull: true },
  manhours: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
  sourceFingerprint: { type: DataTypes.STRING(64), allowNull: true },
  notes: {
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
}, {
  tableName: 'training_sessions',
  paranoid: true,
  indexes: [
    { fields: ['plant_id'], name: 'training_sessions_plant_id_idx' },
    { fields: ['department_id'], name: 'training_sessions_department_id_idx' },
    { fields: ['trainer_id'], name: 'training_sessions_trainer_id_idx' },
    { fields: ['status'], name: 'training_sessions_status_idx' },
    { fields: ['training_type'], name: 'training_sessions_type_idx' },
    { fields: ['scheduled_date'], name: 'training_sessions_date_idx' },
    { fields: ['source_fingerprint'], unique: true, name: 'training_sessions_source_fingerprint_unique' },
  ],
});

module.exports = TrainingSession;
