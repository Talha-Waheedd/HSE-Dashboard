'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../../database/connection');
const TokenType = require('../../shared/enums/TokenType');

const Token = sequelize.define('Token', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  token: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM(...Object.values(TokenType)),
    allowNull: false,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  isRevoked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  ipAddress: {
    type: DataTypes.STRING(45),
    allowNull: true,
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'tokens',
  underscored: true,
  paranoid: false,
  indexes: [
    { fields: ['user_id'] },
    { fields: ['type'] },
    { fields: ['expires_at'] },
    { fields: ['is_revoked'] },
  ],
});

module.exports = Token;
