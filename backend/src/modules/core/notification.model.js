'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../../database/connection');
const NotificationType = require('../../shared/enums/NotificationType');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM(...Object.values(NotificationType)),
    defaultValue: NotificationType.INFO,
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  data: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Extra payload for frontend actions',
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  readAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'notifications',
  paranoid: true,
  indexes: [
    { fields: ['user_id'] },
    { fields: ['is_read'] },
    { fields: ['created_at'] },
  ],
});

module.exports = Notification;
