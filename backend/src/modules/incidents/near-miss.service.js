'use strict';

const nearMissRepository = require('../../repositories/near-miss.repository');
const plantRepository = require('../../repositories/plant.repository');
const { Department } = require('../../database/models');
const { ApiError } = require('../../shared/utils/index');
const { MESSAGES } = require('../../shared/constants');

const yesNoLabel = (value) => {
  if (value === true || ['yes', 'y', 'true', '1'].includes(String(value ?? '').trim().toLowerCase())) return 'Yes';
  if (value === false || ['no', 'n', 'false', '0'].includes(String(value ?? '').trim().toLowerCase())) return 'No';
  return value == null ? value : String(value);
};

const normalizeOfficialMetadata = (metadata = {}, data = {}) => {
  const nextMetadata = { ...metadata };
  if (data.responsibleDepartmentId) nextMetadata.responsible_department_id = data.responsibleDepartmentId;
  if (data.furtherInvestigationRequired !== undefined) {
    nextMetadata.investigation_required = yesNoLabel(data.furtherInvestigationRequired);
  }
  if (data.reportedInHazard !== undefined) {
    nextMetadata.reported_in_hazard = yesNoLabel(data.reportedInHazard);
  }
  if (data.remarks !== undefined) nextMetadata.remarks = data.remarks;
  return nextMetadata;
};

const validateResponsibleDepartment = async (departmentId) => {
  if (!departmentId) return null;
  const department = await Department.findByPk(departmentId, { attributes: ['id', 'name', 'code'] });
  if (!department) throw ApiError.badRequest('Responsible Department must be selected from the department list.');
  return department;
};

class NearMissService {
  /**
   * Report a near miss
   */
  async createNearMiss(data, userId) {
    const plant = await plantRepository.findById(data.plantId);
    if (!plant) {
      throw ApiError.notFound(MESSAGES.PLANT_NOT_FOUND);
    }

    const responsibleDepartment = await validateResponsibleDepartment(data.responsibleDepartmentId);
    const { metadata, ...nearMissData } = data;
    const persistedData = {
      ...nearMissData,
      metadata: normalizeOfficialMetadata(metadata, data),
      reportedBy: userId,
      createdBy: userId,
    };
    if (responsibleDepartment) {
      persistedData.metadata.responsible_department = responsibleDepartment.code || responsibleDepartment.name;
    }

    if (!['draft', 'submitted', 'under_review', 'closed'].includes(persistedData.status)) {
      persistedData.status = 'draft';
    }

    return nearMissRepository.create(persistedData);
  }

  /**
   * Get all near misses
   */
  async getAllNearMisses(options = {}) {
    return nearMissRepository.findAndCountAll(options);
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

    const responsibleDepartment = await validateResponsibleDepartment(updateData.responsibleDepartmentId);
    const { metadata, ...nearMissFields } = updateData;
    const nextMetadata = normalizeOfficialMetadata(
      { ...(nearMiss.metadata || {}), ...(metadata || {}) },
      updateData,
    );
    if (responsibleDepartment) {
      nextMetadata.responsible_department = responsibleDepartment.code || responsibleDepartment.name;
    }

    return nearMissRepository.updateById(id, {
      ...nearMissFields,
      metadata: nextMetadata,
      updatedBy: userId,
    });
  }

  /**
   * Update near miss status
   */
  async updateStatus(id, newStatus, userId) {
    await this.getNearMissById(id);

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
