'use strict';

const express = require('express');
const router = express.Router();
const inspectionController = require('./inspection.controller');
const { validate } = require('../../core/middleware/validate.middleware');
const { authenticate } = require('../../core/middleware/auth.middleware');
const { requirePermissions } = require('../../core/middleware/rbac.middleware');
const { createInspectionSchema, updateInspectionSchema, updateInspectionStatusSchema } = require('./inspection.schema');
const { PERMISSIONS } = require('../../shared/constants/permissions');

router.use(authenticate);

router.post(
  '/',
  requirePermissions([PERMISSIONS.HSE_MANAGE_INSPECTIONS]),
  validate(createInspectionSchema),
  inspectionController.createInspection
);

router.get(
  '/',
  requirePermissions([PERMISSIONS.HSE_VIEW_DASHBOARD]),
  inspectionController.getAllInspections
);

router.get(
  '/:id',
  requirePermissions([PERMISSIONS.HSE_VIEW_DASHBOARD]),
  inspectionController.getInspectionById
);

router.put(
  '/:id',
  requirePermissions([PERMISSIONS.HSE_MANAGE_INSPECTIONS]),
  validate(updateInspectionSchema),
  inspectionController.updateInspection
);

router.patch(
  '/:id/status',
  requirePermissions([PERMISSIONS.HSE_MANAGE_INSPECTIONS]),
  validate(updateInspectionStatusSchema),
  inspectionController.updateStatus
);

router.delete(
  '/:id',
  requirePermissions([PERMISSIONS.HSE_MANAGE_INSPECTIONS]),
  inspectionController.deleteInspection
);

module.exports = router;
