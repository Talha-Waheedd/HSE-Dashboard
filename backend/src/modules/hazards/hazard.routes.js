'use strict';

const express = require('express');
const router = express.Router();
const hazardController = require('./hazard.controller');
const { validate } = require('../../core/middleware/validate.middleware');
const { authenticate } = require('../../core/middleware/auth.middleware');
const { requirePermissions, requireRoles } = require('../../core/middleware/rbac.middleware');
const {
  createHazardSchema,
  updateHazardSchema,
  updateHazardStatusSchema,
  submitHazardClosureSchema,
  reviewHazardClosureSchema,
} = require('./hazard.schema');
const { PERMISSIONS } = require('../../shared/constants/permissions');
const { ROLES } = require('../../shared/constants/roles');

// Local-only escape hatch for form development. It is deliberately disabled
// in production even if an environment variable is accidentally set.
const bypassHazardValidation = (req, res, next) => {
  if (process.env.NODE_ENV !== 'production' && process.env.BYPASS_HAZARD_VALIDATION === 'true') {
    return next();
  }
  return validate(createHazardSchema)(req, res, next);
};

router.use(authenticate);

router.post(
  '/',
  requirePermissions([PERMISSIONS.HSE_REPORT_HAZARD]),
  bypassHazardValidation,
  hazardController.createHazard
);

router.get(
  '/',
  requirePermissions([PERMISSIONS.HSE_VIEW_REPORTS]),
  hazardController.getAllHazards
);

router.get(
  '/summary',
  requirePermissions([PERMISSIONS.HSE_VIEW_REPORTS]),
  hazardController.getHazardSummary
);

router.get(
  '/export',
  requirePermissions([PERMISSIONS.HSE_VIEW_REPORTS]),
  hazardController.exportHazards
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
  requireRoles([ROLES.ADMINISTRATOR, ROLES.SYSTEM_ADMINISTRATOR, ROLES.SUPER_ADMIN]),
  validate(updateHazardStatusSchema),
  hazardController.updateStatus
);

router.post(
  '/:id/closure-submission',
  requirePermissions([PERMISSIONS.HAZARD_SUBMIT_CLOSURE]),
  validate(submitHazardClosureSchema),
  hazardController.submitClosure,
);

router.post(
  '/:id/hse-review',
  requirePermissions([PERMISSIONS.HAZARD_REVIEW_CLOSURE]),
  validate(reviewHazardClosureSchema),
  hazardController.reviewClosure,
);

router.delete(
  '/:id',
  requirePermissions([PERMISSIONS.HSE_MANAGE_INCIDENTS]),
  hazardController.deleteHazard
);

module.exports = router;
