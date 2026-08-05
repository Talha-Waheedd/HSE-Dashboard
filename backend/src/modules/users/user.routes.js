'use strict';

const express = require('express');
const router = express.Router();

const UserController = require('./user.controller');
const { authenticate } = require('../../core/middleware/auth.middleware');
const { requireRoles, requirePermissions } = require('../../core/middleware/rbac.middleware');
const { validate } = require('../../core/middleware/validate.middleware');
const auditLog = require('../../core/middleware/audit.middleware');
const { uploadImage } = require('../../core/middleware/upload.middleware');
const { updateUserSchema } = require('./user.schema');
const { paginationSchema, uuidParamSchema } = require('../core/common.schema');
const { ROLES } = require('../../shared/constants/roles');
const { PERMISSIONS } = require('../../shared/constants/permissions');

// All user routes require authentication
router.use(authenticate);

router.get('/',
  requirePermissions([PERMISSIONS.USER_VIEW]),
  validate(paginationSchema, 'query'),
  UserController.getAll,
);

router.get('/:id',
  validate(uuidParamSchema, 'params'),
  requirePermissions([PERMISSIONS.USER_VIEW]),
  UserController.getById,
);

router.patch('/:id',
  validate(uuidParamSchema, 'params'),
  validate(updateUserSchema),
  requirePermissions([PERMISSIONS.USER_UPDATE]),
  auditLog('USER_UPDATED', 'users'),
  UserController.update,
);

router.delete('/:id',
  validate(uuidParamSchema, 'params'),
  requireRoles([ROLES.ADMIN, ROLES.SUPER_ADMIN]),
  auditLog('USER_DELETED', 'users'),
  UserController.delete,
);

router.post('/me/avatar',
  uploadImage.single('avatar'),
  UserController.uploadAvatar,
);

module.exports = router;
