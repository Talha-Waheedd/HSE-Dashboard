'use strict';

const express = require('express');
const router = express.Router();
const hazardController = require('./hazard.controller');
const { validate } = require('../../core/middleware/validate.middleware');
const { authenticate } = require('../../core/middleware/auth.middleware');
const { requirePermissions } = require('../../core/middleware/rbac.middleware');
const { createHazardSchema, updateHazardSchema, updateHazardStatusSchema } = require('./hazard.schema');
const { PERMISSIONS } = require('../../shared/constants/permissions');

router.use(authenticate);

router.post(
  '/',
  requirePermissions([PERMISSIONS.HSE_REPORT_HAZARD]),
  validate(createHazardSchema),
  hazardController.createHazard
);

router.get(
  '/',
  requirePermissions([PERMISSIONS.HSE_VIEW_REPORTS]),
  hazardController.getAllHazards
);

router.get(
  '/:id',
  requirePermissions([PERMISSIONS.HSE_VIEW_REPORTS]),
  hazardController.getHazardById
);

router.put(
  '/:id',
  requirePermissions([PERMISSIONS.HSE_MANAGE_INCIDENTS]), // Typically supervisors/HSE team can edit
  validate(updateHazardSchema),
  hazardController.updateHazard
);

router.patch(
  '/:id/status',
  requirePermissions([PERMISSIONS.HSE_MANAGE_INCIDENTS]),
  validate(updateHazardStatusSchema),
  hazardController.updateStatus
);

router.delete(
  '/:id',
  requirePermissions([PERMISSIONS.HSE_MANAGE_INCIDENTS]),
  hazardController.deleteHazard
);

module.exports = router;
