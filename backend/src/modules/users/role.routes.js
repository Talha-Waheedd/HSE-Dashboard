'use strict';

const express = require('express');

const router = express.Router();

const RoleController = require('./role.controller');
const { authenticate } = require('../../core/middleware/auth.middleware');
const { requirePermissions } = require('../../core/middleware/rbac.middleware');
const { validate } = require('../../core/middleware/validate.middleware');
const auditLog = require('../../core/middleware/audit.middleware');
const { PERMISSIONS } = require('../../shared/constants/permissions');
const { createRoleSchema, updateRoleSchema, updateRolePermissionsSchema } = require('./role.schema');

router.use(authenticate);

router.get('/permissions', requirePermissions([PERMISSIONS.ROLE_VIEW]), RoleController.getPermissions);
router.get('/', requirePermissions([PERMISSIONS.ROLE_VIEW]), RoleController.getAll);
router.get('/:id', requirePermissions([PERMISSIONS.ROLE_VIEW]), RoleController.getById);
router.post('/', requirePermissions([PERMISSIONS.ROLE_CREATE]), validate(createRoleSchema), auditLog('ROLE_CREATED', 'roles'), RoleController.create);
router.patch('/:id', requirePermissions([PERMISSIONS.ROLE_UPDATE]), validate(updateRoleSchema), auditLog('ROLE_UPDATED', 'roles'), RoleController.update);
router.put('/:id/permissions', requirePermissions([PERMISSIONS.ROLE_UPDATE]), validate(updateRolePermissionsSchema), auditLog('ROLE_PERMISSIONS_UPDATED', 'roles'), RoleController.updatePermissions);
router.delete('/:id', requirePermissions([PERMISSIONS.ROLE_DELETE]), auditLog('ROLE_DELETED', 'roles'), RoleController.delete);

module.exports = router;
