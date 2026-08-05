'use strict';

const nearMissService = require('./near-miss.service');
const { ApiResponse, asyncHandler } = require('../../shared/utils/index');

/**
 * Report a new near miss
 */
const createNearMiss = asyncHandler(async (req, res) => {
  const nearMiss = await nearMissService.createNearMiss(req.body, req.user.id);
  res.status(201).json(ApiResponse.success(nearMiss, 'Near miss reported successfully', 201));
});

/**
 * Get all near misses
 */
const getAllNearMisses = asyncHandler(async (req, res) => {
  const options = {
    limit: parseInt(req.query.limit, 10) || 10,
    offset: parseInt(req.query.offset, 10) || 0,
    where: {},
  };
  
  if (req.query.plantId) options.where.plantId = req.query.plantId;
  if (req.query.status) options.where.status = req.query.status;
  if (req.query.severityLevel) options.where.severityLevel = req.query.severityLevel;

  const nearMisses = await nearMissService.getAllNearMisses(options);
  res.status(200).json(ApiResponse.success(nearMisses, 'Near misses retrieved successfully'));
});

/**
 * Get near miss by ID
 */
const getNearMissById = asyncHandler(async (req, res) => {
  const nearMiss = await nearMissService.getNearMissById(req.params.id);
  res.status(200).json(ApiResponse.success(nearMiss, 'Near miss retrieved successfully'));
});

/**
 * Update near miss
 */
const updateNearMiss = asyncHandler(async (req, res) => {
  const count = await nearMissService.updateNearMiss(req.params.id, req.body, req.user.id);
  res.status(200).json(ApiResponse.success({ updated: count }, 'Near miss updated successfully'));
});

/**
 * Update near miss status
 */
const updateStatus = asyncHandler(async (req, res) => {
  const count = await nearMissService.updateStatus(req.params.id, req.body.status, req.user.id);
  res.status(200).json(ApiResponse.success({ updated: count }, 'Near miss status updated successfully'));
});

/**
 * Delete near miss
 */
const deleteNearMiss = asyncHandler(async (req, res) => {
  await nearMissService.deleteNearMiss(req.params.id);
  res.status(200).json(ApiResponse.success(null, 'Near miss deleted successfully'));
});

module.exports = {
  createNearMiss,
  getAllNearMisses,
  getNearMissById,
  updateNearMiss,
  updateStatus,
  deleteNearMiss,
};
