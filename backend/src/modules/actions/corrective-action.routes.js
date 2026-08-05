'use strict';

const express = require('express');
const router = express.Router();
const correctiveActionController = require('./corrective-action.controller');
const { validate } = require('../../core/middleware/validate.middleware');
const { authenticate } = require('../../core/middleware/auth.middleware');
const { requirePermissions } = require('../../core/middleware/rbac.middleware');
const { createCorrectiveActionSchema, updateCorrectiveActionSchema, updateCorrectiveActionStatusSchema } = require('./corrective-action.schema');
const { PERMISSIONS } = require('../../shared/constants/permissions');

router.use(authenticate);

router.post(
  '/',
  requirePermissions([PERMISSIONS.HSE_MANAGE_INCIDENTS]), // Assumed as base permission to create actions
  validate(createCorrectiveActionSchema),
  correctiveActionController.createAction
);

router.get(
  '/',
  requirePermissions([PERMISSIONS.HSE_VIEW_REPORTS]),
  correctiveActionController.getAllActions
);

router.get(
  '/source/:sourceType/:sourceId',
  requirePermissions([PERMISSIONS.HSE_VIEW_REPORTS]),
  correctiveActionController.getActionsBySource
);

router.get(
  '/:id',
  requirePermissions([PERMISSIONS.HSE_VIEW_REPORTS]),
  correctiveActionController.getActionById
);

router.put(
  '/:id',
  requirePermissions([PERMISSIONS.HSE_MANAGE_INCIDENTS]),
  validate(updateCorrectiveActionSchema),
  correctiveActionController.updateAction
);

router.patch(
  '/:id/status',
  requirePermissions([PERMISSIONS.HSE_MANAGE_INCIDENTS]),
  validate(updateCorrectiveActionStatusSchema),
  correctiveActionController.updateStatus
);

router.delete(
  '/:id',
  requirePermissions([PERMISSIONS.HSE_MANAGE_INCIDENTS]),
  correctiveActionController.deleteAction
);

module.exports = router;
