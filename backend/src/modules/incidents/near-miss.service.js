'use strict';

const nearMissRepository = require('../../repositories/near-miss.repository');
const plantRepository = require('../../repositories/plant.repository');
const { Department, Incident } = require('../../database/models');
const IncidentType = require('../../shared/enums/IncidentType');
const IncidentStatus = require('../../shared/enums/IncidentStatus');
const { ApiError } = require('../../shared/utils/index');
const { MESSAGES } = require('../../shared/constants');
const { sequelize } = require('../../database/connection');
const { syncBestEffort } = require('../actions/capa-sync.service');

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

const isFinalNearMiss = (nearMiss) => nearMiss.status !== 'draft';

const dateOnly = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
};

/**
 * Create the single Incident Investigation record associated with a finalized
 * Near Miss. Official report fields that cannot be derived reliably remain in
 * metadata as empty values for the HSE investigator to complete later.
 */
const ensureIncidentInvestigation = async (nearMiss, userId, transaction) => {
  if (!nearMiss || !nearMiss.furtherInvestigationRequired || !isFinalNearMiss(nearMiss)) return null;

  const existing = await Incident.findOne({
    where: { sourceNearMissId: nearMiss.id },
    transaction,
    lock: transaction.LOCK.UPDATE,
  });
  if (existing) return existing;

  const sourceMetadata = nearMiss.metadata || {};
  const department = nearMiss.departmentId
    ? await Department.findByPk(nearMiss.departmentId, { attributes: ['id', 'name', 'code'], transaction })
    : null;
  const responsibleDepartment = nearMiss.responsibleDepartmentId
    ? await Department.findByPk(nearMiss.responsibleDepartmentId, { attributes: ['id', 'name', 'code'], transaction })
    : null;
  const eventDate = dateOnly(nearMiss.reportedAt || nearMiss.createdAt);
  const responsibleLabel = responsibleDepartment?.code || responsibleDepartment?.name || sourceMetadata.responsible_department || '';

  const investigationMetadata = {
    ...sourceMetadata,
    source_type: 'near_miss',
    source_near_miss_id: nearMiss.id,
    generated_from_near_miss: true,
    title_of_accident: nearMiss.title || '',
    date_of_accident: eventDate || '',
    time: sourceMetadata.time || '',
    shift_manager_incharge: '',
    shift: sourceMetadata.shift || '',
    place_of_accident: nearMiss.location || '',
    name_of_sufferer: sourceMetadata.affected_person || '',
    designation: sourceMetadata.affected_designation || '',
    department_id: nearMiss.departmentId || '',
    department: department?.code || department?.name || sourceMetadata.department || '',
    area_section: sourceMetadata.area_section || '',
    area_incharge: '',
    operator: '',
    production_officer: '',
    supervisor: '',
    witnesses: '',
    injury_classification: '',
    probability_of_occurrence: '',
    accident_details: nearMiss.description || '',
    main_causes: '',
    immediate_action_taken: '',
    preventive_action_safety_measures: nearMiss.immediateAction || sourceMetadata.preventive_action || '',
    responsibility: responsibleLabel,
    timeline: '',
    safety_incident_pictures: sourceMetadata.attachments || '',
    investigation_team: '',
    capa_verification: '',
    target_date: '',
    completion_status: '',
    completion_date: '',
    verified_by_icm: '',
    reviewed_by_fm: '',
    closed_by_fm: '',
  };

  return Incident.create({
    incidentNumber: `NMI-${eventDate?.slice(0, 4) || new Date().getFullYear()}-${nearMiss.id.slice(0, 8).toUpperCase()}`,
    reportedBy: nearMiss.reportedBy || userId,
    plantId: nearMiss.plantId,
    departmentId: nearMiss.departmentId || null,
    sourceNearMissId: nearMiss.id,
    incidentType: IncidentType.NEAR_MISS_PROMOTED,
    status: IncidentStatus.UNDER_INVESTIGATION,
    severityLevel: nearMiss.severityLevel || 'medium',
    title: nearMiss.title || 'Near Miss Investigation',
    description: nearMiss.description || 'Near Miss investigation generated from a submitted Near Miss record.',
    location: nearMiss.location || null,
    incidentDate: eventDate,
    incidentTime: sourceMetadata.time || null,
    injuredPersonName: sourceMetadata.affected_person || null,
    immediateAction: nearMiss.immediateAction || null,
    createdBy: userId,
    metadata: investigationMetadata,
  }, { transaction });
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
      const investigation = await ensureIncidentInvestigation(nearMiss, userId, transaction);
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
      const investigation = await ensureIncidentInvestigation(updatedNearMiss, userId, transaction);
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
      const investigation = await ensureIncidentInvestigation(updatedNearMiss, userId, transaction);
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
