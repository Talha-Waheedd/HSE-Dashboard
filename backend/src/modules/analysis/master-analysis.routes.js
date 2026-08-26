'use strict';

const express = require('express');
const router = express.Router();
const controller = require('./master-analysis.controller');
const { authenticate } = require('../../core/middleware/auth.middleware');
const { requirePermissions } = require('../../core/middleware/rbac.middleware');
const { PERMISSIONS } = require('../../shared/constants/permissions');

router.use(authenticate);
router.get('/', requirePermissions([PERMISSIONS.HSE_VIEW_DASHBOARD]), controller.list);
router.get('/:key', requirePermissions([PERMISSIONS.HSE_VIEW_DASHBOARD]), controller.get);
router.put('/:key', requirePermissions([PERMISSIONS.HSE_VIEW_DASHBOARD]), controller.save);

module.exports = router;
