'use strict';

const nearMissRepository = require('../../repositories/near-miss.repository');
const plantRepository = require('../../repositories/plant.repository');
const { ApiError } = require('../../shared/utils/index');
const { MESSAGES } = require('../../shared/constants');

class NearMissService {
  /**
   * Report a near miss
   */
  async createNearMiss(data, userId) {
    const plant = await plantRepository.findById(data.plantId);
    if (!plant) {
      throw ApiError.notFound(MESSAGES.PLANT_NOT_FOUND);
    }

    data.reportedBy = userId;
    data.createdBy = userId;
    
    if (!['draft', 'submitted'].includes(data.status)) {
      data.status = 'draft';
    }

    return nearMissRepository.create(data);
  }

  /**
   * Get all near misses
   */
  async getAllNearMisses(options = {}) {
    return nearMissRepository.findAll(options);
  }

  /**
   * Get near miss by ID
   */
  async getNearMissById(id) {
    const nearMiss = await nearMissRepository.getDetails(id);
    if (!nearMiss) {
      throw ApiError.notFound(MESSAGES.NEAR_MISS_NOT_FOUND);
    }
    return nearMiss;
  }

  /**
   * Update near miss
   */
  async updateNearMiss(id, updateData, userId) {
    const nearMiss = await this.getNearMissById(id);

    if (updateData.plantId && updateData.plantId !== nearMiss.plantId) {
      const plant = await plantRepository.findById(updateData.plantId);
      if (!plant) throw ApiError.notFound(MESSAGES.PLANT_NOT_FOUND);
    }

    updateData.updatedBy = userId;
    return nearMissRepository.updateById(id, updateData);
  }

  /**
   * Update near miss status
   */
  async updateStatus(id, newStatus, userId) {
    const nearMiss = await this.getNearMissById(id);

    const validStatuses = ['draft', 'submitted', 'under_review', 'closed'];
    if (!validStatuses.includes(newStatus)) {
      throw ApiError.badRequest('Invalid near miss status');
    }

    const updateData = {
      status: newStatus,
      updatedBy: userId,
    };

    if (newStatus === 'closed') {
      updateData.closedAt = new Date();
      updateData.closedBy = userId;
    }

    return nearMissRepository.updateById(id, updateData);
  }

  /**
   * Delete near miss
   */
  async deleteNearMiss(id) {
    await this.getNearMissById(id);
    return nearMissRepository.deleteById(id);
  }
}

module.exports = new NearMissService();
