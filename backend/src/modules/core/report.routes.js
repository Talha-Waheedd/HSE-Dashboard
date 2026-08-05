'use strict';

const express = require('express');
const router = express.Router();
const reportController = require('./report.controller');
const { authenticate } = require('../../core/middleware/auth.middleware');
const { requirePermissions } = require('../../core/middleware/rbac.middleware');
const { PERMISSIONS } = require('../../shared/constants/permissions');
const reportingController = require('../reports/reporting.controller');
const { validate } = require('../../core/middleware/validate.middleware');
const { listSchema, widgetSchema, layoutSchema, reportSchema, kpiTargetSchema } = require('../reports/reporting.schema');

router.use(authenticate);

router.get(
  '/performance',
  requirePermissions([PERMISSIONS.HSE_VIEW_REPORTS]),
  reportController.getPerformanceReport
);

// Reporting control plane. The SQL schema for these resources is additive and
// uses the ra_ namespace; the existing performance endpoint remains intact.
router.get('/widgets', requirePermissions([PERMISSIONS.HSE_VIEW_DASHBOARD]), validate(listSchema, 'query'), reportingController.widgets.list);
router.post('/widgets', requirePermissions([PERMISSIONS.HSE_VIEW_REPORTS]), validate(widgetSchema), reportingController.widgets.create);
router.get('/widgets/:id', requirePermissions([PERMISSIONS.HSE_VIEW_DASHBOARD]), reportingController.widgets.get);
router.put('/widgets/:id', requirePermissions([PERMISSIONS.HSE_VIEW_REPORTS]), validate(widgetSchema), reportingController.widgets.update);
router.delete('/widgets/:id', requirePermissions([PERMISSIONS.HSE_VIEW_REPORTS]), reportingController.widgets.remove);

router.get('/layouts', requirePermissions([PERMISSIONS.HSE_VIEW_DASHBOARD]), validate(listSchema, 'query'), reportingController.layouts.list);
router.post('/layouts', requirePermissions([PERMISSIONS.HSE_VIEW_DASHBOARD]), validate(layoutSchema), reportingController.layouts.create);
router.put('/layouts/:id', requirePermissions([PERMISSIONS.HSE_VIEW_DASHBOARD]), validate(layoutSchema), reportingController.layouts.update);
router.delete('/layouts/:id', requirePermissions([PERMISSIONS.HSE_VIEW_DASHBOARD]), reportingController.layouts.remove);

router.get('/saved', requirePermissions([PERMISSIONS.HSE_VIEW_REPORTS]), validate(listSchema, 'query'), reportingController.reports.list);
router.post('/saved', requirePermissions([PERMISSIONS.HSE_VIEW_REPORTS]), validate(reportSchema), reportingController.reports.create);
router.get('/saved/:id', requirePermissions([PERMISSIONS.HSE_VIEW_REPORTS]), reportingController.reports.get);
router.put('/saved/:id', requirePermissions([PERMISSIONS.HSE_VIEW_REPORTS]), validate(reportSchema), reportingController.reports.update);
router.delete('/saved/:id', requirePermissions([PERMISSIONS.HSE_VIEW_REPORTS]), reportingController.reports.remove);

router.get('/schedules', requirePermissions([PERMISSIONS.HSE_VIEW_REPORTS]), validate(listSchema, 'query'), reportingController.schedules.list);
router.post('/schedules', requirePermissions([PERMISSIONS.HSE_VIEW_REPORTS]), reportingController.schedules.create);
router.put('/schedules/:id', requirePermissions([PERMISSIONS.HSE_VIEW_REPORTS]), reportingController.schedules.update);
router.delete('/schedules/:id', requirePermissions([PERMISSIONS.HSE_VIEW_REPORTS]), reportingController.schedules.remove);

router.get('/exports', requirePermissions([PERMISSIONS.HSE_VIEW_REPORTS]), validate(listSchema, 'query'), reportingController.exports.list);
router.post('/exports', requirePermissions([PERMISSIONS.REPORT_EXPORT]), reportingController.exports.create);

router.get('/kpis', requirePermissions([PERMISSIONS.HSE_VIEW_DASHBOARD]), validate(listSchema, 'query'), reportingController.kpis.list);
router.get('/snapshots', requirePermissions([PERMISSIONS.HSE_VIEW_DASHBOARD]), validate(listSchema, 'query'), reportingController.snapshots.list);
router.get('/risk-matrix', requirePermissions([PERMISSIONS.HSE_VIEW_DASHBOARD]), validate(listSchema, 'query'), reportingController.riskMatrix.list);

module.exports = router;
