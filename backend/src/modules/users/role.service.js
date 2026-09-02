'use strict';

const roleRepository = require('../../repositories/role.repository');
const { sequelize } = require('../../database/connection');
const { Permission, User } = require('../../database/models');
const ApiError = require('../../shared/utils/ApiError');
const { MESSAGES } = require('../../shared/constants/messages');

class RoleService {
  async getAllRoles() {
    return roleRepository.findAllWithPermissions();
  }

  async getRoleById(id) {
    const role = await roleRepository.findByIdWithPermissions(id);
    if (!role) throw ApiError.notFound(MESSAGES.ROLE_NOT_FOUND);
    return role;
  }

  async getAllPermissions() {
    return Permission.findAll({ order: [['group', 'ASC'], ['displayName', 'ASC']] });
  }

  async resolvePermissions(transaction, permissionIds = []) {
    const uniqueIds = [...new Set(permissionIds)];
    const permissions = await roleRepository.findPermissionsByIds(uniqueIds, { transaction });
    if (permissions.length !== uniqueIds.length) throw ApiError.badRequest('One or more permission IDs are invalid');
    return permissions;
  }

  async createRole(data) {
    const name = data.name.trim();
    const exists = await roleRepository.findByName(name);
    if (exists) throw ApiError.conflict(MESSAGES.CONFLICT);
    const transaction = await sequelize.transaction();
    try {
      const permissions = await this.resolvePermissions(transaction, data.permissionIds || []);
      const role = await roleRepository.create({
        name,
        displayName: data.displayName?.trim() || name,
        description: data.description?.trim() || null,
        isSystem: false,
      }, { transaction });
      await role.setPermissions(permissions, { transaction });
      await transaction.commit();
      return this.getRoleById(role.id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async updateRole(id, data) {
    const role = await roleRepository.findById(id);
    if (!role) throw ApiError.notFound(MESSAGES.ROLE_NOT_FOUND);
    if (role.isSystem) throw ApiError.forbidden('System roles cannot be modified');
    if (data.name && data.name !== role.name) {
      const duplicate = await roleRepository.findByName(data.name.trim());
      if (duplicate) throw ApiError.conflict(MESSAGES.CONFLICT);
    }
    const patch = {};
    if (data.name !== undefined) patch.name = data.name.trim();
    if (data.displayName !== undefined) patch.displayName = data.displayName.trim();
    if (data.description !== undefined) patch.description = data.description?.trim() || null;
    await roleRepository.update(patch, { id });
    return roleRepository.findByIdWithPermissions(id);
  }

  async updatePermissions(id, permissionIds) {
    const role = await roleRepository.findById(id);
    if (!role) throw ApiError.notFound(MESSAGES.ROLE_NOT_FOUND);
    if (role.isSystem) throw ApiError.forbidden('System role permissions cannot be modified');
    const transaction = await sequelize.transaction();
    try {
      const permissions = await this.resolvePermissions(transaction, permissionIds);
      await role.setPermissions(permissions, { transaction });
      await transaction.commit();
      return this.getRoleById(id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async deleteRole(id) {
    const role = await roleRepository.findById(id);
    if (!role) throw ApiError.notFound(MESSAGES.ROLE_NOT_FOUND);
    if (role.isSystem) throw ApiError.forbidden('System roles cannot be deleted');
    if (await User.count({ where: { roleId: id } })) {
      throw ApiError.conflict('Reassign users before deleting this role');
    }
    await roleRepository.delete({ id });
  }
}

module.exports = new RoleService();
