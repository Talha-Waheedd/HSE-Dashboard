'use strict';

const authService = require('./auth.service');
const ApiResponse = require('../../shared/utils/ApiResponse');
const asyncHandler = require('../../shared/utils/asyncHandler');
const { HTTP_STATUS } = require('../../shared/constants/httpStatus');
const { MESSAGES } = require('../../shared/constants/messages');

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
   *     summary: Verify a Microsoft SSO identity and issue a CBL session
   *     security: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [email, msalToken]
   *             properties:
   *               email:     { type: string, format: email }
   *               msalToken: { type: string }
   *     responses:
   *       200: { description: User authorized and session issued }
   *       404: { description: User not registered in CBL system }
   */
  verifyEmailExists = asyncHandler(async (req, res) => {
    const { email, msalToken } = req.body;
    const meta = { ip: req.ip, userAgent: req.headers['user-agent'] };

    // 1. Cryptographically verify the MSAL id-token matches the claimed email.
    await authService.verifyMicrosoftToken(msalToken, email);

    // 2. Delegate all session-creation logic to the service layer.
    const result = await authService.ssoLogin(email, meta);

    if (!result) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'User not authorized',
        data: { authorized: false },
      });
    }

    return res.status(HTTP_STATUS.OK).json(ApiResponse.success({
        authorized: true,
        email,
        user: result.user,
        tokens: result.tokens,
      }, 'User authorized and logged in via SSO'));
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
