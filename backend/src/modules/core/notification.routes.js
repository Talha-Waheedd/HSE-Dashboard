'use strict';

const express = require('express');
const router = express.Router();

const NotificationController = require('./notification.controller');
const { authenticate } = require('../../core/middleware/auth.middleware');

router.use(authenticate);

router.get('/', NotificationController.getAll);
router.patch('/:id/read', NotificationController.markAsRead);
router.patch('/read-all', NotificationController.markAllAsRead);

module.exports = router;
