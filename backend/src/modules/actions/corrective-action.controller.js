'use strict';

const correctiveActionService = require('./corrective-action.service');
const { ApiResponse, asyncHandler } = require('../../shared/utils/index');
const { Op } = require('sequelize');
const { parsePagination, parseOrder, paginationMeta, addTextSearch, sendCsvExport } = require('../../shared/utils/pagination');
const { CorrectiveAction, Department } = require('../../database/models');

const buildActionDepartmentPredicate = (departmentId, departmentValue) => {
  const escapedId = CorrectiveAction.sequelize.escape(departmentId);
  const escapedValue = CorrectiveAction.sequelize.escape(departmentValue);
  const matches = (alias, includeMetadata = false) => [
    `${alias}.department_id = ${escapedId}`,
    `${alias}.department_id = ${escapedValue}`,
    ...(includeMetadata ? [
      `JSON_UNQUOTE(JSON_EXTRACT(${alias}.metadata, '$.department_id')) = ${escapedValue}`,
      `JSON_UNQUOTE(JSON_EXTRACT(${alias}.metadata, '$.originated_department')) = ${escapedValue}`,
    ] : []),
  ].join(' OR ');
  return CorrectiveAction.sequelize.literal(`(
    (source_type = 'hazard' AND EXISTS (SELECT 1 FROM hazards h WHERE h.id = source_id AND (${matches('h', true)}))) OR
    (source_type = 'near_miss' AND EXISTS (SELECT 1 FROM near_misses n WHERE n.id = source_id AND (${matches('n', true)}))) OR
    (source_type = 'incident' AND EXISTS (SELECT 1 FROM incidents i WHERE i.id = source_id AND (${matches('i', true)}))) OR
    (source_type = 'audit' AND EXISTS (SELECT 1 FROM audits a WHERE a.id = source_id AND (${matches('a')}))) OR
    (source_type = 'inspection' AND EXISTS (SELECT 1 FROM inspections ins WHERE ins.id = source_id AND (${matches('ins')})))
  )`);
};

const buildActionWhere = async (query = {}) => {
  const where = {};
  if (query.plantId && query.plantId !== 'All') where.plantId = query.plantId;
  if (query.status && query.status !== 'All') where.status = query.status;
  if (query.assignedTo && query.assignedTo !== 'All') where.assignedTo = query.assignedTo;
  const actionFrom = query.fromDate || (query.year && /^\d{4}$/.test(String(query.year)) ? `${query.year}-01-01` : null);
  const actionTo = query.toDate || (query.year && /^\d{4}$/.test(String(query.year)) ? `${query.year}-12-31` : null);
  if (actionFrom || actionTo) where.dueDate = { ...(actionFrom ? { [Op.gte]: actionFrom } : {}), ...(actionTo ? { [Op.lte]: actionTo } : {}) };
  addTextSearch(where, query.search, ['title', 'description'], CorrectiveAction);
  if (query.department && query.department !== 'All') {
    const department = await Department.findOne({
      where: { [Op.or]: [{ id: query.department }, { code: query.department }, { name: query.department }] },
      attributes: ['id'],
    });
    const predicate = department?.id
      ? buildActionDepartmentPredicate(department.id, query.department)
      : CorrectiveAction.sequelize.literal('1 = 0');
    where[Op.and] = [...(where[Op.and] || []), predicate];
  }
  return where;
};

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
  const options = { ...pagination, where: await buildActionWhere(req.query) };
  options.order = parseOrder(req.query, { dueDate: 'dueDate', createdAt: 'createdAt' });

  const result = await correctiveActionService.getAllActions(options);
  res.status(200).json(ApiResponse.success(result.rows, 'Corrective actions retrieved successfully', paginationMeta({ ...pagination, total: result.count })));
});

const getActionSummary = asyncHandler(async (req, res) => {
  const summary = await correctiveActionService.getSummary(await buildActionWhere(req.query));
  res.status(200).json(ApiResponse.success(summary, 'Corrective action summary retrieved successfully'));
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
  addTextSearch(where, req.query.search, ['title', 'description'], CorrectiveAction);
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
  getActionSummary,
  getActionsBySource,
  getActionById,
  exportActions,
  updateAction,
  updateStatus,
  deleteAction,
};
