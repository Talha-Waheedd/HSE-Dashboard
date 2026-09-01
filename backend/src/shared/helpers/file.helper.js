'use strict';

const crypto = require('crypto');
const path = require('path');
const mime = require('mime-types');
const storageConfig = require('../../database/config/storage');
const ApiError = require('../utils/ApiError');

/**
 * Validate a file against allowed MIME types.
 * @param {object} file - Multer file object
 * @param {'images'|'documents'} category
 */
const validateFileMime = (file, category = 'images') => {
  const allowed = storageConfig.allowedMimeTypes[category] || [];
  if (!allowed.includes(file.mimetype)) {
    throw ApiError.badRequest(
      `Invalid file type. Allowed: ${allowed.map((m) => mime.extension(m)).join(', ')}`,
    );
  }
};

/**
 * Build a unique filename for uploaded files.
 * @param {string} originalName
 * @param {string} [forcedExtension] - Extension selected from a validated MIME type.
 * @returns {string}
 */
const buildFilename = (originalName, forcedExtension) => {
  const originalExtension = path.extname(originalName || '').toLowerCase();
  const ext = forcedExtension || (['.jpg', '.jpeg', '.png'].includes(originalExtension) ? originalExtension : '');
  return `${crypto.randomUUID()}${ext}`;
};

/**
 * Get the public URL for a stored file.
 * @param {string} filename
 * @param {string} subDir
 * @returns {string}
 */
const getFileUrl = (filename, subDir = 'avatars') => {
  if (!filename) return null;
  if (storageConfig.driver === 's3') {
    return `https://${storageConfig.s3.bucket}.s3.${storageConfig.s3.region}.amazonaws.com/${subDir}/${filename}`;
  }
  return `/storage/${subDir}/${filename}`;
};

module.exports = { validateFileMime, buildFilename, getFileUrl };
