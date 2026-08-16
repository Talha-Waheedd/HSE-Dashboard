'use strict';

const express = require('express');
const router = express.Router();
const departmentController = require('./department.controller');
const { validate } = require('../../core/middleware/validate.middleware');
const { authenticate } = require('../../core/middleware/auth.middleware');
const { requirePermissions } = require('../../core/middleware/rbac.middleware');
const { createDepartmentSchema, updateDepartmentSchema } = require('./department.schema');
const { PERMISSIONS } = require('../../shared/constants/permissions');

router.use(authenticate);

router.post(
  '/',
  requirePermissions([PERMISSIONS.HSE_MANAGE_PLANTS]), // Assuming same permission level as plants for now
  validate(createDepartmentSchema),
  departmentController.createDepartment
);

router.get(
  '/',
  requirePermissions([PERMISSIONS.HSE_VIEW_DASHBOARD]),
  departmentController.getAllDepartments
);

router.get(
  '/plant/:plantId',
  requirePermissions([PERMISSIONS.HSE_VIEW_DASHBOARD]),
  departmentController.getDepartmentsByPlant
);

router.get(
  '/:id',
  requirePermissions([PERMISSIONS.HSE_VIEW_DASHBOARD]),
  departmentController.getDepartmentById
);

router.put(
  '/:id',
  requirePermissions([PERMISSIONS.HSE_MANAGE_PLANTS]),
  validate(updateDepartmentSchema),
  departmentController.updateDepartment
);

router.delete(
  '/:id',
  requirePermissions([PERMISSIONS.HSE_MANAGE_PLANTS]),
  departmentController.deleteDepartment
);

module.exports = router;
