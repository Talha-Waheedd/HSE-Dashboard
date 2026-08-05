'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../../database/connection');
const Role = require('./role.model');

const User = sequelize.define('User', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true, allowNull: false },
  firstName: { type: DataTypes.STRING(100), allowNull: false, field: 'first_name' },
  lastName: { type: DataTypes.STRING(100), allowNull: false, field: 'last_name' },
  email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
  password: { type: DataTypes.STRING(255), allowNull: true },
  phone: { type: DataTypes.STRING(20), allowNull: true },
  avatar: { type: DataTypes.STRING(500), allowNull: true },
  status: { type: DataTypes.BOOLEAN, defaultValue: true },
  isEmailVerified: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_email_verified' },
  lastLoginAt: { type: DataTypes.DATE, allowNull: true, field: 'last_login_at' },
  roleId: { type: DataTypes.UUID, allowNull: true, field: 'role_id' },
  createdBy: { type: DataTypes.UUID, allowNull: true, field: 'created_by' },
  updatedBy: { type: DataTypes.UUID, allowNull: true, field: 'updated_by' },
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
  paranoid: true,
  defaultScope: {
    attributes: { exclude: ['password'] }
  },
  scopes: {
    withPassword: {
      attributes: {}
    }
  }
});

// Relationships defined centrally in models.js

module.exports = User;
