'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../../database/connection');

const DashboardIndicatorPreference = sequelize.define('DashboardIndicatorPreference', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    field: 'user_id',
  },
  leadingIndicatorIds: {
    type: DataTypes.JSON,
    allowNull: false,
    field: 'leading_indicator_ids',
  },
  laggingIndicatorIds: {
    type: DataTypes.JSON,
    allowNull: false,
    field: 'lagging_indicator_ids',
  },
}, {
  tableName: 'dashboard_indicator_preferences',
  timestamps: true,
  paranoid: false,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = DashboardIndicatorPreference;
