'use strict';

const BaseRepository = require('./base.repository');
const { Notification } = require('../database/models');

class NotificationRepository extends BaseRepository {
  constructor() {
    super(Notification);
  }

  async findByUser(userId, options = {}) {
    return Notification.findAndCountAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      ...options,
    });
  }

  async markAllRead(userId, transaction = null) {
    return Notification.update(
      { isRead: true, readAt: new Date() },
      { where: { userId, isRead: false }, transaction },
    );
  }

  async markOneRead(id, userId, transaction = null) {
    return Notification.update(
      { isRead: true, readAt: new Date() },
      { where: { id, userId }, transaction },
    );
  }
}

module.exports = new NotificationRepository();
