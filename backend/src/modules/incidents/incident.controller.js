'use strict';

const incidentService = require('./incident.service');
const { ApiResponse, asyncHandler } = require('../../shared/utils/index');
const { Department, Incident } = require('../../database/models');
const { Op } = require('sequelize');
const { parsePagination, parseOrder, paginationMeta, addTextSearch, sendCsvExport } = require('../../shared/utils/pagination');

const isDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));
const nextDate = (value) => {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
};

const buildIncidentWhere = async (query = {}) => {
  const where = {};
  if (query.plantId && query.plantId !== 'All') where.plantId = query.plantId;
  if (query.status && query.status !== 'All') where.status = query.status;
  if (query.severityLevel && query.severityLevel !== 'All') where.severityLevel = query.severityLevel;

  if (query.incidentType && query.incidentType !== 'All') {
    const requestedTypes = String(query.incidentType).split(',').map((value) => value.trim()).filter(Boolean);
    const expandedTypes = requestedTypes.flatMap((type) => ({
      fire: ['major_fire', 'minor_fire', 'fire'],
      injury: ['lti', 'rwc', 'mtc'],
    }[type.toLowerCase()] || [type]));
    where.incidentType = expandedTypes.length === 1 ? expandedTypes[0] : { [Op.in]: expandedTypes };
  }

  const year = /^\d{4}$/.test(String(query.year || '')) ? String(query.year) : null;
  const fromDate = isDate(query.fromDate) ? query.fromDate : (year ? `${year}-01-01` : null);
  const toDate = isDate(query.toDate) ? nextDate(query.toDate) : (year ? `${Number(year) + 1}-01-01` : null);
  if (fromDate || toDate) {
    where.incidentDate = {
      ...(fromDate ? { [Op.gte]: fromDate } : {}),
      ...(toDate ? { [Op.lt]: toDate } : {}),
    };
  }

  addTextSearch(where, query.search, ['incident_number', 'title', 'description'], Incident);
  if (query.department && query.department !== 'All') {
    const department = await Department.findOne({
      where: { [Op.or]: [{ id: query.department }, { code: query.department }, { name: query.department }] },
      attributes: ['id'],
    });
    where[Op.or] = department?.id
      ? [
        { departmentId: department.id },
        Incident.sequelize.literal(`JSON_UNQUOTE(JSON_EXTRACT(\`metadata\`, '$.department_id')) = ${Incident.sequelize.escape(query.department)}`),
        Incident.sequelize.literal(`JSON_UNQUOTE(JSON_EXTRACT(\`metadata\`, '$.department')) = ${Incident.sequelize.escape(query.department)}`),
      ]
      : [{ departmentId: '__no_matching_department__' }];
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
  const options = { ...pagination, where: await buildIncidentWhere(req.query) };
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
  const where = {};
  if (req.query.plantId) where.plantId = req.query.plantId;
  if (req.query.status && req.query.status !== 'All') where.status = req.query.status;
  if (req.query.severityLevel) where.severityLevel = req.query.severityLevel;
  addTextSearch(where, req.query.search, ['incident_number', 'title', 'description'], Incident);
  await sendCsvExport(res, Incident, { where, order: parseOrder(req.query, { date: 'incidentDate', createdAt: 'createdAt' }) }, `incidents-${new Date().toISOString().slice(0, 10)}.csv`);
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
