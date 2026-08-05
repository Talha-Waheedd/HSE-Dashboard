'use strict';

const { withTransaction } = require('../../shared/utils/transaction');
const ApiError = require('../../shared/utils/ApiError');
const repositories = require('./reporting.repository');
const { emitter, EVENTS } = require('../../core/events/emitter');

const auditData = (userId) => ({ createdBy: userId, updatedBy: userId });

class ReportingService {
  async list(resource, query, options = {}) { return repositories[resource].list(query, options); }

  async getById(resource, id, options = {}) {
    const record = await repositories[resource].findById(id, options);
    if (!record) throw new ApiError(404, `${resource} record not found`);
    return record;
  }

  async create(resource, data, userId, options = {}) {
    return withTransaction(async (transaction) => {
      const record = await repositories[resource].create({ ...data, ...auditData(userId) }, { transaction });
      if (resource === 'reports') emitter.emit(EVENTS.DASHBOARD_UPDATED, { resource, id: record.get('reportId'), userId });
      return record;
    }, options.transaction);
  }

  async update(resource, id, data, userId, options = {}) {
    const repository = repositories[resource];
    const record = await repository.findById(id, { transaction: options.transaction });
    if (!record) throw new ApiError(404, `${resource} record not found`);
    await record.update({ ...data, updatedBy: userId }, { transaction: options.transaction });
    return record;
  }

  async remove(resource, id, userId, options = {}) {
    const repository = repositories[resource];
    const record = await repository.findById(id, { transaction: options.transaction });
    if (!record) throw new ApiError(404, `${resource} record not found`);
    await record.update({ updatedBy: userId }, { transaction: options.transaction });
    await record.destroy({ transaction: options.transaction });
    return { id, deleted: true };
  }

  async restore(resource, id, options = {}) {
    const repository = repositories[resource];
    const count = await repository.restoreById(id, options);
    if (!count) throw new ApiError(404, `${resource} deleted record not found`);
    return repository.findById(id, { paranoid: false, transaction: options.transaction });
  }

  async bulkCreate(resource, rows, userId, options = {}) {
    if (!Array.isArray(rows) || rows.length === 0) throw new ApiError(422, 'At least one record is required');
    return withTransaction((transaction) => repositories[resource].bulkCreate(rows.map((row) => ({ ...row, ...auditData(userId) })), { transaction }), options.transaction);
  }
}

module.exports = new ReportingService();
