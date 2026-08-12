'use strict';

const express = require('express');
const router = express.Router();

const AuthController = require('./auth.controller');
const { authenticate } = require('../../core/middleware/auth.middleware');
const { authRateLimiter } = require('../../core/middleware/rateLimiter.middleware');
const { validate } = require('../../core/middleware/validate.middleware');
const auditLog = require('../../core/middleware/audit.middleware');
const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema,
  verifyEmailSchema,
} = require('./auth.schema');

// â”€â”€â”€ Public Routes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.post('/register',
  authRateLimiter,
  validate(registerSchema),
  auditLog('USER_REGISTER', 'users'),
  AuthController.register,
);

router.post('/login',
  authRateLimiter,
  validate(loginSchema),
  auditLog('USER_LOGIN', 'users'),
  AuthController.login,
);

router.post('/refresh-token',
  validate(refreshTokenSchema),
  AuthController.refreshToken,
);

router.get('/verify-email',
  AuthController.verifyEmail,
);

router.post('/verify-email',
  authRateLimiter,
  validate(verifyEmailSchema),
  AuthController.verifyEmailExists,
);

router.post('/forgot-password',
  authRateLimiter,
  validate(forgotPasswordSchema),
  AuthController.forgotPassword,
);

router.post('/reset-password',
  validate(resetPasswordSchema),
  AuthController.resetPassword,
);

// â”€â”€â”€ Protected Routes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.post('/logout',
  authenticate,
  auditLog('USER_LOGOUT', 'users'),
  AuthController.logout,
);

router.get('/me',
  authenticate,
  AuthController.getMe,
);

module.exports = router;
