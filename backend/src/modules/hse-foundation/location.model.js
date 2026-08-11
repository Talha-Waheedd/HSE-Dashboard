'use strict';
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../database/connection');

const Location = sequelize.define('Location', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  plantId: { type: DataTypes.UUID, allowNull: true },
  name: { type: DataTypes.STRING(255), allowNull: false },
  code: { type: DataTypes.STRING(80), allowNull: true, unique: true },
  normalizedName: { type: DataTypes.STRING(255), allowNull: false, unique: true },
  isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  createdBy: { type: DataTypes.UUID, allowNull: true },
  updatedBy: { type: DataTypes.UUID, allowNull: true },
}, {
  tableName: 'locations',
  paranoid: true,
  indexes: [
    { fields: ['normalized_name'], unique: true, name: 'locations_normalized_name_unique' },
    { fields: ['code'], unique: true, name: 'locations_code_unique' },
    { fields: ['plant_id', 'is_active'], name: 'locations_plant_active_idx' },
  ],
});

module.exports = Location;
