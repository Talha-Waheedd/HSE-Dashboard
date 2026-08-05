'use strict';

const express = require('express');
const router = express.Router();
const incidentController = require('./incident.controller');
const { validate } = require('../../core/middleware/validate.middleware');
const { authenticate } = require('../../core/middleware/auth.middleware');
const { requirePermissions } = require('../../core/middleware/rbac.middleware');
const { createIncidentSchema, updateIncidentSchema, updateIncidentStatusSchema } = require('./incident.schema');
const { PERMISSIONS } = require('../../shared/constants/permissions');

router.use(authenticate);

router.post(
  '/',
  requirePermissions([PERMISSIONS.HSE_REPORT_INCIDENT]),
  validate(createIncidentSchema),
  incidentController.createIncident
);

router.get(
  '/',
  requirePermissions([PERMISSIONS.HSE_VIEW_REPORTS]),
  incidentController.getAllIncidents
);

router.get(
  '/:id',
  requirePermissions([PERMISSIONS.HSE_VIEW_REPORTS]),
  incidentController.getIncidentById
);

router.put(
  '/:id',
  requirePermissions([PERMISSIONS.HSE_MANAGE_INCIDENTS]),
  validate(updateIncidentSchema),
  incidentController.updateIncident
);

router.patch(
  '/:id/status',
  requirePermissions([PERMISSIONS.HSE_MANAGE_INCIDENTS]),
  validate(updateIncidentStatusSchema),
  incidentController.updateStatus
);

router.delete(
  '/:id',
  requirePermissions([PERMISSIONS.HSE_MANAGE_INCIDENTS]),
  incidentController.deleteIncident
);

module.exports = router;
