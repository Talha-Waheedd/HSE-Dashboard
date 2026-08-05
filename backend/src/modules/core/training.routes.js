'use strict';

const express = require('express');
const router = express.Router();
const trainingController = require('./training.controller');
const { validate } = require('../../core/middleware/validate.middleware');
const { authenticate } = require('../../core/middleware/auth.middleware');
const { requirePermissions } = require('../../core/middleware/rbac.middleware');
const { createTrainingSchema, updateTrainingSchema, addAttendeeSchema, markAttendanceSchema } = require('./training.schema');
const { PERMISSIONS } = require('../../shared/constants/permissions');

router.use(authenticate);

router.post(
  '/',
  requirePermissions([PERMISSIONS.HSE_MANAGE_TRAINING]),
  validate(createTrainingSchema),
  trainingController.createSession
);

router.get(
  '/',
  requirePermissions([PERMISSIONS.HSE_VIEW_DASHBOARD]),
  trainingController.getAllSessions
);

router.get(
  '/:id',
  requirePermissions([PERMISSIONS.HSE_VIEW_DASHBOARD]),
  trainingController.getSessionById
);

router.put(
  '/:id',
  requirePermissions([PERMISSIONS.HSE_MANAGE_TRAINING]),
  validate(updateTrainingSchema),
  trainingController.updateSession
);

router.delete(
  '/:id',
  requirePermissions([PERMISSIONS.HSE_MANAGE_TRAINING]),
  trainingController.deleteSession
);

router.post(
  '/:id/attendees',
  requirePermissions([PERMISSIONS.HSE_MANAGE_TRAINING]),
  validate(addAttendeeSchema),
  trainingController.addAttendee
);

router.patch(
  '/:id/attendees/:userId/attendance',
  requirePermissions([PERMISSIONS.HSE_MANAGE_TRAINING]),
  validate(markAttendanceSchema),
  trainingController.markAttendance
);

module.exports = router;
