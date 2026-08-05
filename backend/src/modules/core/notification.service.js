'use strict';

const notificationRepository = require('../../repositories/notification.repository');
const { buildPagination } = require('../../shared/utils/pagination');
const ApiError = require('../../shared/utils/ApiError');
const { MESSAGES } = require('../../shared/constants/messages');

class NotificationService {
  async getUserNotifications(userId, query) {
    const { limit, offset, meta } = buildPagination(query, 0);
    const { rows, count } = await notificationRepository.findByUser(userId, { limit, offset });
    return { notifications: rows, meta: { ...meta, total: count } };
  }

  async createNotification(data) {
    return notificationRepository.create(data);
  }

  async markAsRead(id, userId) {
    const [updated] = await notificationRepository.markOneRead(id, userId);
    if (!updated) throw ApiError.notFound(MESSAGES.NOT_FOUND);
  }

  async markAllAsRead(userId) {
    await notificationRepository.markAllRead(userId);
  }
}

module.exports = new NotificationService();
