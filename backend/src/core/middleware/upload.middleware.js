'use strict';

const multer = require('multer');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
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

const fileFilter = (allowedMimes, invalidMessage = MESSAGES.INVALID_FILE_TYPE) => (
  req,
  file,
  cb,
) => {
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(ApiError.badRequest(invalidMessage));
  }
};

const attachmentUploadDirectory = path.resolve(
  process.cwd(),
  storageConfig.local.attachmentUploadDir,
);
fs.mkdirSync(attachmentUploadDirectory, { recursive: true });

const attachmentStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, attachmentUploadDirectory),
  filename: (req, file, cb) => {
    const extension = file.mimetype === 'image/png' ? '.png' : '.jpg';
    cb(null, buildFilename(file.originalname, extension));
  },
});

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
  limits: { fileSize: storageConfig.maxDocumentFileSize },
  fileFilter: fileFilter(storageConfig.allowedMimeTypes.documents),
});

const uploadEvidenceImage = multer({
  storage: attachmentStorage,
  limits: { fileSize: storageConfig.maxImageFileSize },
  fileFilter: fileFilter(storageConfig.allowedMimeTypes.evidenceImages, 'Only JPG, JPEG, and PNG images are allowed.'),
});

const removeUploadedFile = async (filePath) => {
  if (!filePath) return;
  try {
    await fs.promises.unlink(filePath);
  } catch (error) {
    if (error.code !== 'ENOENT') console.error(`Failed to remove rejected upload: ${filePath}`, error);
  }
};

/**
 * MIME headers are client-controlled. Decode the stored image with Sharp and
 * require the detected format to match the allow-list before it reaches the DB.
 */
const validateEvidenceImage = async (req, res, next) => {
  if (!req.file) return next();
  try {
    const extension = path.extname(req.file.originalname || '').toLowerCase();
    if (!['.jpg', '.jpeg', '.png'].includes(extension)) {
      throw ApiError.badRequest('Only JPG, JPEG, and PNG images are allowed.');
    }
    const metadata = await sharp(req.file.path).metadata();
    if (!['jpeg', 'png'].includes(metadata.format)) {
      throw ApiError.badRequest('The uploaded file is not a valid JPG, JPEG, or PNG image.');
    }
    const detectedMimeType = metadata.format === 'png' ? 'image/png' : 'image/jpeg';
    const detectedExtension = metadata.format === 'png' ? '.png' : '.jpg';
    if (path.extname(req.file.filename).toLowerCase() !== detectedExtension) {
      const nextFilename = buildFilename(req.file.originalname, detectedExtension);
      const nextPath = path.join(path.dirname(req.file.path), nextFilename);
      await fs.promises.rename(req.file.path, nextPath);
      req.file.filename = nextFilename;
      req.file.path = nextPath;
    }
    req.file.mimetype = detectedMimeType;
    req.file.detectedFormat = metadata.format;
    return next();
  } catch (error) {
    await removeUploadedFile(req.file.path);
    if (error instanceof ApiError) return next(error);
    return next(ApiError.badRequest('The uploaded file is not a valid JPG, JPEG, or PNG image.'));
  }
};

const cleanupRejectedUpload = (req, res, next) => {
  const filePath = req.file?.path;
  if (filePath) {
    res.once('finish', () => {
      if (res.statusCode >= 400) removeUploadedFile(filePath);
    });
  }
  next();
};

module.exports = {
  uploadImage,
  uploadDocument,
  uploadEvidenceImage,
  validateEvidenceImage,
  cleanupRejectedUpload,
  attachmentUploadDirectory,
};
