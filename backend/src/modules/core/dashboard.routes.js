'use strict';

const express = require('express');
const router = express.Router();
const dashboardController = require('./dashboard.controller');
const overviewController = require('./overview.controller');
const { authenticate } = require('../../core/middleware/auth.middleware');
const { requirePermissions } = require('../../core/middleware/rbac.middleware');
const { validate } = require('../../core/middleware/validate.middleware');
const { PERMISSIONS } = require('../../shared/constants/permissions');
const { updateDashboardPreferenceSchema } = require('./dashboard-preference.schema');
const {
  dashboardAnalyticsParamsSchema,
  dashboardAnalyticsQuerySchema,
} = require('./dashboard-analytics.schema');

router.use(authenticate);

router.get('/preferences', dashboardController.getIndicatorPreferences);
router.put(
  '/preferences',
  validate(updateDashboardPreferenceSchema),
  dashboardController.updateIndicatorPreferences,
);

router.get(
  '/analytics',
  requirePermissions([PERMISSIONS.HSE_VIEW_DASHBOARD]),
  dashboardController.getAnalyticsCatalog,
);

router.get(
  '/analytics/:dataset',
  requirePermissions([PERMISSIONS.HSE_VIEW_DASHBOARD]),
  validate(dashboardAnalyticsParamsSchema, 'params'),
  validate(dashboardAnalyticsQuerySchema, 'query'),
  dashboardController.getAnalytics,
);

router.get(
  '/stats',
  requirePermissions([PERMISSIONS.HSE_VIEW_DASHBOARD]),
  dashboardController.getHseStats,
);

router.get(
  '/overview',
  requirePermissions([PERMISSIONS.HSE_VIEW_DASHBOARD]),
  overviewController.getDashboardOverview,
);

module.exports = router;
