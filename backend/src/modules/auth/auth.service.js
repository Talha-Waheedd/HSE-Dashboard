'use strict';

const { sequelize } = require('../../database/connection');
const userRepository = require('../../repositories/user.repository');
const tokenRepository = require('../../repositories/token.repository');
const { comparePassword } = require('../../shared/utils/hashHelper');
const { generateTokenPair, verifyToken, signToken } = require('../../shared/utils/tokenGenerator');
const { addDays, addHours } = require('../../shared/utils/dateHelper');
const ApiError = require('../../shared/utils/ApiError');
const TokenType = require('../../shared/enums/TokenType');
const { MESSAGES } = require('../../shared/constants/messages');
const { emitter, EVENTS } = require('../../core/events/emitter');
const logger = require('../../shared/utils/logger');
const jwt = require('jsonwebtoken');
const jwksRsa = require('jwks-rsa');
const config = require('../../database/config');

class AuthService {
  async verifyMicrosoftToken(token, email) {
    if (!token || !config.msal.clientId || !config.msal.tenantId) {
      throw ApiError.unauthorized('Microsoft identity token is required');
    }

    const issuer = `https://login.microsoftonline.com/${config.msal.tenantId}/v2.0`;
    const client = jwksRsa({
      jwksUri: `https://login.microsoftonline.com/${config.msal.tenantId}/discovery/v2.0/keys`,
      cache: true,
      rateLimit: true,
    });

    const getKey = (header, callback) => {
      client.getSigningKey(header.kid)
        .then((key) => callback(null, key.getPublicKey()))
        .catch((error) => callback(error));
    };

    const payload = await new Promise((resolve, reject) => {
      jwt.verify(token, getKey, {
        algorithms: ['RS256'],
        audience: config.msal.clientId,
        issuer,
      }, (error, decoded) => (error ? reject(error) : resolve(decoded)));
    }).catch(() => { throw ApiError.unauthorized('Invalid Microsoft identity token'); });

    const tokenEmail = String(payload.preferred_username || payload.email || payload.upn || '').toLowerCase();
    if (!tokenEmail || tokenEmail !== String(email).toLowerCase()) {
      throw ApiError.unauthorized('Microsoft identity does not match the requested account');
    }
    return payload;
  }

  /**
   * Register a new user.
   */
  async register(data) {
    const transaction = await sequelize.transaction();
    try {
      const exists = await userRepository.exists({ email: data.email });
      if (exists) throw ApiError.conflict(MESSAGES.EMAIL_TAKEN);

      const user = await userRepository.create(
        { ...data, status: false },
        { transaction },
      );

      // Generate email verification token
      const verifyToken_ = signToken({ sub: user.id }, TokenType.EMAIL_VERIFY);
      await tokenRepository.create(
        {
          token: verifyToken_,
          type: TokenType.EMAIL_VERIFY,
          userId: user.id,
          expiresAt: addHours(new Date(), 24),
        },
        { transaction },
      );

      await transaction.commit();

      // Fire async side-effect (sends verification email)
      emitter.emit(EVENTS.USER_REGISTERED, { user, token: verifyToken_ });

      return user;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  /**
   * Authenticate a user and return token pair.
   */
  async login(email, password, meta = {}) {
    const transaction = await sequelize.transaction();
    try {
      const user = await userRepository.findByEmailWithPassword(email);
      if (!user) throw ApiError.unauthorized(MESSAGES.INVALID_CREDENTIALS);

      const isMatch = await comparePassword(password, user.password);
      if (!isMatch) throw ApiError.unauthorized(MESSAGES.INVALID_CREDENTIALS);

      if (!user.isEmailVerified) throw ApiError.forbidden(MESSAGES.ACCOUNT_NOT_VERIFIED);
      if (!user.status) throw ApiError.forbidden(MESSAGES.ACCOUNT_SUSPENDED);

      const tokens = generateTokenPair(user);

      // Revoke old refresh tokens and store the new one
      await tokenRepository.revokeAllUserTokens(user.id, TokenType.REFRESH, transaction);
      await tokenRepository.createRefreshToken(
        {
          token: tokens.refreshToken,
          userId: user.id,
          expiresAt: addDays(new Date(), 7),
          ipAddress: meta.ip,
          userAgent: meta.userAgent,
        },
        transaction,
      );

      await userRepository.updateLastLogin(user.id, transaction);
      await transaction.commit();

      emitter.emit(EVENTS.USER_LOGGED_IN, { userId: user.id, ...meta });

      const userJson = user.toJSON();
      delete userJson.password;
      return { user: userJson, tokens };
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  /**
   * Refresh access token using a valid refresh token.
   */
  async refreshToken(refreshToken) {
    const payload = verifyToken(refreshToken, TokenType.REFRESH);
    const storedToken = await tokenRepository.findValidToken(refreshToken, TokenType.REFRESH);

    if (!storedToken) throw ApiError.unauthorized(MESSAGES.REFRESH_TOKEN_INVALID);

    const user = await userRepository.findByIdWithRole(payload.sub);
    if (!user || !user.status) throw ApiError.unauthorized(MESSAGES.UNAUTHORIZED);

    const tokens = generateTokenPair(user);
    return { tokens };
  }

  /**
   * Verify email with a verification token.
   */
  async verifyEmail(token) {
    const payload = verifyToken(token, TokenType.EMAIL_VERIFY);
    const storedToken = await tokenRepository.findValidToken(token, TokenType.EMAIL_VERIFY);

    if (!storedToken) throw ApiError.badRequest(MESSAGES.TOKEN_INVALID);

    const user = await userRepository.findById(payload.sub);
    if (!user) throw ApiError.notFound(MESSAGES.USER_NOT_FOUND);
    if (user.isEmailVerified) throw ApiError.badRequest(MESSAGES.EMAIL_ALREADY_VERIFIED);

    const transaction = await sequelize.transaction();
    try {
      await userRepository.update(
        { isEmailVerified: true, status: true },
        { id: user.id },
        { transaction },
      );
      await tokenRepository.revokeAllUserTokens(user.id, TokenType.EMAIL_VERIFY, transaction);
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  /**
   * Verify if a user exists by email (for SSO flows)
   */
  async verifyEmailExists(email) {
    return userRepository.findOne({ email });
  }

  /**
   * Send password reset email.
   */
  async forgotPassword(email) {
    const user = await userRepository.findOne({ email });
    if (!user) return; // Silent fail — don't leak user existence

    const resetTkn = signToken({ sub: user.id }, TokenType.PASSWORD_RESET);
    await tokenRepository.create({
      token: resetTkn,
      type: TokenType.PASSWORD_RESET,
      userId: user.id,
      expiresAt: addHours(new Date(), 1),
    });

    emitter.emit(EVENTS.PASSWORD_RESET_REQUESTED, { user, token: resetTkn });
  }

  /**
   * Reset password using a valid reset token.
   */
  async resetPassword(token, newPassword) {
    const payload = verifyToken(token, TokenType.PASSWORD_RESET);
    const storedToken = await tokenRepository.findValidToken(token, TokenType.PASSWORD_RESET);

    if (!storedToken) throw ApiError.badRequest(MESSAGES.TOKEN_INVALID);

    const transaction = await sequelize.transaction();
    try {
      await userRepository.update({ password: newPassword }, { id: payload.sub }, { transaction });
      await tokenRepository.revokeAllUserTokens(payload.sub, TokenType.PASSWORD_RESET, transaction);
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  /**
   * Logout — revoke all refresh tokens.
   */
  async logout(userId) {
    await tokenRepository.revokeAllUserTokens(userId, TokenType.REFRESH);
  }

  /**
   * Check if a user's email exists in the database (used by SSO flow).
   * @param {string} email
   * @returns {object|null} The user object if found, otherwise null
   */
  async verifyEmailExists(email) {
    return userRepository.findOne({ email });
  }

  /**
   * Complete SSO login: issue token pair, store refresh token, update last-login.
   * Extracted from auth.controller to avoid inline require() anti-pattern and
   * duplication of the same transaction/event logic already in login().
   *
   * @param {string} email - Verified email address from Microsoft SSO
   * @param {object} meta  - { ip, userAgent }
   * @returns {{ user: object, tokens: { accessToken, refreshToken } }}
   */
  async ssoLogin(email, meta = {}) {
    const user = await this.verifyEmailExists(email);
    if (!user || !user.status) {
      return null; // Caller decides how to respond (404 / 401)
    }

    const tokens = generateTokenPair(user);

    const transaction = await sequelize.transaction();
    try {
      await tokenRepository.revokeAllUserTokens(user.id, TokenType.REFRESH, transaction);
      await tokenRepository.createRefreshToken(
        {
          token: tokens.refreshToken,
          userId: user.id,
          expiresAt: addDays(new Date(), 7),
          ipAddress: meta.ip,
          userAgent: meta.userAgent,
        },
        transaction,
      );
      await userRepository.updateLastLogin(user.id, transaction);
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      logger.error('SSO login transaction failed', { email, err: err.message });
      throw err;
    }

    emitter.emit(EVENTS.USER_LOGGED_IN, { userId: user.id, ...meta });

    const userWithRole = await userRepository.findByIdWithRole(user.id);
    return { user: userWithRole.toJSON(), tokens };
  }
}

module.exports = new AuthService();
