'use strict';

const hazardRepository = require('../../repositories/hazard.repository');
const plantRepository = require('../../repositories/plant.repository');
const HazardStatus = require('../../shared/enums/HazardStatus');
const { ApiError } = require('../../shared/utils/index');
const { MESSAGES } = require('../../shared/constants');

class HazardService {
  /**
   * Report a new hazard
   */
  async createHazard(data, userId) {
    const plant = await plantRepository.findById(data.plantId);
    if (!plant) {
      throw new ApiError(404, MESSAGES.PLANT_NOT_FOUND);
    }
    
    data.reportedBy = userId;
    data.createdBy = userId;
    // Overwrite status to draft or submitted if specified, but defaults to draft.
    // Business logic: only drafts or submitted allowed on creation.
    if (![HazardStatus.DRAFT, HazardStatus.SUBMITTED].includes(data.status)) {
      data.status = HazardStatus.DRAFT;
    }

    return hazardRepository.create(data);
  }

  /**
   * Get all hazards
   */
  async getAllHazards(options = {}) {
    return hazardRepository.findAndCountAll(options);
  }

  /**
   * Get hazard by ID
   */
  async getHazardById(id) {
    const hazard = await hazardRepository.getDetails(id);
    if (!hazard) {
      throw new ApiError(404, MESSAGES.HAZARD_NOT_FOUND);
    }
    return hazard;
  }

  /**
   * Update hazard
   */
  async updateHazard(id, updateData, userId) {
    const hazard = await this.getHazardById(id);

    // If changing plant, validate it
    if (updateData.plantId && updateData.plantId !== hazard.plantId) {
      const plant = await plantRepository.findById(updateData.plantId);
      if (!plant) throw new ApiError(404, MESSAGES.PLANT_NOT_FOUND);
    }

    updateData.updatedBy = userId;
    return hazardRepository.updateById(id, updateData);
  }

  /**
   * Update hazard status
   */
  async updateStatus(id, newStatus, userId, actionTaken = null) {
    const hazard = await this.getHazardById(id);

    const validStatuses = Object.values(HazardStatus);
    if (!validStatuses.includes(newStatus)) {
      throw new ApiError(400, MESSAGES.HAZARD_INVALID_STATUS);
    }

    const updateData = {
      status: newStatus,
      updatedBy: userId,
    };

    if (actionTaken) {
      updateData.actionTaken = actionTaken;
    }

    if (newStatus === HazardStatus.RESOLVED) {
      updateData.resolvedAt = new Date();
      updateData.resolvedBy = userId;
    } else if (newStatus === HazardStatus.CLOSED) {
      updateData.closedAt = new Date();
      updateData.closedBy = userId;
    }

    return hazardRepository.updateById(id, updateData);
  }

  /**
   * Delete hazard
   */
  async deleteHazard(id) {
    await this.getHazardById(id);
    return hazardRepository.deleteById(id);
  }
}

module.exports = new HazardService();
