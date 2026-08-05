'use strict';

const correctiveActionService = require('./corrective-action.service');
const { ApiResponse, asyncHandler } = require('../../shared/utils/index');

/**
 * Create a new corrective action
 */
const createAction = asyncHandler(async (req, res) => {
  const action = await correctiveActionService.createAction(req.body, req.user.id);
  res.status(201).json(ApiResponse.success(action, 'Corrective action created successfully', 201));
});

/**
 * Get all corrective actions
 */
const getAllActions = asyncHandler(async (req, res) => {
  const options = {
    limit: parseInt(req.query.limit, 10) || 10,
    offset: parseInt(req.query.offset, 10) || 0,
    where: {},
  };
  
  if (req.query.plantId) options.where.plantId = req.query.plantId;
  if (req.query.status) options.where.status = req.query.status;
  if (req.query.assignedTo) options.where.assignedTo = req.query.assignedTo;

  const actions = await correctiveActionService.getAllActions(options);
  res.status(200).json(ApiResponse.success(actions, 'Corrective actions retrieved successfully'));
});

/**
 * Get actions by source
 */
const getActionsBySource = asyncHandler(async (req, res) => {
  const { sourceType, sourceId } = req.params;
  const actions = await correctiveActionService.getActionsBySource(sourceType, sourceId);
  res.status(200).json(ApiResponse.success(actions, 'Corrective actions retrieved successfully'));
});

/**
 * Get action by ID
 */
const getActionById = asyncHandler(async (req, res) => {
  const action = await correctiveActionService.getActionById(req.params.id);
  res.status(200).json(ApiResponse.success(action, 'Corrective action retrieved successfully'));
});

/**
 * Update action
 */
const updateAction = asyncHandler(async (req, res) => {
  const count = await correctiveActionService.updateAction(req.params.id, req.body, req.user.id);
  res.status(200).json(ApiResponse.success({ updated: count }, 'Corrective action updated successfully'));
});

/**
 * Update action status
 */
const updateStatus = asyncHandler(async (req, res) => {
  const { status, verificationNotes } = req.body;
  const count = await correctiveActionService.updateStatus(req.params.id, status, req.user.id, verificationNotes);
  res.status(200).json(ApiResponse.success({ updated: count }, 'Corrective action status updated successfully'));
});

/**
 * Delete action
 */
const deleteAction = asyncHandler(async (req, res) => {
  await correctiveActionService.deleteAction(req.params.id);
  res.status(200).json(ApiResponse.success(null, 'Corrective action deleted successfully'));
});

module.exports = {
  createAction,
  getAllActions,
  getActionsBySource,
  getActionById,
  updateAction,
  updateStatus,
  deleteAction,
};
