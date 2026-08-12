'use strict';

const ApiError = require('../../shared/utils/ApiError');
const { MESSAGES } = require('../../shared/constants/messages');
const { ROLES } = require('../../shared/constants/roles');

// Roles that unconditionally bypass all permission checks.
// Centralised here so there is one place to update when roles change.
const SUPERUSER_ROLES = new Set([
  ROLES.SYSTEM_ADMINISTRATOR,
  ROLES.SUPER_ADMIN,
]);

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
  if (SUPERUSER_ROLES.has(userRoleName)) return next();

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
  if (SUPERUSER_ROLES.has(userRoleName)) return next();

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
