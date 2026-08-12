'use strict';

const BaseRepository = require('./base.repository');
const { Hazard, User, Department, Plant } = require('../database/models');

class HazardRepository extends BaseRepository {
  constructor() {
    super(Hazard);
  }

  /**
   * Get hazard details with relations
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async getDetails(id) {
    return this.findById(id, {
      include: [
        { model: User, as: 'reporter', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: User, as: 'assignee', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Department, as: 'department', attributes: ['id', 'name'] },
        { model: Plant, as: 'plant', attributes: ['id', 'name', 'code'] },
      ],
    });
  }

  /**
   * Count hazards grouped by status
   * @param {Object} filterOptions
   * @returns {Promise<Array>}
   */
  async countByStatus(filterOptions = {}) {
    const { col, fn } = this.model.sequelize;
    const query = {
      attributes: ['status', [fn('COUNT', col('id')), 'count']],
      group: ['status'],
      where: filterOptions,
      raw: true,
    };
    return this.model.findAll(query);
  }
}

module.exports = new HazardRepository();
