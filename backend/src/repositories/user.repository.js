'use strict';

const BaseRepository = require('./base.repository');
const {
  User, Role, Employee, Department, Plant,
} = require('../database/models');

const userIncludes = [
  { model: Role, as: 'role', include: [{ association: 'permissions', through: { attributes: [] } }] },
  {
    model: Employee,
    as: 'employeeProfile',
    required: false,
    include: [
      { model: Department, as: 'department', attributes: ['id', 'name', 'code', 'isActive'] },
      { model: Plant, as: 'plant', attributes: ['id', 'name', 'code'] },
    ],
  },
];

class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  /**
   * Find a user by email (with password included for auth checks).
   */
  async findByEmailWithPassword(email) {
    return User.scope('withPassword').findOne({ where: { email }, include: userIncludes });
  }

  /**
   * Find a user by ID with their role and permissions eager-loaded.
   */
  async findByIdWithRole(id) {
    return User.findByPk(id, {
      include: userIncludes,
    });
  }

  /**
   * Find all users with pagination, search, filter, and sort applied.
   */
  async findAllPaginated({
    where, order, limit, offset, roleId, departmentId,
  }) {
    const includes = [
      {
        model: Role,
        as: 'role',
        attributes: ['id', 'name', 'displayName'],
        ...(roleId ? { where: { id: roleId }, required: true } : {}),
      },
      {
        model: Employee,
        as: 'employeeProfile',
        required: Boolean(departmentId),
        ...(departmentId ? { where: { departmentId } } : {}),
        include: [
          { model: Department, as: 'department', attributes: ['id', 'name', 'code', 'isActive'] },
          { model: Plant, as: 'plant', attributes: ['id', 'name', 'code'] },
        ],
      },
    ];
    return User.findAndCountAll({
      where,
      order,
      limit,
      offset,
      include: includes,
      distinct: true,
    });
  }

  /**
   * Update the last login timestamp for a user.
   */
  async updateLastLogin(userId, transaction = null) {
    return User.update(
      { lastLoginAt: new Date() },
      { where: { id: userId }, transaction },
    );
  }
}

module.exports = new UserRepository();
