'use strict';

const Joi = require('joi');
const AttachmentSource = require('../../shared/enums/AttachmentSource');

// Note: File validation (type, size) is typically handled by multer middleware.
// This schema validates the body parameters that come alongside the file upload.

const uploadAttachmentSchema = Joi.object({
  sourceType: Joi.string().valid(...Object.values(AttachmentSource)).required(),
  sourceId: Joi.string().uuid().required(),
  attachmentType: Joi.string().trim().pattern(/^[A-Za-z0-9_-]+$/).max(100).default('GENERAL').optional(),
});

module.exports = {
  uploadAttachmentSchema,
};
