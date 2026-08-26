'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../../database/connection');

const MasterAnalysis = sequelize.define('MasterAnalysis', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  sourceType: { type: DataTypes.STRING(40), allowNull: false, field: 'source_type' },
  sourceId: { type: DataTypes.UUID, allowNull: false, field: 'source_id' },
  analysisStatus: {
    type: DataTypes.ENUM('not_reviewed', 'under_review', 'completed'),
    allowNull: false,
    defaultValue: 'not_reviewed',
    field: 'analysis_status',
  },
  analysisData: { type: DataTypes.JSON, allowNull: true, field: 'analysis_data' },
  createdBy: { type: DataTypes.UUID, allowNull: true, field: 'created_by' },
  updatedBy: { type: DataTypes.UUID, allowNull: true, field: 'updated_by' },
}, {
  tableName: 'master_analyses',
  paranoid: true,
  indexes: [{ unique: true, fields: ['source_type', 'source_id'], name: 'master_analyses_source_unique' }],
});

module.exports = MasterAnalysis;
