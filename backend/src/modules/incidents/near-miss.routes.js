'use strict';

const express = require('express');
const router = express.Router();
const nearMissController = require('./near-miss.controller');
const { validate } = require('../../core/middleware/validate.middleware');
const { authenticate } = require('../../core/middleware/auth.middleware');
const { requirePermissions } = require('../../core/middleware/rbac.middleware');
const { createNearMissSchema, updateNearMissSchema, updateNearMissStatusSchema } = require('./near-miss.schema');
const { PERMISSIONS } = require('../../shared/constants/permissions');

router.use(authenticate);

router.post(
  '/',
  requirePermissions([PERMISSIONS.NEAR_MISS_CREATE]),
  validate(createNearMissSchema),
  nearMissController.createNearMiss
);

router.get(
  '/',
  requirePermissions([PERMISSIONS.HSE_VIEW_REPORTS]),
  nearMissController.getAllNearMisses
);

router.get(
  '/:id',
  requirePermissions([PERMISSIONS.HSE_VIEW_REPORTS]),
  nearMissController.getNearMissById
);

router.put(
  '/:id',
  requirePermissions([PERMISSIONS.HSE_MANAGE_INCIDENTS]),
  validate(updateNearMissSchema),
  nearMissController.updateNearMiss
);

router.patch(
  '/:id/status',
  requirePermissions([PERMISSIONS.HSE_MANAGE_INCIDENTS]),
  validate(updateNearMissStatusSchema),
  nearMissController.updateStatus
);

router.delete(
  '/:id',
  requirePermissions([PERMISSIONS.HSE_MANAGE_INCIDENTS]),
  nearMissController.deleteNearMiss
);

module.exports = router;
