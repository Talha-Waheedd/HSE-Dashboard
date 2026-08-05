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
    });
  }

  async findByIdWithPermissions(id) {
    return Role.findByPk(id, {
      include: [{ model: Permission, as: 'permissions', through: { attributes: [] } }],
    });
  }
}

module.exports = new RoleRepository();
