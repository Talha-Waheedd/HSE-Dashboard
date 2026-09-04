'use strict';

const { Department, Incident } = require('../../database/models');
const IncidentType = require('../../shared/enums/IncidentType');
const IncidentStatus = require('../../shared/enums/IncidentStatus');

const dateOnly = (value) => {
  if (!value) return new Date().toISOString().slice(0, 10);
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
};

const departmentFor = async (departmentId, transaction) => departmentId
  ? Department.findByPk(departmentId, { attributes: ['id', 'name', 'code'], transaction })
  : null;

const findOrCreateInvestigation = async ({ sourceWhere, defaults, transaction }) => {
  const [investigation] = await Incident.findOrCreate({
    where: sourceWhere,
    defaults,
    transaction,
  });
  return investigation;
};

const ensureNearMissInvestigation = async (nearMiss, userId, transaction) => {
  if (!nearMiss || !nearMiss.furtherInvestigationRequired || nearMiss.status === 'draft') return null;

  const sourceMetadata = nearMiss.metadata || {};
  const department = await departmentFor(nearMiss.departmentId, transaction);
  const responsibleDepartment = await departmentFor(nearMiss.responsibleDepartmentId, transaction);
  const eventDate = dateOnly(nearMiss.reportedAt || nearMiss.createdAt);
  const responsibleLabel = responsibleDepartment?.code || responsibleDepartment?.name || sourceMetadata.responsible_department || '';
  const metadata = {
    ...sourceMetadata,
    source_type: 'near_miss',
    source_near_miss_id: nearMiss.id,
    generated_from_near_miss: true,
    title_of_accident: nearMiss.title || '',
    date_of_accident: eventDate,
    time: sourceMetadata.time || '',
    shift_manager_incharge: '',
    shift: sourceMetadata.shift || '',
    place_of_accident: nearMiss.location || '',
    name_of_sufferer: sourceMetadata.affected_person || '',
    designation: sourceMetadata.affected_designation || '',
    department_id: nearMiss.departmentId || '',
    department: department?.code || department?.name || sourceMetadata.department || '',
    area_section: sourceMetadata.area_section || '',
    area_incharge: '', operator: '', production_officer: '', supervisor: '', witnesses: '',
    injury_classification: '', probability_of_occurrence: '',
    accident_details: nearMiss.description || '',
    main_causes: '', immediate_action_taken: '',
    preventive_action_safety_measures: nearMiss.immediateAction || sourceMetadata.preventive_action || '',
    responsibility: responsibleLabel,
    timeline: '', safety_incident_pictures: sourceMetadata.attachments || '',
    investigation_team: '', capa_verification: '', target_date: '', completion_status: '',
    completion_date: '', verified_by_icm: '', reviewed_by_fm: '', closed_by_fm: '',
  };

  return findOrCreateInvestigation({
    sourceWhere: { sourceNearMissId: nearMiss.id },
    transaction,
    defaults: {
      incidentNumber: `NMI-${eventDate.slice(0, 4)}-${nearMiss.id.slice(0, 8).toUpperCase()}`,
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
      metadata,
    },
  });
};

const ensureHazardInvestigation = async (hazard, userId, transaction) => {
  if (!hazard || !hazard.furtherInvestigationRequired || hazard.status === 'draft') return null;

  const sourceMetadata = hazard.metadata || {};
  const department = await departmentFor(hazard.departmentId, transaction);
  const eventDate = dateOnly(hazard.reportedAt || hazard.createdAt);
  const responsibility = sourceMetadata.responsible_person || sourceMetadata.responsible_department || '';
  const preventiveAction = sourceMetadata.corrective_action || hazard.actionTaken || '';
  const metadata = {
    ...sourceMetadata,
    source_type: 'hazard',
    source_hazard_id: hazard.id,
    generated_from_hazard: true,
    source_reported_by: sourceMetadata.originator || '',
    title_of_accident: hazard.title || '',
    date_of_accident: eventDate,
    time: sourceMetadata.time || '',
    shift_manager_incharge: '',
    shift: sourceMetadata.shift || '',
    place_of_accident: hazard.location || '',
    name_of_sufferer: sourceMetadata.person_name || '',
    designation: sourceMetadata.designation || '',
    department_id: hazard.departmentId || '',
    department: department?.code || department?.name || sourceMetadata.department_id || '',
    area_section: sourceMetadata.area_section || '',
    area_incharge: '', operator: '', production_officer: '', supervisor: '', witnesses: '',
    injury_classification: '', probability_of_occurrence: '',
    accident_details: hazard.description || '',
    main_causes: '', immediate_action_taken: '',
    preventive_action_safety_measures: preventiveAction,
    responsibility,
    timeline: sourceMetadata.target_date || '',
    safety_incident_pictures: '', investigation_team: '', capa_verification: '',
    target_date: sourceMetadata.target_date || '', completion_status: '', completion_date: '',
    verified_by_icm: '', reviewed_by_fm: '', closed_by_fm: '',
  };

  return findOrCreateInvestigation({
    sourceWhere: { sourceHazardId: hazard.id },
    transaction,
    defaults: {
      incidentNumber: `HZI-${eventDate.slice(0, 4)}-${hazard.id.slice(0, 8).toUpperCase()}`,
      reportedBy: hazard.reportedBy || userId,
      plantId: hazard.plantId,
      departmentId: hazard.departmentId || null,
      sourceHazardId: hazard.id,
      incidentType: IncidentType.HAZARD_PROMOTED,
      status: IncidentStatus.UNDER_INVESTIGATION,
      severityLevel: hazard.severityLevel || 'medium',
      title: hazard.title || 'Hazard Investigation',
      description: hazard.description || 'Incident Investigation generated from a submitted Hazard record.',
      location: hazard.location || null,
      incidentDate: eventDate,
      incidentTime: sourceMetadata.time || null,
      injuredPersonName: sourceMetadata.person_name || null,
      immediateAction: preventiveAction || null,
      createdBy: userId,
      metadata,
    },
  });
};

module.exports = { ensureNearMissInvestigation, ensureHazardInvestigation };
