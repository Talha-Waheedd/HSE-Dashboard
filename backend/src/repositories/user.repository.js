'use strict';

const BaseRepository = require('./base.repository');
const { User, Role } = require('../database/models');

class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  /**
   * Find a user by email (with password included for auth checks).
   */
  async findByEmailWithPassword(email) {
    return User.scope('withPassword').findOne({ where: { email } });
  }

  /**
   * Find a user by ID with their role and permissions eager-loaded.
   */
  async findByIdWithRole(id) {
    return User.findByPk(id, {
      include: [{ model: Role, as: 'role', include: [{ association: 'permissions' }] }],
    });
  }

  /**
   * Find all users with pagination, search, filter, and sort applied.
   */
  async findAllPaginated({ where, order, limit, offset }) {
    return User.findAndCountAll({
      where,
      order,
      limit,
      offset,
      include: [{ model: Role, as: 'role', attributes: ['id', 'name', 'displayName'] }],
      distinct: true,
    });
  }

  /**
   * Update the last login timestamp for a user.
   */
  async updateLastLogin(userId, transaction = null) {
    return User.update(
      { last_login_at: new Date() },
      { where: { id: userId }, transaction },
    );
  }
}

module.exports = new UserRepository();
