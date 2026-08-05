'use strict';

const authService = require('./auth.service');
const ApiResponse = require('../../shared/utils/ApiResponse');
const asyncHandler = require('../../shared/utils/asyncHandler');
const { HTTP_STATUS } = require('../../shared/constants/httpStatus');
const { MESSAGES } = require('../../shared/constants/messages');
const config = require('../../database/config');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication endpoints
 */
class AuthController {
  /**
   * @swagger
   * /auth/register:
   *   post:
   *     tags: [Auth]
   *     summary: Register a new user
   *     security: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [firstName, lastName, email, password]
   *             properties:
   *               firstName: { type: string }
   *               lastName:  { type: string }
   *               email:     { type: string, format: email }
   *               password:  { type: string, minLength: 8 }
   *     responses:
   *       201: { description: User registered }
   *       409: { description: Email already taken }
   */
  register = asyncHandler(async (req, res) => {
    const user = await authService.register(req.body);
    res.status(HTTP_STATUS.CREATED).json(
      ApiResponse.success({ id: user.id, email: user.email }, MESSAGES.REGISTER_SUCCESS),
    );
  });

  login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const meta = { ip: req.ip, userAgent: req.headers['user-agent'] };
    const { user, tokens } = await authService.login(email, password, meta);
    res.status(HTTP_STATUS.OK).json(
      ApiResponse.success({ user, tokens }, MESSAGES.LOGIN_SUCCESS),
    );
  });

  refreshToken = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    const { tokens } = await authService.refreshToken(refreshToken);
    res.status(HTTP_STATUS.OK).json(
      ApiResponse.success({ tokens }, MESSAGES.TOKEN_REFRESHED),
    );
  });

  verifyEmail = asyncHandler(async (req, res) => {
    const { token } = req.query;
    await authService.verifyEmail(token);
    res.status(HTTP_STATUS.OK).json(ApiResponse.success(null, MESSAGES.EMAIL_VERIFIED));
  });

  /**
   * @swagger
   * /auth/verify-email:
   *   post:
   *     tags: [Auth]
   *     summary: Verify if a Microsoft account email exists
   *     security: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [email]
   *             properties:
   *               email: { type: string, format: email, example: "user@example.com" }
   *     responses:
   *       200: 
   *         description: User authorized
   *       404: 
   *         description: User not authorized
   */
  verifyEmailExists = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const user = await authService.verifyEmailExists(email);

    if (user && user.status === true) {
      const meta = { ip: req.ip, userAgent: req.headers['user-agent'] };
      const { generateTokenPair } = require('../../shared/utils/tokenGenerator');
      const tokenRepository = require('../../repositories/token.repository');
      const { addDays } = require('../../shared/utils/dateHelper');
      const TokenType = require('../../shared/enums/TokenType');
      const { sequelize } = require('../../database/connection');
      const { emitter, EVENTS } = require('../../core/events/emitter');
      const userRepository = require('../../repositories/user.repository');

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
        
        emitter.emit(EVENTS.USER_LOGGED_IN, { userId: user.id, ...meta });
      } catch (err) {
        await transaction.rollback();
        throw err;
      }
      
      const userWithRole = await userRepository.findByIdWithRole(user.id);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'User authorized and logged in via SSO',
        data: { 
          authorized: true, 
          email,
          user: userWithRole.toJSON(),
          tokens
        }
      });
    } else {
      res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'User not authorized',
        data: { authorized: false }
      });
    }
  });

  forgotPassword = asyncHandler(async (req, res) => {
    await authService.forgotPassword(req.body.email);
    res.status(HTTP_STATUS.OK).json(ApiResponse.success(null, MESSAGES.PASSWORD_RESET_EMAIL_SENT));
  });

  resetPassword = asyncHandler(async (req, res) => {
    const { token, password } = req.body;
    await authService.resetPassword(token, password);
    res.status(HTTP_STATUS.OK).json(ApiResponse.success(null, MESSAGES.PASSWORD_RESET_SUCCESS));
  });

  logout = asyncHandler(async (req, res) => {
    await authService.logout(req.user.id);
    res.status(HTTP_STATUS.OK).json(ApiResponse.success(null, MESSAGES.LOGOUT_SUCCESS));
  });

  getMe = asyncHandler(async (req, res) => {
    res.status(HTTP_STATUS.OK).json(
      ApiResponse.success(req.user, MESSAGES.USER_FETCHED),
    );
  });
}

module.exports = new AuthController();
