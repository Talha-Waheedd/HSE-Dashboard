'use strict';

const incidentService = require('./incident.service');
const { ApiResponse, asyncHandler } = require('../../shared/utils/index');
const { Department, Incident } = require('../../database/models');
const { Op } = require('sequelize');

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
  const options = {
    limit: parseInt(req.query.limit, 10) || 10,
    offset: parseInt(req.query.offset, 10) || 0,
    where: {},
  };
  
  if (req.query.plantId) options.where.plantId = req.query.plantId;
  if (req.query.status) options.where.status = req.query.status;
  if (req.query.incidentType) options.where.incidentType = req.query.incidentType;
  if (req.query.severityLevel) options.where.severityLevel = req.query.severityLevel;
  if (req.query.department && req.query.department !== 'All') {
    const department = await Department.findOne({
      where: { [Op.or]: [{ code: req.query.department }, { name: req.query.department }] },
      attributes: ['id'],
    });
    options.where[Op.or] = department?.id
      ? [
        { departmentId: department.id },
        Incident.sequelize.literal(`JSON_UNQUOTE(JSON_EXTRACT(\`metadata\`, '$.department_id')) = ${Incident.sequelize.escape(req.query.department)}`),
        Incident.sequelize.literal(`JSON_UNQUOTE(JSON_EXTRACT(\`metadata\`, '$.department')) = ${Incident.sequelize.escape(req.query.department)}`),
      ]
      : [{ departmentId: '__no_matching_department__' }];
  }

  const incidents = await incidentService.getAllIncidents(options);
  res.status(200).json(ApiResponse.success(incidents, 'Incidents retrieved successfully'));
});

/**
 * Get incident by ID
 */
const getIncidentById = asyncHandler(async (req, res) => {
  const incident = await incidentService.getIncidentById(req.params.id);
  res.status(200).json(ApiResponse.success(incident, 'Incident retrieved successfully'));
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
  getIncidentById,
  updateIncident,
  updateStatus,
  deleteIncident,
};
