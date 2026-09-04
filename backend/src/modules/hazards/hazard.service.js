'use strict';

const hazardRepository = require('../../repositories/hazard.repository');
const plantRepository = require('../../repositories/plant.repository');
const employeeRepository = require('../../repositories/employee.repository');
const { sequelize } = require('../../database/connection');
const HazardStatus = require('../../shared/enums/HazardStatus');
const { ApiError } = require('../../shared/utils/index');
const { MESSAGES } = require('../../shared/constants');
const { syncBestEffort } = require('../actions/capa-sync.service');
const { ensureHazardInvestigation } = require('../incidents/investigation-sync.service');

const DEFAULT_PLANT_ID = '5126923e-b77f-4eb6-8b98-d5fc9db8d71b';
const isUuid = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));
const normalizeStatus = (value) => {
  const normalized = String(value || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
  return Object.values(HazardStatus).includes(normalized) ? normalized : HazardStatus.DRAFT;
};
const bypassHazardValidation = () =>
  process.env.NODE_ENV === 'development' && process.env.BYPASS_HAZARD_VALIDATION === 'true';

const allowUnverifiedHazardEmployee = () =>
  process.env.NODE_ENV === 'development' &&
  process.env.ALLOW_UNVERIFIED_HAZARD_EMPLOYEE === 'true';

const assertWordLimit = (value, label) => {
  const count = String(value || '').trim() ? String(value).trim().split(/\s+/).length : 0;
  if (count > 500) throw ApiError.badRequest(`${label} cannot exceed 500 words (${count}/500 words).`);
};

const yesNoLabel = (value) => value === true || ['yes', 'y', 'true', '1'].includes(String(value ?? '').trim().toLowerCase())
  ? 'Yes'
  : 'No';

const normalizeHazardMetadata = (metadata = {}, data = {}) => ({
  ...metadata,
  ...(data.furtherInvestigationRequired !== undefined
    ? { investigation_required: yesNoLabel(data.furtherInvestigationRequired) }
    : {}),
});

class HazardService {
  /**
   * Report a new hazard
   */
  async createHazard(data, userId) {
    assertWordLimit(data.description, 'Hazard Details');
    assertWordLimit(data.metadata?.corrective_action, 'Corrective Action');
    assertWordLimit(data.metadata?.remarks, 'Remarks');
    if (bypassHazardValidation()) {
      const metadata = data.metadata && typeof data.metadata === 'object' ? data.metadata : {};
      // The database has mandatory columns and a status enum. Normalize every
      // raw development payload into safe persisted values while retaining the
      // original form input in metadata for later cleanup/review.
      data = {
        ...data,
        plantId: isUuid(data.plantId) ? data.plantId : DEFAULT_PLANT_ID,
        departmentId: isUuid(data.departmentId) ? data.departmentId : null,
        category: String(data.category || 'other').trim().toLowerCase() || 'other',
        severityLevel: String(data.severityLevel || 'low').trim().toLowerCase() || 'low',
        title: String(data.title || data.description || 'Hazard Report').trim().slice(0, 255) || 'Hazard Report',
        description: String(data.description || 'No description provided').trim() || 'No description provided',
        status: normalizeStatus(data.status),
        reportedAt: data.reportedAt && !Number.isNaN(Date.parse(data.reportedAt)) ? data.reportedAt : new Date(),
        metadata: { ...metadata, ...(data.emp_id !== undefined ? { emp_id: data.emp_id } : {}) },
      };
    } else {
      const plant = await plantRepository.findById(data.plantId);
      if (!plant) {
        throw ApiError.notFound(MESSAGES.PLANT_NOT_FOUND);
      }
    }

    data.metadata = normalizeHazardMetadata(data.metadata, data);

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
    if (![HazardStatus.DRAFT, HazardStatus.SUBMITTED].includes(data.status)) data.status = HazardStatus.DRAFT;

    // Do not report success until the insert transaction has committed and the
    // row can be read back with its generated database ID and associations.
    let investigation = null;
    const created = await sequelize.transaction(async (transaction) => {
      const record = await hazardRepository.create(data, { transaction });
      if (!record?.id) {
        throw ApiError.internal('Hazard record was not persisted.');
      }
      investigation = await ensureHazardInvestigation(record, userId, transaction);
      return record;
    });

    const persisted = await hazardRepository.getDetails(created.id);
    if (!persisted) {
      throw ApiError.internal('Hazard record could not be read after commit.');
    }
    await Promise.all([
      syncBestEffort('hazard', persisted.id),
      investigation ? syncBestEffort('incident', investigation.id) : Promise.resolve(null),
    ]);
    return persisted;
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
      throw ApiError.notFound(MESSAGES.HAZARD_NOT_FOUND);
    }
    return hazard;
  }

  /**
   * Update hazard
   */
  async updateHazard(id, updateData, userId) {
    const hazard = await this.getHazardById(id);
    assertWordLimit(updateData.description, 'Hazard Details');
    assertWordLimit(updateData.metadata?.corrective_action, 'Corrective Action');
    assertWordLimit(updateData.metadata?.remarks, 'Remarks');

    // If changing plant, validate it
    if (updateData.plantId && updateData.plantId !== hazard.plantId) {
      const plant = await plantRepository.findById(updateData.plantId);
      if (!plant) throw ApiError.notFound(MESSAGES.PLANT_NOT_FOUND);
    }

    const { metadata, ...hazardFields } = updateData;
    const nextMetadata = normalizeHazardMetadata(
      { ...(hazard.metadata || {}), ...(metadata || {}) },
      updateData,
    );
    const transaction = await sequelize.transaction();
    try {
      const updatePayload = { ...hazardFields, metadata: nextMetadata, updatedBy: userId };
      const result = await hazardRepository.updateById(id, updatePayload, { transaction });
      const updatedHazard = {
        ...(hazard.get ? hazard.get({ plain: true }) : hazard),
        ...hazardFields,
        metadata: nextMetadata,
      };
      const investigation = await ensureHazardInvestigation(updatedHazard, userId, transaction);
      await transaction.commit();
      await Promise.all([
        syncBestEffort('hazard', id),
        investigation ? syncBestEffort('incident', investigation.id) : Promise.resolve(null),
      ]);
      return result;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Update hazard status
   */
  async updateStatus(id, newStatus, userId, actionTaken = null) {
    const hazard = await this.getHazardById(id);

    const validStatuses = Object.values(HazardStatus);
    if (!validStatuses.includes(newStatus)) {
      throw ApiError.badRequest(MESSAGES.HAZARD_INVALID_STATUS);
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
      // Resolved is the business closure transition for this lifecycle. Use
      // the transition time as the auditable closure time; never backfill
      // historical rows with fabricated dates.
      updateData.closedAt = new Date();
      updateData.closedBy = userId;
    } else if (newStatus === HazardStatus.CLOSED) {
      updateData.closedAt = new Date();
      updateData.closedBy = userId;
    }

    const transaction = await sequelize.transaction();
    try {
      const result = await hazardRepository.updateById(id, updateData, { transaction });
      const updatedHazard = {
        ...(hazard.get ? hazard.get({ plain: true }) : hazard),
        ...updateData,
      };
      const investigation = await ensureHazardInvestigation(updatedHazard, userId, transaction);
      await transaction.commit();
      await Promise.all([
        syncBestEffort('hazard', id),
        investigation ? syncBestEffort('incident', investigation.id) : Promise.resolve(null),
      ]);
      return result;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
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
