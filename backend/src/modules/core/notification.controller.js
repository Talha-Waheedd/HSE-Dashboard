'use strict';

const notificationService = require('./notification.service');
const ApiResponse = require('../../shared/utils/ApiResponse');
const asyncHandler = require('../../shared/utils/asyncHandler');
const { HTTP_STATUS } = require('../../shared/constants/httpStatus');
const { MESSAGES } = require('../../shared/constants/messages');

class NotificationController {
  getAll = asyncHandler(async (req, res) => {
    const { notifications, meta } = await notificationService.getUserNotifications(req.user.id, req.query);
    res.status(HTTP_STATUS.OK).json(
      ApiResponse.paginated(notifications, MESSAGES.NOTIFICATIONS_FETCHED, meta),
    );
  });

  markAsRead = asyncHandler(async (req, res) => {
    await notificationService.markAsRead(req.params.id, req.user.id);
    res.status(HTTP_STATUS.OK).json(ApiResponse.success(null, MESSAGES.NOTIFICATION_MARKED_READ));
  });

  markAllAsRead = asyncHandler(async (req, res) => {
    await notificationService.markAllAsRead(req.user.id);
    res.status(HTTP_STATUS.OK).json(ApiResponse.success(null, MESSAGES.ALL_NOTIFICATIONS_READ));
  });
}

module.exports = new NotificationController();
