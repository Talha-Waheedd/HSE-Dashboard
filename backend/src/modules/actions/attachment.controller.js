'use strict';

const attachmentService = require('./attachment.service');
const { ApiResponse, asyncHandler } = require('../../shared/utils/index');

/**
 * Upload attachment
 * Note: Multer middleware should run before this to process the file
 */
const uploadAttachment = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json(ApiResponse.error('No file provided', 400));
  }

  const attachment = await attachmentService.createAttachment(req.file, req.body, req.user.id);
  res.status(201).json(ApiResponse.success(attachment, 'Attachment uploaded successfully', 201));
});

/**
 * Get attachments by source
 */
const getAttachmentsBySource = asyncHandler(async (req, res) => {
  const { sourceType, sourceId } = req.params;
  const attachments = await attachmentService.getAttachmentsBySource(sourceType, sourceId);
  res.status(200).json(ApiResponse.success(attachments, 'Attachments retrieved successfully'));
});

/**
 * Get attachment by ID
 */
const getAttachmentById = asyncHandler(async (req, res) => {
  const attachment = await attachmentService.getAttachmentById(req.params.id);
  res.status(200).json(ApiResponse.success(attachment, 'Attachment retrieved successfully'));
});

/**
 * Delete attachment
 */
const deleteAttachment = asyncHandler(async (req, res) => {
  await attachmentService.deleteAttachment(req.params.id);
  res.status(200).json(ApiResponse.success(null, 'Attachment deleted successfully'));
});

module.exports = {
  uploadAttachment,
  getAttachmentsBySource,
  getAttachmentById,
  deleteAttachment,
};
