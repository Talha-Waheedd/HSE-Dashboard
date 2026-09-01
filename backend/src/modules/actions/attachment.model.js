'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../../database/connection');
const AttachmentSource = require('../../shared/enums/AttachmentSource');

/**
 * Attachment — File attachments for any HSE record.
 * Polymorphic: sourceType + sourceId links to any HSE record type.
 * No hard FK on sourceId since target table varies (same pattern as audit_logs.resource).
 */
const Attachment = sequelize.define('Attachment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  sourceType: {
    type: DataTypes.ENUM(...Object.values(AttachmentSource)),
    allowNull: false,
    comment: 'Which module this file belongs to',
  },
  sourceId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'Polymorphic FK — ID of the parent record',
  },
  attachmentType: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Evidence role, for example INITIAL_PHOTO or CLOSING_PROOF_PHOTO',
  },
  filename: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Stored filename on disk/S3',
  },
  originalName: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Original filename from the upload',
  },
  mimeType: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  sizeBytes: {
    type: DataTypes.BIGINT,
    allowNull: true,
  },
  storageDriver: {
    type: DataTypes.ENUM('local', 's3'),
    defaultValue: 'local',
    allowNull: false,
  },
  storagePath: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Relative path or S3 key',
  },
  url: {
    type: DataTypes.STRING(1000),
    allowNull: true,
    comment: 'Public or signed URL',
  },
  uploadedBy: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'FK → users.id',
  },
}, {
  tableName: 'attachments',
  paranoid: false,
  indexes: [
    { fields: ['source_type', 'source_id'], name: 'attachments_source_idx' },
    { fields: ['uploaded_by'], name: 'attachments_uploaded_by_idx' },
    { fields: ['source_type'], name: 'attachments_source_type_idx' },
  ],
});

module.exports = Attachment;
