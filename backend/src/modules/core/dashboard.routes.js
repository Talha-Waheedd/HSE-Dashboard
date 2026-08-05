'use strict';

const express = require('express');
const router = express.Router();
const dashboardController = require('./dashboard.controller');
const { authenticate } = require('../../core/middleware/auth.middleware');
const { requirePermissions } = require('../../core/middleware/rbac.middleware');
const { PERMISSIONS } = require('../../shared/constants/permissions');

router.use(authenticate);

router.get(
  '/stats',
  requirePermissions([PERMISSIONS.HSE_VIEW_DASHBOARD]),
  dashboardController.getHseStats
);

module.exports = router;
