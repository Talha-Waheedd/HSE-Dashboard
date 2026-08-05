'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../../database/connection');

const Permission = sequelize.define('Permission', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  key: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    comment: 'e.g. user:create, role:delete',
  },
  displayName: {
    type: DataTypes.STRING(150),
    allowNull: false,
    field: 'display_name',
  },
  group: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'e.g. user, role, notification',
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'permissions',
  paranoid: false,
  indexes: [{ fields: ['key'], unique: true }, { fields: ['group'] }],
});

module.exports = Permission;
