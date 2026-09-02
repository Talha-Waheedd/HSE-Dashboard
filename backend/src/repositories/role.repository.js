'use strict';

const BaseRepository = require('./base.repository');
const { Role, Permission } = require('../database/models');

class RoleRepository extends BaseRepository {
  constructor() {
    super(Role);
  }

  async findByName(name) {
    return Role.findOne({ where: { name } });
  }

  async findAllWithPermissions() {
    return Role.findAll({
      include: [{ model: Permission, as: 'permissions', through: { attributes: [] } }],
      order: [['displayName', 'ASC']],
    });
  }

  async findByIdWithPermissions(id) {
    return Role.findByPk(id, {
      include: [{ model: Permission, as: 'permissions', through: { attributes: [] } }],
    });
  }

  async findPermissionsByIds(ids, options = {}) {
    if (!ids.length) return [];
    return Permission.findAll({ where: { id: ids }, ...options });
  }
}

module.exports = new RoleRepository();
