'use strict';

const express = require('express');
const router = express.Router();
const hseActionItemController = require('./hse-action-item.controller');
// const { requirePermissions } = require('../../shared/middlewares/index');
// const PERMISSIONS = require('../../shared/enums/Permissions');

router.get('/', hseActionItemController.getHseActionItems);
router.get('/:id', hseActionItemController.getHseActionItemById);
router.post('/', hseActionItemController.createHseActionItem);
router.put('/:id', hseActionItemController.updateHseActionItem);
router.delete('/:id', hseActionItemController.deleteHseActionItem);

module.exports = router;
