'use strict';

const { Op } = require('sequelize');
const incidentService = require('./incident.service');
const { ApiResponse, asyncHandler } = require('../../shared/utils/index');
const { Department, Incident, Location } = require('../../database/models');
const {
  parsePagination, parseOrder, paginationMeta, addTextSearch, sendCsvExport,
} = require('../../shared/utils/pagination');

const isDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));
const nextDate = (value) => {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
};

const incidentStatusLabel = (value) => ({
  draft: 'Draft', reported: 'Open', under_investigation: 'In Progress', corrective_action: 'In Progress', closed: 'Closed', resolved: 'Closed',
}[String(value || '').toLowerCase()] || value || '');
const csvDate = (value) => {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toISOString().slice(0, 10);
};

const incidentTypeLabel = (value) => ({
  first_aid: 'First Aid', mtc: 'MTC', rwc: 'RWC', lti: 'LTI', fatality: 'Fatality',
  fire: 'Fire', minor_fire: 'Minor Fire', major_fire: 'Major Fire', significant_near_miss: 'Significant Near Miss',
  hazard_promoted: 'Hazard Investigation', near_miss_promoted: 'Near Miss Investigation',
}[String(value || '').toLowerCase()] || String(value || '').replaceAll('_', ' '));

const serializeIncidentCsv = (row) => {
  const metadata = row.metadata || {};
  return {
    'Incident No.': row.incidentNumber || '',
    Date: csvDate(row.incidentDate),
    Time: row.incidentTime || '',
    Description: row.description || '',
    'EMP ID': metadata.emp_id || metadata.employee_id || '',
    Department: row.department?.code || row.department?.name || metadata.department || metadata.department_id || '',
    Category: incidentTypeLabel(row.incidentType),
    Location: row.locationRecord?.name || row.location || metadata.location || '',
    Severity: row.severityLevel || '',
    Status: incidentStatusLabel(row.status),
    'Injured Person': row.injuredPersonName || metadata.person_name || '',
    'Immediate Action': row.immediateAction || '',
    'Investigation Findings': row.investigationFindings || '',
    'Root Cause': row.rootCause || '',
  };
};

const buildIncidentWhere = async (query = {}) => {
  const where = {};
  if (query.plantId && query.plantId !== 'All') where.plantId = query.plantId;
  if (query.status && query.status !== 'All') where.status = query.status;
  if (query.severityLevel && query.severityLevel !== 'All') where.severityLevel = query.severityLevel;

  // The Incident Investigation leading-indicator page is backed by the
  // incidents table, but includes only investigations generated from source
  // reports rather than every accident in the lagging register.
  if (query.investigationOnly === 'true') {
    where[Op.or] = [
      { sourceNearMissId: { [Op.not]: null } },
      { sourceHazardId: { [Op.not]: null } },
    ];
  }
  if (query.excludeInvestigations === 'true') {
    where.sourceNearMissId = null;
    where.sourceHazardId = null;
  }
  if (query.sourceType === 'near_miss') where.sourceNearMissId = { [Op.not]: null };
  if (query.sourceType === 'hazard') where.sourceHazardId = { [Op.not]: null };
  if (query.sourceNearMissId) where.sourceNearMissId = query.sourceNearMissId;
  if (query.sourceHazardId) where.sourceHazardId = query.sourceHazardId;

  if (query.incidentType && query.incidentType !== 'All') {
    const requestedTypes = String(query.incidentType).split(',')
      .map((value) => value.trim()).filter(Boolean);
    const expandedTypes = requestedTypes.flatMap((type) => ({
      fire: ['major_fire', 'minor_fire', 'fire'],
      injury: ['first_aid', 'mtc', 'rwc', 'lti', 'fatality'],
      'first aid': ['first_aid'],
      'minor fire': ['minor_fire'],
      'major fire': ['major_fire'],
    }[type.toLowerCase()] || [type.toLowerCase().replace(/\s+/g, '_')]));
    where.incidentType = expandedTypes.length === 1 ? expandedTypes[0] : { [Op.in]: expandedTypes };
  }

  const year = /^\d{4}$/.test(String(query.year || '')) ? Number(query.year) : null;
  const monthNumber = Number(query.month);
  const month = Number.isInteger(monthNumber) && monthNumber >= 1 && monthNumber <= 12
    ? monthNumber : null;
  const fromDate = isDate(query.fromDate) ? query.fromDate : null;
  const toDate = isDate(query.toDate) ? nextDate(query.toDate) : null;
  if (fromDate || toDate) {
    where.incidentDate = {
      ...(fromDate ? { [Op.gte]: fromDate } : {}),
      ...(toDate ? { [Op.lt]: toDate } : {}),
    };
  }
  if (year) {
    where[Op.and] = [...(where[Op.and] || []), Incident.sequelize.where(
      Incident.sequelize.fn('YEAR', Incident.sequelize.col('Incident.incident_date')),
      year,
    )];
  }
  if (month) {
    where[Op.and] = [...(where[Op.and] || []), Incident.sequelize.where(
      Incident.sequelize.fn('MONTH', Incident.sequelize.col('Incident.incident_date')),
      month,
    )];
  }

  addTextSearch(where, query.search, ['incident_number', 'title', 'description'], Incident);
  if (query.department && query.department !== 'All') {
    const department = await Department.findOne({
      where: {
        [Op.or]: [
          { id: query.department }, { code: query.department }, { name: query.department },
        ],
      },
      attributes: ['id'],
    });
    where[Op.and] = [...(where[Op.and] || []), department?.id
      ? {
        [Op.or]: [
          { departmentId: department.id },
          Incident.sequelize.literal(`JSON_UNQUOTE(JSON_EXTRACT(\`metadata\`, '$.department_id')) = ${Incident.sequelize.escape(query.department)}`),
          Incident.sequelize.literal(`JSON_UNQUOTE(JSON_EXTRACT(\`metadata\`, '$.department')) = ${Incident.sequelize.escape(query.department)}`),
        ],
      }
      : { departmentId: '__no_matching_department__' }];
  }
  return where;
};

/**
 * Report a new incident
 */
const createIncident = asyncHandler(async (req, res) => {
  const incident = await incidentService.createIncident(req.body, req.user.id);
  res.status(201).json(ApiResponse.success(incident, 'Incident reported successfully', 201));
});

/**
 * Get all incidents
 */
const getAllIncidents = asyncHandler(async (req, res) => {
  const pagination = parsePagination(req.query);
  const options = {
    ...pagination,
    where: await buildIncidentWhere(req.query),
    include: [
      { model: Department, as: 'department', attributes: ['id', 'name', 'code'] },
      {
        model: Location,
        as: 'locationRecord',
        attributes: ['id', 'name', 'code', 'isActive'],
        required: false,
        paranoid: false,
      },
    ],
  };
  options.order = parseOrder(req.query, { date: 'incidentDate', incidentDate: 'incidentDate', createdAt: 'createdAt' });

  const result = await incidentService.getAllIncidents(options);
  res.status(200).json(ApiResponse.success(result.rows, 'Incidents retrieved successfully', paginationMeta({ ...pagination, total: result.count })));
});

const getIncidentSummary = asyncHandler(async (req, res) => {
  const summary = await incidentService.getSummary(await buildIncidentWhere(req.query));
  res.status(200).json(ApiResponse.success(summary, 'Incident summary retrieved successfully'));
});

/**
 * Get incident by ID
 */
const getIncidentById = asyncHandler(async (req, res) => {
  const incident = await incidentService.getIncidentById(req.params.id);
  res.status(200).json(ApiResponse.success(incident, 'Incident retrieved successfully'));
});
const exportIncidents = asyncHandler(async (req, res) => {
  const where = await buildIncidentWhere(req.query);
  await sendCsvExport(res, Incident, {
    where,
    include: [
      { model: Department, as: 'department', attributes: ['name', 'code'], required: false },
      { model: Location, as: 'locationRecord', attributes: ['name', 'code'], required: false, paranoid: false },
    ],
    nest: true,
    serializeRow: serializeIncidentCsv,
    order: parseOrder(req.query, { date: 'incidentDate', createdAt: 'createdAt' }),
  }, `incidents-${new Date().toISOString().slice(0, 10)}.csv`);
});

/**
 * Update incident
 */
const updateIncident = asyncHandler(async (req, res) => {
  const count = await incidentService.updateIncident(req.params.id, req.body, req.user.id);
  res.status(200).json(ApiResponse.success({ updated: count }, 'Incident updated successfully'));
});

/**
 * Update incident status
 */
const updateStatus = asyncHandler(async (req, res) => {
  const count = await incidentService.updateStatus(req.params.id, req.body.status, req.user.id);
  res.status(200).json(ApiResponse.success({ updated: count }, 'Incident status updated successfully'));
});

/**
 * Delete incident
 */
const deleteIncident = asyncHandler(async (req, res) => {
  await incidentService.deleteIncident(req.params.id);
  res.status(200).json(ApiResponse.success(null, 'Incident deleted successfully'));
});

module.exports = {
  createIncident,
  getAllIncidents,
  getIncidentSummary,
  getIncidentById,
  exportIncidents,
  updateIncident,
  updateStatus,
  deleteIncident,
};
