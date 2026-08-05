'use strict';

const roleRepository = require('../../repositories/role.repository');
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

  async createRole(data) {
    const exists = await roleRepository.findByName(data.name);
    if (exists) throw ApiError.conflict(MESSAGES.CONFLICT);
    return roleRepository.create(data);
  }

  async updateRole(id, data) {
    const role = await roleRepository.findById(id);
    if (!role) throw ApiError.notFound(MESSAGES.ROLE_NOT_FOUND);
    if (role.isSystem) throw ApiError.forbidden('System roles cannot be modified');
    await roleRepository.update(data, { id });
    return roleRepository.findByIdWithPermissions(id);
  }

  async deleteRole(id) {
    const role = await roleRepository.findById(id);
    if (!role) throw ApiError.notFound(MESSAGES.ROLE_NOT_FOUND);
    if (role.isSystem) throw ApiError.forbidden('System roles cannot be deleted');
    await roleRepository.delete({ id });
  }
}

module.exports = new RoleService();
