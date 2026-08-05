'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../../database/connection');

/**
 * TrainingAttendee — Records who attended a training session.
 * Junction table with extra payload (attended flag, signature, remarks).
 */
const TrainingAttendee = sequelize.define('TrainingAttendee', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  sessionId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'FK → training_sessions.id',
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'FK → users.id — the attendee',
  },
  attended: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether the attendee actually attended',
  },
  signatureUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'URL to signature image',
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  markedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'FK → users.id — who marked attendance',
  },
  markedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'training_attendees',
  paranoid: false,
  indexes: [
    { fields: ['session_id'], name: 'training_attendees_session_id_idx' },
    { fields: ['user_id'], name: 'training_attendees_user_id_idx' },
    { fields: ['session_id', 'user_id'], unique: true, name: 'training_attendees_session_user_unique' },
    { fields: ['attended'], name: 'training_attendees_attended_idx' },
  ],
});

module.exports = TrainingAttendee;
