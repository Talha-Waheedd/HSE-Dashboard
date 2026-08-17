'use strict';

const correctiveActionService = require('./corrective-action.service');
const { ApiResponse, asyncHandler } = require('../../shared/utils/index');
const { Op } = require('sequelize');
const { parsePagination, parseOrder, paginationMeta, addTextSearch, sendCsvExport } = require('../../shared/utils/pagination');
const { CorrectiveAction } = require('../../database/models');

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
  const pagination = parsePagination(req.query);
  const options = {
    ...pagination,
    where: {},
  };
  
  if (req.query.plantId) options.where.plantId = req.query.plantId;
  if (req.query.status) options.where.status = req.query.status;
  if (req.query.assignedTo) options.where.assignedTo = req.query.assignedTo;
  const actionFrom = req.query.fromDate || (req.query.year && /^\d{4}$/.test(req.query.year) ? `${req.query.year}-01-01` : null);
  const actionTo = req.query.toDate || (req.query.year && /^\d{4}$/.test(req.query.year) ? `${req.query.year}-12-31 23:59:59` : null);
  if (actionFrom || actionTo) options.where.dueDate = { ...(actionFrom ? { [Op.gte]: actionFrom } : {}), ...(actionTo ? { [Op.lte]: actionTo } : {}) };
  addTextSearch(options.where, req.query.search, ['title', 'description', 'action'], CorrectiveAction);
  options.order = parseOrder(req.query, { dueDate: 'dueDate', createdAt: 'createdAt' });

  const result = await correctiveActionService.getAllActions(options);
  res.status(200).json(ApiResponse.success(result.rows, 'Corrective actions retrieved successfully', paginationMeta({ ...pagination, total: result.count })));
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
const exportActions = asyncHandler(async (req, res) => {
  const where = {};
  if (req.query.plantId) where.plantId = req.query.plantId;
  if (req.query.status && req.query.status !== 'All') where.status = req.query.status;
  if (req.query.assignedTo) where.assignedTo = req.query.assignedTo;
  addTextSearch(where, req.query.search, ['title', 'description', 'action'], CorrectiveAction);
  await sendCsvExport(res, CorrectiveAction, { where, order: parseOrder(req.query, { dueDate: 'dueDate', createdAt: 'createdAt' }) }, `corrective-actions-${new Date().toISOString().slice(0, 10)}.csv`);
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
  exportActions,
  updateAction,
  updateStatus,
  deleteAction,
};
