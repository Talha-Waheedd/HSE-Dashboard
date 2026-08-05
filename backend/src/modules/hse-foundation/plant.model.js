'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../../database/connection');

/**
 * Plant — Top-level organizational unit.
 * All HSE records (hazards, incidents, training, etc.) belong to a plant.
 */
const Plant = sequelize.define('Plant', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  code: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    comment: 'Short unique code, e.g. CBL-KHI',
  },
  location: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  country: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: 'Pakistan',
  },
  contactName: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  contactEmail: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  contactPhone: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
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
  tableName: 'plants',
  paranoid: true,
  indexes: [
    { fields: ['code'], unique: true, name: 'plants_code_unique' },
    { fields: ['is_active'], name: 'plants_is_active_idx' },
  ],
});

module.exports = Plant;
