'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../../database/connection');

/**
 * Department — Belongs to a plant.
 * Employees belong to departments. HSE records can be scoped to a department.
 */
const Department = sequelize.define('Department', {
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
  name: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  code: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: 'Short code, e.g. PROD, QA, HSE',
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  managerId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'FK → users.id — department manager',
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
  tableName: 'departments',
  paranoid: true,
  indexes: [
    { fields: ['plant_id'], name: 'departments_plant_id_idx' },
    { fields: ['manager_id'], name: 'departments_manager_id_idx' },
    { fields: ['is_active'], name: 'departments_is_active_idx' },
  ],
});

module.exports = Department;
