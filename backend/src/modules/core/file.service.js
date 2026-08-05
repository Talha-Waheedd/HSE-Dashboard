'use strict';

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const storageConfig = require('../../database/config/storage');
const { buildFilename, validateFileMime } = require('../../shared/helpers/file.helper');
const logger = require('../../shared/utils/logger');

class FileService {
  /**
   * Save an uploaded image file (with optional resize).
   * @param {object} file - Multer file object
   * @param {string} subDir - Subdirectory under storage/
   * @param {object} options - Resize options { width, height }
   * @returns {string} Saved filename
   */
  async saveImage(file, subDir = 'avatars', options = { width: 400, height: 400 }) {
    validateFileMime(file, 'images');
    const filename = buildFilename(file.originalname);
    const destDir = path.resolve(storageConfig.local.storageDir, subDir);

    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

    const destPath = path.join(destDir, filename);

    await sharp(file.path)
      .resize(options.width, options.height, { fit: 'cover' })
      .webp({ quality: 85 })
      .toFile(destPath.replace(path.extname(destPath), '.webp'));

    // Clean up temp upload
    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);

    logger.info(`File saved: ${subDir}/${filename}`);
    return filename.replace(path.extname(filename), '.webp');
  }

  /**
   * Delete a stored file.
   */
  async deleteFile(filename, subDir = 'avatars') {
    const filePath = path.resolve(storageConfig.local.storageDir, subDir, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logger.info(`File deleted: ${subDir}/${filename}`);
    }
  }
}

module.exports = new FileService();
