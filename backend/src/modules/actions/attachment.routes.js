'use strict';

const express = require('express');
const attachmentController = require('./attachment.controller');
const { validate } = require('../../core/middleware/validate.middleware');
const { authenticate } = require('../../core/middleware/auth.middleware');
const { requirePermissions } = require('../../core/middleware/rbac.middleware');
const { uploadAttachmentSchema } = require('./attachment.schema');
const { PERMISSIONS } = require('../../shared/constants/permissions');
const {
  uploadEvidenceImage,
  validateEvidenceImage,
  cleanupRejectedUpload,
} = require('../../core/middleware/upload.middleware');

const router = express.Router();

router.use(authenticate);

router.post(
  '/',
  requirePermissions([PERMISSIONS.HSE_VIEW_DASHBOARD]),
  uploadEvidenceImage.single('file'),
  validateEvidenceImage,
  cleanupRejectedUpload,
  validate(uploadAttachmentSchema),
  attachmentController.uploadAttachment,
);

router.get(
  '/source/:sourceType/:sourceId',
  requirePermissions([PERMISSIONS.HSE_VIEW_DASHBOARD]),
  attachmentController.getAttachmentsBySource,
);

router.get(
  '/:id/file',
  requirePermissions([PERMISSIONS.HSE_VIEW_DASHBOARD]),
  attachmentController.getAttachmentFile,
);

router.get(
  '/:id',
  requirePermissions([PERMISSIONS.HSE_VIEW_DASHBOARD]),
  attachmentController.getAttachmentById,
);

router.delete(
  '/:id',
  requirePermissions([PERMISSIONS.HSE_MANAGE_INCIDENTS]), // Assume high permission to delete docs
  attachmentController.deleteAttachment,
);

module.exports = router;
