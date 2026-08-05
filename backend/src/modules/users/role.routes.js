'use strict';

const express = require('express');
const router = express.Router();

const RoleController = require('./role.controller');
const { authenticate } = require('../../core/middleware/auth.middleware');
const { requireRoles } = require('../../core/middleware/rbac.middleware');
const auditLog = require('../../core/middleware/audit.middleware');
const { ROLES } = require('../../shared/constants/roles');

router.use(authenticate);
router.use(requireRoles([ROLES.ADMIN, ROLES.SUPER_ADMIN]));

router.get('/', RoleController.getAll);
router.get('/:id', RoleController.getById);
router.post('/', auditLog('ROLE_CREATED', 'roles'), RoleController.create);
router.patch('/:id', auditLog('ROLE_UPDATED', 'roles'), RoleController.update);
router.delete('/:id', auditLog('ROLE_DELETED', 'roles'), RoleController.delete);

module.exports = router;
