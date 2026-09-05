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
const { Department, Attachment, Hazard } = require('../../database/models');
const AttachmentSource = require('../../shared/enums/AttachmentSource');
const { isAdministratorRole } = require('../../shared/constants/roles');
const {
  assertCanSubmitHazardClosure,
  assertCanReviewHazardClosure,
} = require('./hazard-authorization.service');

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

const departmentLabel = (department) => department?.code || department?.name || '';
const normalizeDepartmentReference = (value) => String(value || '').trim().toLowerCase();

const resolveResponsibleDepartment = async (data = {}) => {
  const metadata = data.metadata || {};
  const explicitId = data.responsibleDepartmentId || metadata.responsible_department_id;
  if (explicitId && isUuid(explicitId)) {
    const department = await Department.findOne({ where: { id: explicitId, isActive: true } });
    if (!department) throw ApiError.badRequest('Responsible Department must be an active department.');
    return department;
  }

  const label = metadata.responsible_department || metadata.responsible || data.responsible_department;
  if (!label || isUuid(label)) return null;
  const normalized = normalizeDepartmentReference(label);
  const departments = await Department.findAll({ where: { isActive: true } });
  return departments.find((department) => [department.name, department.code]
    .some((candidate) => normalizeDepartmentReference(candidate) === normalized)) || null;
};

const appendClosureHistory = (metadata, event) => ({
  ...(metadata || {}),
  closure_history: [...(Array.isArray(metadata?.closure_history) ? metadata.closure_history : []), event],
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
    const responsibleReference = data.responsibleDepartmentId || data.metadata?.responsible_department_id || data.metadata?.responsible_department;
    const responsibleDepartment = await resolveResponsibleDepartment(data);
    if (responsibleReference && !responsibleDepartment) {
      throw ApiError.badRequest('Responsible Department must match an active department.');
    }
    if (responsibleDepartment) {
      data.responsibleDepartmentId = responsibleDepartment.id;
      data.metadata = {
        ...data.metadata,
        responsible_department_id: responsibleDepartment.id,
        responsible_department: departmentLabel(responsibleDepartment),
      };
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

    const { metadata, status: _forbiddenStatus, ...hazardFields } = updateData;
    const hasResponsibleUpdate = Object.prototype.hasOwnProperty.call(updateData, 'responsibleDepartmentId')
      || Object.prototype.hasOwnProperty.call(metadata || {}, 'responsible_department_id')
      || Object.prototype.hasOwnProperty.call(metadata || {}, 'responsible_department');
    let responsibleDepartment = null;
    if (hasResponsibleUpdate) {
      const responsibleReference = updateData.responsibleDepartmentId
        || metadata?.responsible_department_id
        || metadata?.responsible_department;
      if (responsibleReference) {
        responsibleDepartment = await resolveResponsibleDepartment(updateData);
        if (!responsibleDepartment) {
          throw ApiError.badRequest('Responsible Department must match an active department.');
        }
      }
      hazardFields.responsibleDepartmentId = responsibleDepartment?.id || null;
    }
    let nextMetadata = normalizeHazardMetadata(
      { ...(hazard.metadata || {}), ...(metadata || {}) },
      updateData,
    );
    if (hasResponsibleUpdate) {
      nextMetadata = {
        ...nextMetadata,
        responsible_department_id: responsibleDepartment?.id || null,
        responsible_department: responsibleDepartment ? departmentLabel(responsibleDepartment) : '',
      };
    }
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
      if (!transaction.finished) await transaction.rollback();
      throw error;
    }
  }

  /**
   * Update hazard status
   */
  async updateStatus(id, newStatus, user, actionTaken = null) {
    const hazard = await this.getHazardById(id);

    if (!isAdministratorRole(user?.role?.name)) {
      throw ApiError.forbidden('Only an administrator can use the generic hazard status endpoint.');
    }
    const userId = user.id;

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
      if (!transaction.finished) await transaction.rollback();
      throw error;
    }
  }

  /**
   * Department-side closure submission. This transition never closes the
   * hazard; it moves the record into the existing under_review state.
   */
  async submitClosure(id, user, remarks = '') {
    const transaction = await sequelize.transaction();
    try {
      const hazard = await Hazard.findByPk(id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!hazard) throw ApiError.notFound(MESSAGES.HAZARD_NOT_FOUND);

      assertCanSubmitHazardClosure(hazard, user);
      if (hazard.status !== HazardStatus.SUBMITTED) {
        throw ApiError.conflict('Only an open hazard can be submitted for HSE review.');
      }

      const proofCount = await Attachment.count({
        where: {
          sourceType: AttachmentSource.HAZARD,
          sourceId: hazard.id,
          attachmentType: 'CLOSING_PROOF_PHOTO',
          uploadedBy: user.id,
        },
        transaction,
      });
      if (proofCount < 1) {
        throw ApiError.badRequest('A closing proof image uploaded by the responsible Department Manager is required.');
      }

      const submittedAt = new Date();
      let metadata = appendClosureHistory(hazard.metadata, {
        event: 'submitted_for_hse_review',
        user_id: user.id,
        at: submittedAt.toISOString(),
        remarks: String(remarks || '').trim(),
      });
      metadata = {
        ...metadata,
        closure_submission: {
          submitted_by: user.id,
          submitted_at: submittedAt.toISOString(),
          closing_remarks: String(remarks || '').trim(),
          responsible_department_id: hazard.responsibleDepartmentId,
        },
        hse_review: null,
      };

      await hazard.update({
        status: HazardStatus.UNDER_REVIEW,
        actionTaken: String(remarks || '').trim() || hazard.actionTaken,
        metadata,
        updatedBy: user.id,
      }, { transaction });
      await transaction.commit();
      await syncBestEffort('hazard', id);
      return this.getHazardById(id);
    } catch (error) {
      if (!transaction.finished) await transaction.rollback();
      throw error;
    }
  }

  /**
   * HSE-side decision. Approval is the only workflow path that sets Closed;
   * rejection returns the same record to the responsible department.
   */
  async reviewClosure(id, user, { decision, remarks = '', reason = '' }) {
    assertCanReviewHazardClosure(user);
    const transaction = await sequelize.transaction();
    try {
      const hazard = await Hazard.findByPk(id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!hazard) throw ApiError.notFound(MESSAGES.HAZARD_NOT_FOUND);
      if (hazard.status !== HazardStatus.UNDER_REVIEW || !hazard.metadata?.closure_submission?.submitted_by) {
        throw ApiError.conflict('Hazard closure is not awaiting HSE review.');
      }

      const reviewedAt = new Date();
      const approved = decision === 'approved';
      let metadata = appendClosureHistory(hazard.metadata, {
        event: approved ? 'hse_approved' : 'hse_rejected',
        user_id: user.id,
        at: reviewedAt.toISOString(),
        remarks: String(remarks || '').trim(),
        reason: String(reason || '').trim(),
      });
      metadata = {
        ...metadata,
        hse_review: {
          decision,
          reviewed_by: user.id,
          reviewed_at: reviewedAt.toISOString(),
          remarks: String(remarks || '').trim(),
          reason: String(reason || '').trim(),
        },
      };

      await hazard.update({
        status: approved ? HazardStatus.CLOSED : HazardStatus.SUBMITTED,
        closedAt: approved ? reviewedAt : null,
        closedBy: approved ? user.id : null,
        metadata,
        updatedBy: user.id,
      }, { transaction });
      await transaction.commit();
      await syncBestEffort('hazard', id);
      return this.getHazardById(id);
    } catch (error) {
      if (!transaction.finished) await transaction.rollback();
      throw error;
    }
  }

  /**
   * Delete hazard
   */
  async deleteHazard(id) {
    await this.getHazardById(id);
    const result = await hazardRepository.deleteById(id);
    await syncBestEffort('hazard', id);
    return result;
  }
}

module.exports = new HazardService();
