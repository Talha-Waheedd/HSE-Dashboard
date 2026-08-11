'use strict';

const hazardRepository = require('../../repositories/hazard.repository');
const plantRepository = require('../../repositories/plant.repository');
const employeeRepository = require('../../repositories/employee.repository');
const HazardStatus = require('../../shared/enums/HazardStatus');
const { ApiError } = require('../../shared/utils/index');
const { MESSAGES } = require('../../shared/constants');

const allowUnverifiedHazardEmployee = () =>
  process.env.NODE_ENV !== 'production' &&
  process.env.ALLOW_UNVERIFIED_HAZARD_EMPLOYEE === 'true';

class HazardService {
  /**
   * Report a new hazard
   */
  async createHazard(data, userId) {
    const plant = await plantRepository.findById(data.plantId);
    if (!plant) {
      throw new ApiError(404, MESSAGES.PLANT_NOT_FOUND);
    }

    // Employee ID is stored in metadata rather than as a hazards-table FK.
    // Keep it optional only behind this development flag while the employee
    // master data is unavailable; production always validates the reference.
    const employeeId = String(data.metadata?.emp_id || '').trim();
    if (!allowUnverifiedHazardEmployee()) {
      if (!employeeId) {
        throw ApiError.badRequest('Employee ID is required for hazard reporting.');
      }
      const employee = await employeeRepository.findByEmployeeId(employeeId);
      if (!employee) {
        throw ApiError.badRequest('Employee ID does not match an employee record.');
      }
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
