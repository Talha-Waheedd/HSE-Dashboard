'use strict';

const crypto = require('crypto');
const config = require('../../database/config');

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;
const KEY = Buffer.from(config.encryptionKey || 'default32charencryptionkeyhere!!', 'utf-8');

/**
 * Encrypt a plain-text string.
 * @param {string} text
 * @returns {string} Encrypted string (iv:encrypted, hex-encoded)
 */
const encrypt = (text) => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf-8'), cipher.final()]);
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
};

/**
 * Decrypt an encrypted string.
 * @param {string} encryptedText - iv:encrypted (hex-encoded)
 * @returns {string} Decrypted plain text
 */
const decrypt = (encryptedText) => {
  const [ivHex, encHex] = encryptedText.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const encryptedBuffer = Buffer.from(encHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  const decrypted = Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
  return decrypted.toString('utf-8');
};

/**
 * Generate a cryptographically secure random token.
 * @param {number} bytes
 * @returns {string} Hex string
 */
const generateSecureToken = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');

module.exports = { encrypt, decrypt, generateSecureToken };
