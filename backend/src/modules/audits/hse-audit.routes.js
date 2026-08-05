'use strict';

const express = require('express');
const router = express.Router();
const hseAuditController = require('./hse-audit.controller');
const { validate } = require('../../core/middleware/validate.middleware');
const { authenticate } = require('../../core/middleware/auth.middleware');
const { requirePermissions } = require('../../core/middleware/rbac.middleware');
const { createAuditSchema, updateAuditSchema, updateAuditStatusSchema } = require('./audit.schema');
const { PERMISSIONS } = require('../../shared/constants/permissions');

router.use(authenticate);

router.post(
  '/',
  requirePermissions([PERMISSIONS.HSE_MANAGE_AUDITS]),
  validate(createAuditSchema),
  hseAuditController.createAudit
);

router.get(
  '/',
  requirePermissions([PERMISSIONS.HSE_VIEW_DASHBOARD]),
  hseAuditController.getAllAudits
);

router.get(
  '/:id',
  requirePermissions([PERMISSIONS.HSE_VIEW_DASHBOARD]),
  hseAuditController.getAuditById
);

router.put(
  '/:id',
  requirePermissions([PERMISSIONS.HSE_MANAGE_AUDITS]),
  validate(updateAuditSchema),
  hseAuditController.updateAudit
);

router.patch(
  '/:id/status',
  requirePermissions([PERMISSIONS.HSE_MANAGE_AUDITS]),
  validate(updateAuditStatusSchema),
  hseAuditController.updateStatus
);

router.delete(
  '/:id',
  requirePermissions([PERMISSIONS.HSE_MANAGE_AUDITS]),
  hseAuditController.deleteAudit
);

module.exports = router;
