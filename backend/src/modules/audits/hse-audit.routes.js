'use strict';

const express = require('express');
const router = express.Router();
const hseAuditController = require('./hse-audit.controller');
const { validate } = require('../../core/middleware/validate.middleware');
const { authenticate } = require('../../core/middleware/auth.middleware');
const { requirePermissions } = require('../../core/middleware/rbac.middleware');
const { createAuditSchema, updateAuditSchema, updateAuditStatusSchema } = require('./audit.schema');
const { PERMISSIONS } = require('../../shared/constants/permissions');
const multer = require('multer');
const ApiError = require('../../shared/utils/ApiError');

const planWorkbookUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    if (/\.xlsx$/i.test(file.originalname || '')) return callback(null, true);
    return callback(ApiError.badRequest('Only .xlsx Critical Audit Plan files are supported.'));
  },
});

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
  '/critical-plans',
  requirePermissions([PERMISSIONS.HSE_VIEW_DASHBOARD]),
  hseAuditController.getCriticalAuditPlans
);

router.post(
  '/critical-plans/import',
  requirePermissions([PERMISSIONS.HSE_MANAGE_AUDITS]),
  planWorkbookUpload.single('file'),
  hseAuditController.importCriticalAuditPlan
);

router.get(
  '/export',
  requirePermissions([PERMISSIONS.HSE_VIEW_REPORTS]),
  hseAuditController.exportAudits
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
