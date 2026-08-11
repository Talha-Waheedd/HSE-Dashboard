'use strict';

const express = require('express');
const router = express.Router();
const attachmentController = require('./attachment.controller');
const { validate } = require('../../core/middleware/validate.middleware');
const { authenticate } = require('../../core/middleware/auth.middleware');
const { requirePermissions } = require('../../core/middleware/rbac.middleware');
const { uploadAttachmentSchema } = require('./attachment.schema');
const { PERMISSIONS } = require('../../shared/constants/permissions');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { ApiError } = require('../../shared/utils/index');

// Configure multer for file uploads
const uploadDirectory = path.resolve(process.cwd(), 'public', 'uploads');
fs.mkdirSync(uploadDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDirectory);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Allow common file types
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, 'Invalid file type. Only JPEG, PNG, PDF, and DOC/DOCX are allowed.'));
  }
};

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});

router.use(authenticate);

router.post(
  '/',
  requirePermissions([PERMISSIONS.HSE_VIEW_DASHBOARD]), // Basic permission to upload docs if they have access to the system
  upload.single('file'),
  validate(uploadAttachmentSchema),
  attachmentController.uploadAttachment
);

router.get(
  '/source/:sourceType/:sourceId',
  requirePermissions([PERMISSIONS.HSE_VIEW_DASHBOARD]),
  attachmentController.getAttachmentsBySource
);

router.get(
  '/:id',
  requirePermissions([PERMISSIONS.HSE_VIEW_DASHBOARD]),
  attachmentController.getAttachmentById
);

router.delete(
  '/:id',
  requirePermissions([PERMISSIONS.HSE_MANAGE_INCIDENTS]), // Assume high permission to delete docs
  attachmentController.deleteAttachment
);

module.exports = router;
