'use strict';

const plantRepository = require('../../repositories/plant.repository');
const { ApiError } = require('../../shared/utils/index');
const { MESSAGES } = require('../../shared/constants');

class PlantService {
  /**
   * Create a new plant
   */
  async createPlant(plantData, userId) {
    const existing = await plantRepository.findByCode(plantData.code);
    if (existing) {
      throw ApiError.conflict(MESSAGES.PLANT_CODE_TAKEN);
    }
    plantData.createdBy = userId;
    return plantRepository.create(plantData);
  }

  /**
   * Get all plants
   */
  async getAllPlants(options = {}) {
    return plantRepository.findAll(options);
  }

  /**
   * Get active plants
   */
  async getActivePlants() {
    return plantRepository.getActivePlants();
  }

  /**
   * Get plant by ID
   */
  async getPlantById(id) {
    const plant = await plantRepository.findById(id);
    if (!plant) {
      throw ApiError.notFound(MESSAGES.PLANT_NOT_FOUND);
    }
    return plant;
  }

  /**
   * Update plant
   */
  async updatePlant(id, updateData, userId) {
    const plant = await this.getPlantById(id);

    if (updateData.code && updateData.code !== plant.code) {
      const existing = await plantRepository.findByCode(updateData.code);
      if (existing) {
        throw ApiError.conflict(MESSAGES.PLANT_CODE_TAKEN);
      }
    }

    updateData.updatedBy = userId;
    return plantRepository.updateById(id, updateData);
  }

  /**
   * Delete plant (soft delete)
   */
  async deletePlant(id) {
    await this.getPlantById(id);
    return plantRepository.deleteById(id);
  }
}

module.exports = new PlantService();
