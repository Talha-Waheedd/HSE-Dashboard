'use strict';

const roleService = require('./role.service');
const ApiResponse = require('../../shared/utils/ApiResponse');
const asyncHandler = require('../../shared/utils/asyncHandler');
const { HTTP_STATUS } = require('../../shared/constants/httpStatus');
const { MESSAGES } = require('../../shared/constants/messages');

class RoleController {
  getAll = asyncHandler(async (req, res) => {
    const roles = await roleService.getAllRoles();
    res.status(HTTP_STATUS.OK).json(ApiResponse.success(roles, MESSAGES.ROLES_FETCHED));
  });

  getById = asyncHandler(async (req, res) => {
    const role = await roleService.getRoleById(req.params.id);
    res.status(HTTP_STATUS.OK).json(ApiResponse.success(role, MESSAGES.ROLE_FETCHED));
  });

  getPermissions = asyncHandler(async (req, res) => {
    const permissions = await roleService.getAllPermissions();
    res.status(HTTP_STATUS.OK).json(ApiResponse.success(permissions, 'Permissions fetched successfully'));
  });

  create = asyncHandler(async (req, res) => {
    const role = await roleService.createRole(req.body);
    res.status(HTTP_STATUS.CREATED).json(ApiResponse.success(role, MESSAGES.ROLE_CREATED));
  });

  update = asyncHandler(async (req, res) => {
    const role = await roleService.updateRole(req.params.id, req.body);
    res.status(HTTP_STATUS.OK).json(ApiResponse.success(role, MESSAGES.ROLE_UPDATED));
  });

  updatePermissions = asyncHandler(async (req, res) => {
    const role = await roleService.updatePermissions(req.params.id, req.body.permissionIds);
    res.status(HTTP_STATUS.OK).json(ApiResponse.success(role, 'Role permissions updated successfully'));
  });

  delete = asyncHandler(async (req, res) => {
    await roleService.deleteRole(req.params.id);
    res.status(HTTP_STATUS.OK).json(ApiResponse.success(null, MESSAGES.ROLE_DELETED));
  });
}

module.exports = new RoleController();
