'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../../database/connection');

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: true, // Null for system actions
  },
  action: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'e.g. USER_LOGIN, USER_UPDATED, ROLE_DELETED',
  },
  resource: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Resource type (users, roles, etc.)',
  },
  resourceId: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  oldValues: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  newValues: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  ipAddress: {
    type: DataTypes.STRING(45),
    allowNull: true,
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  requestId: {
    type: DataTypes.STRING(36),
    allowNull: true,
  },
  statusCode: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  tableName: 'audit_logs',
  updatedAt: false, // Audit logs are immutable
  indexes: [
    { fields: ['user_id'] },
    { fields: ['action'] },
    { fields: ['resource'] },
    { fields: ['created_at'] },
  ],
});

module.exports = AuditLog;
