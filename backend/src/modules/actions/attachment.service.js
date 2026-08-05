'use strict';

const attachmentRepository = require('../../repositories/attachment.repository');
const AttachmentSource = require('../../shared/enums/AttachmentSource');
const { ApiError } = require('../../shared/utils/index');
const { MESSAGES } = require('../../shared/constants');
const fs = require('fs').promises;
const path = require('path');

class AttachmentService {
  /**
   * Upload and register a new attachment
   * Note: Actual file upload is handled by multer in the route/controller.
   * This service registers the metadata in the database.
   */
  async createAttachment(fileMetadata, sourceData, userId) {
    const validSources = Object.values(AttachmentSource);
    if (!validSources.includes(sourceData.sourceType)) {
      throw ApiError.badRequest('Invalid source type for attachment');
    }

    const data = {
      sourceType: sourceData.sourceType,
      sourceId: sourceData.sourceId,
      filename: fileMetadata.filename,
      originalName: fileMetadata.originalname,
      mimeType: fileMetadata.mimetype,
      sizeBytes: fileMetadata.size,
      storageDriver: 'local', // Defaulting to local for now, could be passed from env
      storagePath: fileMetadata.path,
      url: `/uploads/${fileMetadata.filename}`, // Assuming static serving of uploads dir
      uploadedBy: userId,
    };

    return attachmentRepository.create(data);
  }

  /**
   * Get attachments by source
   */
  async getAttachmentsBySource(sourceType, sourceId) {
    return attachmentRepository.getBySource(sourceType, sourceId);
  }

  /**
   * Get attachment by ID
   */
  async getAttachmentById(id) {
    const attachment = await attachmentRepository.findById(id);
    if (!attachment) {
      throw ApiError.notFound(MESSAGES.ATTACHMENT_NOT_FOUND);
    }
    return attachment;
  }

  /**
   * Delete attachment
   */
  async deleteAttachment(id) {
    const attachment = await this.getAttachmentById(id);
    
    // Delete file from disk if local
    if (attachment.storageDriver === 'local' && attachment.storagePath) {
      try {
        const fullPath = path.resolve(attachment.storagePath);
        await fs.unlink(fullPath);
      } catch (err) {
        // Log error but continue with DB deletion
        console.error(`Failed to delete file from disk: ${attachment.storagePath}`, err);
      }
    }

    return attachmentRepository.deleteById(id);
  }
}

module.exports = new AttachmentService();
