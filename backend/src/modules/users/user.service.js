'use strict';

const userRepository = require('../../repositories/user.repository');
const employeeRepository = require('../../repositories/employee.repository');
const { sequelize } = require('../../database/connection');
const { Role, Department, Employee } = require('../../database/models');
const { buildPagination } = require('../../shared/utils/pagination');
const { buildQuery } = require('../../shared/utils/queryBuilder');
const ApiError = require('../../shared/utils/ApiError');
const { MESSAGES } = require('../../shared/constants/messages');
const { hashPassword } = require('../../shared/utils/hashHelper');

class UserService {
  async getAllUsers(query) {
    const { where, order } = buildQuery(
      { ...query, sort: query.sort || '-created_at' },
      ['firstName', 'lastName', 'email'],
    );
    if (query.status !== undefined && query.status !== '') {
      where.status = ['true', '1', 'active'].includes(String(query.status).toLowerCase());
    }
    const { limit, offset, meta } = buildPagination(query, 20);

    const { rows, count } = await userRepository.findAllPaginated({
      where,
      order,
      limit,
      offset,
      roleId: query.roleId || undefined,
      departmentId: query.departmentId || undefined,
    });
    return { users: rows, meta: { ...meta, total: count, totalPages: Math.ceil(count / limit) } };
  }

  async validateAssignments({ roleId, departmentId }) {
    const role = roleId ? await Role.findByPk(roleId) : null;
    if (roleId && !role) throw ApiError.badRequest('Selected role does not exist');
    const department = departmentId ? await Department.findByPk(departmentId) : null;
    if (departmentId && (!department || !department.isActive)) throw ApiError.badRequest('Selected department is not active');
    return { role, department };
  }

  async createUser(data, actorId) {
    if (await userRepository.exists({ email: data.email })) {
      throw ApiError.conflict(MESSAGES.EMAIL_TAKEN);
    }
    if (data.employeeId && await employeeRepository.findByEmployeeId(data.employeeId)) {
      throw ApiError.conflict(MESSAGES.EMPLOYEE_ID_TAKEN);
    }
    const { department } = await this.validateAssignments(data);
    const transaction = await sequelize.transaction();
    try {
      const password = data.password ? await hashPassword(data.password) : null;
      const user = await userRepository.create({
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email,
        phone: data.phone || null,
        password,
        status: data.status !== false,
        isEmailVerified: true,
        roleId: data.roleId || null,
        createdBy: actorId,
        updatedBy: actorId,
      }, { transaction });
      if (data.employeeId) {
        await Employee.create({
          userId: user.id,
          employeeId: data.employeeId.trim(),
          departmentId: data.departmentId || null,
          plantId: data.plantId || department?.plantId || null,
          designation: data.designation?.trim() || null,
        }, { transaction });
      }
      await transaction.commit();
      return this.getUserById(user.id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getUserById(id) {
    const user = await userRepository.findByIdWithRole(id);
    if (!user) throw ApiError.notFound(MESSAGES.USER_NOT_FOUND);
    return user;
  }

  async updateUser(id, data, actorId) {
    const user = await userRepository.findById(id);
    if (!user) throw ApiError.notFound(MESSAGES.USER_NOT_FOUND);

    if (data.email && data.email !== user.email) {
      const exists = await userRepository.exists({ email: data.email });
      if (exists) throw ApiError.conflict(MESSAGES.EMAIL_TAKEN);
    }

    const { department } = await this.validateAssignments(data);
    const profile = await employeeRepository.findByUserId(id);
    if (data.employeeId && data.employeeId !== profile?.employeeId) {
      const existing = await employeeRepository.findByEmployeeId(data.employeeId);
      if (existing) throw ApiError.conflict(MESSAGES.EMPLOYEE_ID_TAKEN);
    }

    const transaction = await sequelize.transaction();
    try {
      const userFields = ['firstName', 'lastName', 'phone', 'email', 'status', 'roleId'];
      const userPatch = Object.fromEntries(userFields
        .filter((field) => data[field] !== undefined)
        .map((field) => [field, data[field]]));
      userPatch.updatedBy = actorId;
      if (data.password) userPatch.password = await hashPassword(data.password);
      await userRepository.update(userPatch, { id }, { transaction });

      const employeeFieldsPresent = ['employeeId', 'departmentId', 'plantId', 'designation']
        .some((field) => data[field] !== undefined);
      if (profile && employeeFieldsPresent) {
        await Employee.update({
          ...(data.employeeId !== undefined ? { employeeId: data.employeeId.trim() } : {}),
          ...(data.departmentId !== undefined ? { departmentId: data.departmentId || null } : {}),
          ...(data.plantId !== undefined || department
            ? { plantId: data.plantId || department?.plantId || profile.plantId }
            : {}),
          ...(data.designation !== undefined
            ? { designation: data.designation?.trim() || null }
            : {}),
        }, { where: { id: profile.id }, transaction });
      } else if (!profile && data.employeeId) {
        await Employee.create({
          userId: id,
          employeeId: data.employeeId.trim(),
          departmentId: data.departmentId || null,
          plantId: data.plantId || department?.plantId || null,
          designation: data.designation?.trim() || null,
        }, { transaction });
      }
      await transaction.commit();
      return userRepository.findByIdWithRole(id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async deleteUser(id, actorId) {
    if (id === actorId) throw ApiError.badRequest('You cannot delete your own account');
    const user = await userRepository.findById(id);
    if (!user) throw ApiError.notFound(MESSAGES.USER_NOT_FOUND);
    await userRepository.delete({ id });
  }

  async uploadAvatar(userId, filename) {
    await userRepository.update({ avatar: filename }, { id: userId });
    return userRepository.findById(userId);
  }
}

module.exports = new UserService();
