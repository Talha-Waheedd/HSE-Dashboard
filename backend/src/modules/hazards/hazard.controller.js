'use strict';

const hazardService = require('./hazard.service');
const { ApiResponse, asyncHandler } = require('../../shared/utils/index');

/**
 * Report a new hazard
 */
const createHazard = asyncHandler(async (req, res) => {
  const hazard = await hazardService.createHazard(req.body, req.user.id);
  res.status(201).json(ApiResponse.success(hazard, 'Hazard reported successfully', 201));
});

/**
 * Get all hazards
 */
const getAllHazards = asyncHandler(async (req, res) => {
  const options = {
    limit: parseInt(req.query.limit, 10) || 10,
    offset: parseInt(req.query.offset, 10) || 0,
    where: {},
  };
  
  if (req.query.plantId) options.where.plantId = req.query.plantId;
  if (req.query.status) options.where.status = req.query.status;
  if (req.query.severityLevel) options.where.severityLevel = req.query.severityLevel;

  const hazards = await hazardService.getAllHazards(options);
  res.status(200).json(ApiResponse.success(hazards, 'Hazards retrieved successfully'));
});

/**
 * Get hazard by ID
 */
const getHazardById = asyncHandler(async (req, res) => {
  const hazard = await hazardService.getHazardById(req.params.id);
  res.status(200).json(ApiResponse.success(hazard, 'Hazard retrieved successfully'));
});

/**
 * Update hazard
 */
const updateHazard = asyncHandler(async (req, res) => {
  const count = await hazardService.updateHazard(req.params.id, req.body, req.user.id);
  res.status(200).json(ApiResponse.success({ updated: count }, 'Hazard updated successfully'));
});

/**
 * Update hazard status
 */
const updateStatus = asyncHandler(async (req, res) => {
  const { status, actionTaken } = req.body;
  const count = await hazardService.updateStatus(req.params.id, status, req.user.id, actionTaken);
  res.status(200).json(ApiResponse.success({ updated: count }, 'Hazard status updated successfully'));
});

/**
 * Delete hazard
 */
const deleteHazard = asyncHandler(async (req, res) => {
  await hazardService.deleteHazard(req.params.id);
  res.status(200).json(ApiResponse.success(null, 'Hazard deleted successfully'));
});

module.exports = {
  createHazard,
  getAllHazards,
  getHazardById,
  updateHazard,
  updateStatus,
  deleteHazard,
};
