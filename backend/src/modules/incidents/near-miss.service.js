'use strict';

const nearMissRepository = require('../../repositories/near-miss.repository');
const plantRepository = require('../../repositories/plant.repository');
const { Department } = require('../../database/models');
const { ApiError } = require('../../shared/utils/index');
const { MESSAGES } = require('../../shared/constants');
const { sequelize } = require('../../database/connection');
const { syncBestEffort } = require('../actions/capa-sync.service');
const { ensureNearMissInvestigation } = require('./investigation-sync.service');

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

    const transaction = await sequelize.transaction();
    try {
      const nearMiss = await nearMissRepository.create(persistedData, { transaction });
      const investigation = await ensureNearMissInvestigation(nearMiss, userId, transaction);
      await transaction.commit();
      await Promise.all([
        syncBestEffort('near_miss', nearMiss.id),
        investigation ? syncBestEffort('incident', investigation.id) : Promise.resolve(null),
      ]);
      return nearMiss;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
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

    const transaction = await sequelize.transaction();
    try {
      const updatePayload = {
        ...nearMissFields,
        metadata: nextMetadata,
        updatedBy: userId,
      };
      const result = await nearMissRepository.updateById(id, updatePayload, { transaction });
      const updatedNearMiss = {
        ...(nearMiss.get ? nearMiss.get({ plain: true }) : nearMiss),
        ...nearMissFields,
        metadata: nextMetadata,
      };
      const investigation = await ensureNearMissInvestigation(updatedNearMiss, userId, transaction);
      await transaction.commit();
      await Promise.all([
        syncBestEffort('near_miss', id),
        investigation ? syncBestEffort('incident', investigation.id) : Promise.resolve(null),
      ]);
      return result;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
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

    const transaction = await sequelize.transaction();
    try {
      const result = await nearMissRepository.updateById(id, updateData, { transaction });
      const updatedNearMiss = {
        ...(nearMiss.get ? nearMiss.get({ plain: true }) : nearMiss),
        ...updateData,
      };
      const investigation = await ensureNearMissInvestigation(updatedNearMiss, userId, transaction);
      await transaction.commit();
      await Promise.all([
        syncBestEffort('near_miss', id),
        investigation ? syncBestEffort('incident', investigation.id) : Promise.resolve(null),
      ]);
      return result;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
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
