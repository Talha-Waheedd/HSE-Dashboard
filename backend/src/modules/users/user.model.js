'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../../database/connection');
const Role = require('./role.model');

const User = sequelize.define('User', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true, allowNull: false },
  first_name: { type: DataTypes.STRING(100), allowNull: false },
  last_name: { type: DataTypes.STRING(100), allowNull: false },
  email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
  password: { type: DataTypes.STRING(255), allowNull: true },
  phone: { type: DataTypes.STRING(20), allowNull: true },
  avatar: { type: DataTypes.STRING(500), allowNull: true },
  status: { type: DataTypes.BOOLEAN, defaultValue: true },
  is_email_verified: { type: DataTypes.BOOLEAN, defaultValue: false },
  last_login_at: { type: DataTypes.DATE, allowNull: true },
  role_id: { type: DataTypes.UUID, allowNull: true },
  created_by: { type: DataTypes.UUID, allowNull: true },
  updated_by: { type: DataTypes.UUID, allowNull: true },
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

// Relationships
User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });
Role.hasMany(User, { foreignKey: 'role_id', as: 'users' });

module.exports = User;
