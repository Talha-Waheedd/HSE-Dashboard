'use strict';

const multer = require('multer');
const path = require('path');
const storageConfig = require('../../database/config/storage');
const { buildFilename } = require('../../shared/helpers/file.helper');
const ApiError = require('../../shared/utils/ApiError');
const { MESSAGES } = require('../../shared/constants/messages');

const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, storageConfig.local.uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, buildFilename(file.originalname));
  },
});

const fileFilter = (allowedMimes) => (req, file, cb) => {
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(ApiError.badRequest(MESSAGES.INVALID_FILE_TYPE));
  }
};

/**
 * Image upload middleware (avatar/profile photos).
 */
const uploadImage = multer({
  storage: diskStorage,
  limits: { fileSize: storageConfig.maxFileSize },
  fileFilter: fileFilter(storageConfig.allowedMimeTypes.images),
});

/**
 * Document upload middleware.
 */
const uploadDocument = multer({
  storage: diskStorage,
  limits: { fileSize: storageConfig.maxFileSize * 2 }, // 10 MB for docs
  fileFilter: fileFilter(storageConfig.allowedMimeTypes.documents),
});

module.exports = { uploadImage, uploadDocument };
