'use strict';

const correctiveActionRepository = require('../../repositories/corrective-action.repository');
const plantRepository = require('../../repositories/plant.repository');
const CorrectiveActionStatus = require('../../shared/enums/CorrectiveActionStatus');
const CorrectiveActionSource = require('../../shared/enums/CorrectiveActionSource');
const { ApiError } = require('../../shared/utils/index');
const { MESSAGES } = require('../../shared/constants');

class CorrectiveActionService {
  /**
   * Create a new corrective action
   */
  async createAction(data, userId) {
    const plant = await plantRepository.findById(data.plantId);
    if (!plant) {
      throw ApiError.notFound(MESSAGES.PLANT_NOT_FOUND);
    }

    const validSources = Object.values(CorrectiveActionSource);
    if (!validSources.includes(data.sourceType)) {
      throw ApiError.badRequest('Invalid source type for corrective action');
    }

    data.assignedBy = userId;
    data.createdBy = userId;
    
    if (!data.status || data.status === '') {
      data.status = CorrectiveActionStatus.OPEN;
    }

    return correctiveActionRepository.create(data);
  }

  /**
   * Get all corrective actions
   */
  async getAllActions(options = {}) {
    return correctiveActionRepository.findAndCountAll(options);
  }

  /**
   * Get actions by source
   */
  async getActionsBySource(sourceType, sourceId) {
    return correctiveActionRepository.getBySource(sourceType, sourceId);
  }

  /**
   * Get action by ID
   */
  async getActionById(id) {
    const action = await correctiveActionRepository.getDetails(id);
    if (!action) {
      throw ApiError.notFound(MESSAGES.CA_NOT_FOUND);
    }
    return action;
  }

  /**
   * Update action
   */
  async updateAction(id, updateData, userId) {
    const action = await this.getActionById(id);

    if (updateData.plantId && updateData.plantId !== action.plantId) {
      const plant = await plantRepository.findById(updateData.plantId);
      if (!plant) throw ApiError.notFound(MESSAGES.PLANT_NOT_FOUND);
    }

    updateData.updatedBy = userId;
    return correctiveActionRepository.updateById(id, updateData);
  }

  /**
   * Update action status
   */
  async updateStatus(id, newStatus, userId, verificationNotes = null) {
    const action = await this.getActionById(id);

    const validStatuses = Object.values(CorrectiveActionStatus);
    if (!validStatuses.includes(newStatus)) {
      throw ApiError.badRequest('Invalid corrective action status');
    }

    const updateData = {
      status: newStatus,
      updatedBy: userId,
    };

    if (newStatus === CorrectiveActionStatus.COMPLETED) {
      updateData.completedAt = new Date();
      updateData.completedBy = userId;
    } else if (newStatus === CorrectiveActionStatus.VERIFIED) {
      updateData.verifiedAt = new Date();
      updateData.verifiedBy = userId;
      if (verificationNotes) {
        updateData.verificationNotes = verificationNotes;
      }
    }

    return correctiveActionRepository.updateById(id, updateData);
  }

  /**
   * Delete action
   */
  async deleteAction(id) {
    await this.getActionById(id);
    return correctiveActionRepository.deleteById(id);
  }
}

module.exports = new CorrectiveActionService();
