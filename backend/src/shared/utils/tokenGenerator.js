'use strict';

const jwt = require('jsonwebtoken');
const jwtConfig = require('../../database/config/jwt');
const TokenType = require('../enums/TokenType');
const ApiError = require('./ApiError');

/**
 * Sign a JWT for a given token type.
 * @param {object} payload - Data to encode
 * @param {string} type - TokenType enum value
 * @returns {string} Signed JWT string
 */
const signToken = (payload, type = TokenType.ACCESS) => {
  const { secret, expiresIn } = jwtConfig[type];
  return jwt.sign(payload, secret, { expiresIn, issuer: 'cbl-backend' });
};

/**
 * Verify and decode a JWT.
 * @param {string} token
 * @param {string} type - TokenType enum value
 * @returns {object} Decoded payload
 * @throws {ApiError} if invalid or expired
 */
const verifyToken = (token, type = TokenType.ACCESS) => {
  try {
    const { secret } = jwtConfig[type];
    return jwt.verify(token, secret);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Token has expired');
    }
    throw ApiError.unauthorized('Invalid token');
  }
};

/**
 * Generate a pair of access + refresh tokens for a user.
 * @param {object} user - User model instance
 * @returns {{ accessToken: string, refreshToken: string }}
 */
const generateTokenPair = (user) => {
  const payload = { sub: user.id, email: user.email, role: user.role?.name };

  return {
    accessToken: signToken(payload, TokenType.ACCESS),
    refreshToken: signToken({ sub: user.id }, TokenType.REFRESH),
  };
};

module.exports = { signToken, verifyToken, generateTokenPair };
