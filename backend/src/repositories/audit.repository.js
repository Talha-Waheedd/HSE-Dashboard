'use strict';

const BaseRepository = require('./base.repository');
const { AuditLog } = require('../database/models');

class AuditRepository extends BaseRepository {
  constructor() {
    super(AuditLog);
  }

  async log(data) {
    return AuditLog.create(data);
  }

  async findByUser(userId, options = {}) {
    return AuditLog.findAndCountAll({ where: { userId }, order: [['createdAt', 'DESC']], ...options });
  }
}

module.exports = new AuditRepository();
