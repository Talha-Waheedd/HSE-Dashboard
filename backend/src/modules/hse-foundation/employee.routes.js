'use strict';

const express = require('express');
const router = express.Router();
const employeeController = require('./employee.controller');
const { validate } = require('../../core/middleware/validate.middleware');
const { authenticate } = require('../../core/middleware/auth.middleware');
const { requirePermissions } = require('../../core/middleware/rbac.middleware');
const { createEmployeeSchema, updateEmployeeSchema } = require('./employee.schema');
const { PERMISSIONS } = require('../../shared/constants/permissions');

router.use(authenticate);

router.post(
  '/',
  requirePermissions([PERMISSIONS.USER_MANAGE]), // Requires HR/Admin level permissions
  validate(createEmployeeSchema),
  employeeController.createEmployee
);

router.get(
  '/',
  requirePermissions([PERMISSIONS.USER_READ]),
  employeeController.getAllEmployees
);

router.get(
  '/:id',
  requirePermissions([PERMISSIONS.USER_READ]),
  employeeController.getEmployeeById
);

router.put(
  '/:id',
  requirePermissions([PERMISSIONS.USER_MANAGE]),
  validate(updateEmployeeSchema),
  employeeController.updateEmployee
);

module.exports = router;
