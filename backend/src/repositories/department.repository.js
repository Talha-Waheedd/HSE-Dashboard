'use strict';

const BaseRepository = require('./base.repository');
const { Department, Plant, User } = require('../database/models');

class DepartmentRepository extends BaseRepository {
  constructor() {
    super(Department);
  }

  /**
   * Find departments by plant ID
   * @param {string} plantId
   * @returns {Promise<Array>}
   */
  async findByPlantId(plantId) {
    return this.findMany({ plantId, isActive: true }, { order: [['name', 'ASC']] });
  }

  /**
   * Get department details with associations
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async getDetails(id) {
    return this.findById(id, {
      include: [
        { model: Plant, as: 'plant', attributes: ['id', 'name', 'code'] },
        { model: User, as: 'manager', attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
    });
  }
}

module.exports = new DepartmentRepository();
