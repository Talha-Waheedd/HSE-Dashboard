'use strict';

const ApiError = require('../../shared/utils/ApiError');
const { MESSAGES } = require('../../shared/constants/messages');
const { ROLES } = require('../../shared/constants/roles');

/**
 * RBAC Middleware Factory.
 *
 * @param {string[]} requiredRoles - One of these roles grants access
 * @returns Express middleware
 *
 * @example
 * router.delete('/users/:id', authenticate, requireRoles([ROLES.ADMIN]), handler);
 */
const requireRoles = (requiredRoles = []) => (req, res, next) => {
  if (!req.user) return next(ApiError.unauthorized());

  const userRoleName = req.user.role?.name;
  if (userRoleName === ROLES.SYSTEM_ADMINISTRATOR) return next();

  if (!requiredRoles.includes(userRoleName)) {
    return next(ApiError.forbidden(MESSAGES.FORBIDDEN));
  }
  return next();
};

/**
 * Permission-based RBAC Middleware Factory.
 *
 * @param {string[]} requiredPermissions - All of these permissions must be present
 * @returns Express middleware
 *
 * @example
 * router.put('/roles/:id', authenticate, requirePermissions([PERMISSIONS.ROLE_UPDATE]), handler);
 */
const requirePermissions = (requiredPermissions = []) => (req, res, next) => {
  if (!req.user) return next(ApiError.unauthorized());

  const userRoleName = req.user.role?.name;
  if (userRoleName === ROLES.SYSTEM_ADMINISTRATOR) return next();

  const userPermissions = req.user.role?.permissions?.map((p) => p.key) || [];
  const hasAll = requiredPermissions.every((p) => userPermissions.includes(p));

  if (!hasAll) return next(ApiError.forbidden(MESSAGES.FORBIDDEN));
  return next();
};

/**
 * Ownership guard — ensures the requesting user owns the resource.
 * @param {Function} getResourceUserId - (req) => userId string
 */
const requireOwnership = (getResourceUserId) => (req, res, next) => {
  if (!req.user) return next(ApiError.unauthorized());

  const resourceUserId = getResourceUserId(req);
  if (req.user.id !== resourceUserId) {
    return next(ApiError.forbidden(MESSAGES.FORBIDDEN));
  }
  return next();
};

module.exports = { requireRoles, requirePermissions, requireOwnership };
