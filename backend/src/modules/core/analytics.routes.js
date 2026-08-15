'use strict';

const express = require('express');
const router = express.Router();
const overviewController = require('./overview.controller');
const { authenticate } = require('../../core/middleware/auth.middleware');
const { requirePermissions } = require('../../core/middleware/rbac.middleware');
const { PERMISSIONS } = require('../../shared/constants/permissions');

router.use(authenticate);
router.get('/overview', requirePermissions([PERMISSIONS.HSE_VIEW_DASHBOARD]), overviewController.getAnalyticsOverview);

module.exports = router;
