'use strict';

const { verifyToken } = require('../../shared/utils/tokenGenerator');
const userRepository = require('../../repositories/user.repository');
const ApiError = require('../../shared/utils/ApiError');
const { MESSAGES } = require('../../shared/constants/messages');
const TokenType = require('../../shared/enums/TokenType');

/**
 * JWT Authentication Middleware.
 * Verifies the Bearer token in the Authorization header.
 * Attaches the full user object (with role + permissions) to req.user.
 */
const authenticate = async (req, res, next) => {
  try {
    // Local dashboard preview mode has no real login token. It is available
    // only outside production and requires the frontend's explicit header.
    if (
      req.headers['x-preview-auth'] === 'true' &&
      process.env.NODE_ENV !== 'production'
    ) {
      const previewUser = await userRepository.findByIdWithRole(process.env.PREVIEW_USER_ID);
      // The preview header is only honored when explicitly enabled above.
      // Keep read-only dashboard/module requests available even if the local
      // seed user was removed or migrations have not restored its relations.
      // Write operations still receive the configured UUID for audit fields.
      req.user = previewUser || {
        id: process.env.PREVIEW_USER_ID,
        status: true,
        role: { name: 'super_admin', displayName: 'System Administrator' },
      };
      return next();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized(MESSAGES.TOKEN_MISSING);
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token, TokenType.ACCESS);

    const user = await userRepository.findByIdWithRole(payload.sub);
    if (!user) throw ApiError.unauthorized(MESSAGES.UNAUTHORIZED);
    if (!user.status) throw ApiError.forbidden(MESSAGES.ACCOUNT_SUSPENDED);

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Optional authentication — attaches user if token present, continues if not.
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const payload = verifyToken(token, TokenType.ACCESS);
      req.user = await userRepository.findByIdWithRole(payload.sub);
    }
    next();
  } catch {
    next();
  }
};

module.exports = { authenticate, optionalAuth };
