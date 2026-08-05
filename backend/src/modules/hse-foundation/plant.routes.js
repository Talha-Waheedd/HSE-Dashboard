'use strict';

const express = require('express');
const router = express.Router();
const plantController = require('./plant.controller');
const { validate } = require('../../core/middleware/validate.middleware');
const { authenticate } = require('../../core/middleware/auth.middleware');
const { requirePermissions } = require('../../core/middleware/rbac.middleware');
const { createPlantSchema, updatePlantSchema } = require('./plant.schema');
const { PERMISSIONS } = require('../../shared/constants/permissions');

// All plant routes require authentication
router.use(authenticate);

router.post(
  '/',
  requirePermissions([PERMISSIONS.HSE_MANAGE_PLANTS]),
  validate(createPlantSchema),
  plantController.createPlant
);

router.get(
  '/',
  requirePermissions([PERMISSIONS.HSE_VIEW_DASHBOARD]), // Basic view access
  plantController.getAllPlants
);

router.get(
  '/active',
  plantController.getActivePlants // Usually accessible by all authenticated users for dropdowns
);

router.get(
  '/:id',
  requirePermissions([PERMISSIONS.HSE_VIEW_DASHBOARD]),
  plantController.getPlantById
);

router.put(
  '/:id',
  requirePermissions([PERMISSIONS.HSE_MANAGE_PLANTS]),
  validate(updatePlantSchema),
  plantController.updatePlant
);

router.delete(
  '/:id',
  requirePermissions([PERMISSIONS.HSE_MANAGE_PLANTS]),
  plantController.deletePlant
);

module.exports = router;
