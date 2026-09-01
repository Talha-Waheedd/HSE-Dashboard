'use strict';

const BaseRepository = require('./base.repository');
const { Incident, IncidentInjury, User, Department, Plant, NearMiss } = require('../database/models');

class IncidentRepository extends BaseRepository {
  constructor() {
    super(Incident);
  }

  /**
   * Get incident details with all relations, including injuries
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async getDetails(id) {
    return this.findById(id, {
      include: [
        { model: User, as: 'reporter', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: User, as: 'investigatedBy_user', attributes: ['id', 'firstName', 'lastName', 'email'] }, // Note: association is investigatedBy in model but need to verify alias if added
        { model: Department, as: 'department', attributes: ['id', 'name', 'code'] },
        { model: Plant, as: 'plant', attributes: ['id', 'name', 'code'] },
        { model: NearMiss, as: 'sourceNearMiss', attributes: ['id', 'title', 'description', 'reportedAt'] },
        { model: IncidentInjury, as: 'injuries' },
      ],
    });
  }

  /**
   * Count incidents grouped by type and status
   * @param {Object} filterOptions
   * @returns {Promise<Array>}
   */
  async countByTypeAndStatus(filterOptions = {}) {
    const { col, fn } = this.model.sequelize;
    const query = {
      attributes: ['incidentType', 'status', [fn('COUNT', col('id')), 'count']],
      group: ['incidentType', 'status'],
      where: filterOptions,
      raw: true,
    };
    return this.model.findAll(query);
  }
}

module.exports = new IncidentRepository();
