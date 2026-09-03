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

// Active departments are shared form options, not an administration action.
// Mutation and full/inactive-list endpoints still require explicit RBAC rights.
router.get('/active', departmentController.getActiveDepartments);

router.post(
  '/',
  requirePermissions([PERMISSIONS.DEPARTMENT_CREATE]),
  validate(createDepartmentSchema),
  departmentController.createDepartment,
);

router.get(
  '/',
  requirePermissions([PERMISSIONS.DEPARTMENT_VIEW]),
  departmentController.getAllDepartments,
);

router.get(
  '/plant/:plantId',
  requirePermissions([PERMISSIONS.DEPARTMENT_VIEW]),
  departmentController.getDepartmentsByPlant,
);

router.get(
  '/:id',
  requirePermissions([PERMISSIONS.DEPARTMENT_VIEW]),
  departmentController.getDepartmentById,
);

router.put(
  '/:id',
  requirePermissions([PERMISSIONS.DEPARTMENT_UPDATE]),
  validate(updateDepartmentSchema),
  departmentController.updateDepartment,
);

router.delete(
  '/:id',
  requirePermissions([PERMISSIONS.DEPARTMENT_DELETE]),
  departmentController.deleteDepartment,
);

module.exports = router;
