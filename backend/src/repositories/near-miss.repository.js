'use strict';

const BaseRepository = require('./base.repository');
const { NearMiss, User, Department, Plant } = require('../database/models');

class NearMissRepository extends BaseRepository {
  constructor() {
    super(NearMiss);
  }

  /**
   * Get near miss details with relations
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async getDetails(id) {
    return this.findById(id, {
      include: [
        { model: User, as: 'reporter', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Department, as: 'department', attributes: ['id', 'name'] },
        { model: Plant, as: 'plant', attributes: ['id', 'name', 'code'] },
      ],
    });
  }
}

module.exports = new NearMissRepository();
