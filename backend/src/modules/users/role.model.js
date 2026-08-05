'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../../database/connection');

const Role = sequelize.define('Role', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true, allowNull: false },
  name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  displayName: { type: DataTypes.STRING(150), allowNull: false, field: 'display_name' },
  description: { type: DataTypes.TEXT, allowNull: true },
  isSystem: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_system' },
}, {
  tableName: 'roles',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
  paranoid: true,
});

module.exports = Role;
