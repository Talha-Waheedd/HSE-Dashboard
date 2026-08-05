'use strict';

const BaseRepository = require('./base.repository');
const { Inspection, InspectionItem, User, Department, Plant } = require('../database/models');

class InspectionRepository extends BaseRepository {
  constructor() {
    super(Inspection);
  }

  /**
   * Get inspection details with relations and items
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async getDetails(id) {
    return this.findById(id, {
      include: [
        { model: User, as: 'inspector', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Department, as: 'department', attributes: ['id', 'name'] },
        { model: Plant, as: 'plant', attributes: ['id', 'name', 'code'] },
        { model: InspectionItem, as: 'items' },
      ],
    });
  }

  /**
   * Add multiple items to an inspection
   * @param {Array<Object>} itemsData
   * @returns {Promise<Array>}
   */
  async addItems(itemsData) {
    return InspectionItem.bulkCreate(itemsData);
  }

  /**
   * Update a specific inspection item
   * @param {string} itemId
   * @param {Object} data
   * @returns {Promise<number>}
   */
  async updateItem(itemId, data) {
    const [updatedCount] = await InspectionItem.update(data, { where: { id: itemId } });
    return updatedCount;
  }
}

module.exports = new InspectionRepository();
