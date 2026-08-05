'use strict';

const BaseRepository = require('./base.repository');
const { Plant } = require('../database/models');

class PlantRepository extends BaseRepository {
  constructor() {
    super(Plant);
  }

  /**
   * Find a plant by its unique code
   * @param {string} code
   * @returns {Promise<Object|null>}
   */
  async findByCode(code) {
    return this.findOne({ code });
  }

  /**
   * Get all active plants
   * @returns {Promise<Array>}
   */
  async getActivePlants() {
    return this.findMany({ isActive: true }, { order: [['name', 'ASC']] });
  }
}

module.exports = new PlantRepository();
