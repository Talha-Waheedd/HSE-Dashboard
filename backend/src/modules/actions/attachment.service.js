'use strict';

const fs = require('fs').promises;
const crypto = require('crypto');
const path = require('path');

const attachmentRepository = require('../../repositories/attachment.repository');
const { Incident } = require('../../database/models');
const { sequelize } = require('../../database/connection');
const AttachmentSource = require('../../shared/enums/AttachmentSource');
const storageConfig = require('../../database/config/storage');
const { ApiError } = require('../../shared/utils/index');
const { MESSAGES } = require('../../shared/constants');

const attachmentUploadDirectory = path.resolve(
  process.cwd(),
  storageConfig.local.attachmentUploadDir,
);
const MAX_INCIDENT_IMAGES = 4;

const toPublicAttachment = (attachment) => {
  const data = attachment?.toJSON ? attachment.toJSON() : { ...attachment };
  delete data.storagePath;
  if (data.id) data.url = `/api/v1/attachments/${data.id}/file`;
  return data;
};

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

    const id = crypto.randomUUID();
    const data = {
      id,
      sourceType: sourceData.sourceType,
      sourceId: sourceData.sourceId,
      attachmentType: sourceData.attachmentType || 'GENERAL',
      filename: fileMetadata.filename,
      originalName: fileMetadata.originalname,
      mimeType: fileMetadata.mimetype,
      sizeBytes: fileMetadata.size,
      storageDriver: 'local', // Defaulting to local for now, could be passed from env
      storagePath: fileMetadata.path,
      url: `/api/v1/attachments/${id}/file`,
      uploadedBy: userId,
    };

    try {
      let attachment;
      if (sourceData.sourceType === AttachmentSource.INCIDENT) {
        attachment = await sequelize.transaction(async (transaction) => {
          // Lock the source incident so simultaneous uploads for the same
          // record cannot both pass the four-image count check.
          const incident = await Incident.findByPk(sourceData.sourceId, {
            attributes: ['id'],
            transaction,
            lock: transaction.LOCK.UPDATE,
          });
          if (!incident) throw ApiError.notFound(MESSAGES.INCIDENT_NOT_FOUND);
          const imageCount = await attachmentRepository.model.count({
            where: { sourceType: AttachmentSource.INCIDENT, sourceId: sourceData.sourceId },
            transaction,
          });
          if (imageCount >= MAX_INCIDENT_IMAGES) {
            throw ApiError.badRequest('Maximum 4 images can be attached.');
          }
          return attachmentRepository.create(data, { transaction });
        });
      } else {
        attachment = await attachmentRepository.create(data);
      }
      return toPublicAttachment(attachment);
    } catch (error) {
      try {
        await fs.unlink(fileMetadata.path);
      } catch (cleanupError) {
        if (cleanupError.code !== 'ENOENT') {
          console.error(`Failed to remove orphaned upload: ${fileMetadata.path}`, cleanupError);
        }
      }
      throw error;
    }
  }

  /**
   * Get attachments by source
   */
  async getAttachmentsBySource(sourceType, sourceId) {
    const attachments = await attachmentRepository.getBySource(sourceType, sourceId);
    return attachments.map(toPublicAttachment);
  }

  /**
   * Get attachment by ID
   */
  async getAttachmentById(id) {
    const attachment = await attachmentRepository.findById(id);
    if (!attachment) {
      throw ApiError.notFound(MESSAGES.ATTACHMENT_NOT_FOUND);
    }
    return toPublicAttachment(attachment);
  }

  /**
   * Return only safe information needed to stream a locally stored image.
   * The generated filename is used with a fixed directory to prevent path traversal.
   */
  async getAttachmentFile(id) {
    const attachment = await attachmentRepository.findById(id);
    if (!attachment) throw ApiError.notFound(MESSAGES.ATTACHMENT_NOT_FOUND);
    if (attachment.storageDriver !== 'local') throw ApiError.notFound(MESSAGES.ATTACHMENT_NOT_FOUND);

    const filename = path.basename(attachment.filename);
    const filePath = path.join(attachmentUploadDirectory, filename);
    try {
      await fs.access(filePath);
    } catch {
      throw ApiError.notFound(MESSAGES.ATTACHMENT_NOT_FOUND);
    }
    return { filename, mimeType: attachment.mimeType || 'application/octet-stream', directory: attachmentUploadDirectory };
  }

  /**
   * Delete attachment
   */
  async deleteAttachment(id) {
    const attachment = await attachmentRepository.findById(id);
    if (!attachment) throw ApiError.notFound(MESSAGES.ATTACHMENT_NOT_FOUND);

    // Delete file from disk if local
    if (attachment.storageDriver === 'local' && attachment.storagePath) {
      try {
        const fullPath = path.join(attachmentUploadDirectory, path.basename(attachment.filename));
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
