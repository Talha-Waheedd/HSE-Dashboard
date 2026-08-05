'use strict';

const config = require('./index');

module.exports = {
  driver: config.storageDriver, // 'local' | 's3'
  local: {
    uploadDir: 'uploads',
    storageDir: 'storage',
    avatarDir: 'storage/avatars',
    documentDir: 'storage/documents',
  },
  s3: {
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey,
    region: config.aws.region,
    bucket: config.aws.s3Bucket,
  },
  maxFileSize: 5 * 1024 * 1024, // 5 MB
  allowedMimeTypes: {
    images: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    documents: ['application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  },
};
