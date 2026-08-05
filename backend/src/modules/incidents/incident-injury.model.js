'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../../database/connection');

/**
 * IncidentInjury — Injury details per incident.
 * Multiple injury records can exist per incident (multiple body parts).
 */
const IncidentInjury = sequelize.define('IncidentInjury', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  incidentId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'FK → incidents.id',
  },
  bodyPart: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'e.g. Head, Hand, Foot, Eye',
  },
  injuryType: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'e.g. Laceration, Fracture, Burn, Contusion, Sprain',
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'incident_injuries',
  paranoid: false,
  indexes: [
    { fields: ['incident_id'], name: 'incident_injuries_incident_id_idx' },
  ],
});

module.exports = IncidentInjury;
