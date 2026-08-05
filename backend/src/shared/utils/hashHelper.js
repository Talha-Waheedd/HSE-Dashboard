'use strict';

const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 12;

/**
 * Hash a plain-text password.
 * @param {string} password
 * @returns {Promise<string>} Hashed password
 */
const hashPassword = async (password) => bcrypt.hash(password, SALT_ROUNDS);

/**
 * Compare a plain-text password against a hash.
 * @param {string} password
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
const comparePassword = async (password, hash) => bcrypt.compare(password, hash);

module.exports = { hashPassword, comparePassword };
