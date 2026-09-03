'use strict';

const BaseRepository = require('./base.repository');
const {
  CorrectiveAction, User, Plant, Department,
} = require('../database/models');

class CorrectiveActionRepository extends BaseRepository {
  constructor() {
    super(CorrectiveAction);
  }

  async findAndCountAll(options = {}) {
    return this.model.findAndCountAll({
      ...options,
      distinct: true,
      include: [
        { model: Department, as: 'responsibleDepartment', attributes: ['id', 'name', 'code'], required: false },
      ],
    });
  }

  /**
   * Get corrective action details with relations
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async getDetails(id) {
    return this.findById(id, {
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: User, as: 'assigner', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Plant, as: 'plant', attributes: ['id', 'name', 'code'] },
        { model: Department, as: 'responsibleDepartment', attributes: ['id', 'name', 'code'] },
      ],
    });
  }

  /**
   * Get actions for a specific source record (polymorphic)
   * @param {string} sourceType
   * @param {string} sourceId
   * @returns {Promise<Array>}
   */
  async getBySource(sourceType, sourceId) {
    return this.findMany({ sourceType, sourceId }, {
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Department, as: 'responsibleDepartment', attributes: ['id', 'name', 'code'] },
      ],
      order: [['createdAt', 'DESC']],
    });
  }

  /**
   * Count actions grouped by status
   * @param {Object} filterOptions
   * @returns {Promise<Array>}
   */
  async countByStatus(filterOptions = {}) {
    const query = {
      attributes: ['status', [this.model.sequelize.fn('COUNT', 'id'), 'count']],
      group: ['status'],
      where: filterOptions,
      raw: true,
    };
    return this.model.findAll(query);
  }
}

module.exports = new CorrectiveActionRepository();
