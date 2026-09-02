'use strict';

const express = require('express');

const router = express.Router();
const controller = require('./location.controller');
const { authenticate } = require('../../core/middleware/auth.middleware');
const { validate } = require('../../core/middleware/validate.middleware');
const { createLocationSchema, updateLocationSchema } = require('./location.schema');
const { requirePermissions } = require('../../core/middleware/rbac.middleware');
const { PERMISSIONS } = require('../../shared/constants/permissions');

router.use(authenticate);
router.get('/', requirePermissions([PERMISSIONS.LOCATION_VIEW]), controller.list);
router.get('/:id', requirePermissions([PERMISSIONS.LOCATION_VIEW]), controller.get);
router.post('/', requirePermissions([PERMISSIONS.LOCATION_CREATE]), validate(createLocationSchema), controller.create);
router.put('/:id', requirePermissions([PERMISSIONS.LOCATION_UPDATE]), validate(updateLocationSchema), controller.update);
router.delete('/:id', requirePermissions([PERMISSIONS.LOCATION_DELETE]), controller.remove);
module.exports = router;
