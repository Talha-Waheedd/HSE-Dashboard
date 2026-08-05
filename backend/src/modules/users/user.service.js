'use strict';

const userRepository = require('../../repositories/user.repository');
const { buildPagination } = require('../../shared/utils/pagination');
const { buildQuery } = require('../../shared/utils/queryBuilder');
const ApiError = require('../../shared/utils/ApiError');
const { MESSAGES } = require('../../shared/constants/messages');

class UserService {
  async getAllUsers(query) {
    const { where, order } = buildQuery(query, ['firstName', 'lastName', 'email']);
    const { limit, offset, meta } = buildPagination(query, 0);

    const { rows, count } = await userRepository.findAllPaginated({ where, order, limit, offset });
    return { users: rows, meta: { ...meta, total: count, totalPages: Math.ceil(count / limit) } };
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

    await userRepository.update({ ...data, updatedBy: actorId }, { id });
    return userRepository.findByIdWithRole(id);
  }

  async deleteUser(id) {
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
