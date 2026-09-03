'use strict';

const correctiveActionService = require('./corrective-action.service');
const { ApiResponse, asyncHandler } = require('../../shared/utils/index');
const { Op } = require('sequelize');
const { parsePagination, parseOrder, paginationMeta, addTextSearch, sendCsvExport } = require('../../shared/utils/pagination');
const { CorrectiveAction, Department } = require('../../database/models');

const buildActionWhere = async (query = {}) => {
  const where = {};
  if (query.plantId && query.plantId !== 'All') where.plantId = query.plantId;
  const requestedStatus = String(query.status || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (requestedStatus && !['all', 'all_statuses'].includes(requestedStatus)) {
    if (requestedStatus === 'open') where.status = 'open';
    else if (['in_progress', 'pending', 'wip', 'overdue'].includes(requestedStatus)) where.status = { [Op.in]: ['in_progress', 'overdue'] };
    else if (['close', 'closed', 'completed', 'verified', 'cancelled'].includes(requestedStatus)) where.status = { [Op.in]: ['completed', 'verified', 'cancelled'] };
    else where.status = requestedStatus;
  }
  if (query.assignedTo && query.assignedTo !== 'All') where.assignedTo = query.assignedTo;
  const sourceType = query.sourceType || query.source;
  if (sourceType && sourceType !== 'All') where.sourceType = sourceType;
  const incidentCategory = query.incidentCategory || query.category;
  if (incidentCategory && incidentCategory !== 'All') where.incidentCategory = incidentCategory;
  const riskPriority = query.priority || query.riskPriority || query.risk;
  if (riskPriority && riskPriority !== 'All') where.priority = String(riskPriority).toLowerCase();
  const actionFrom = query.fromDate || (query.year && /^\d{4}$/.test(String(query.year)) ? `${query.year}-01-01` : null);
  const actionTo = query.toDate || (query.year && /^\d{4}$/.test(String(query.year)) ? `${query.year}-12-31` : null);
  if (actionFrom || actionTo) where.createdAt = { ...(actionFrom ? { [Op.gte]: `${actionFrom} 00:00:00` } : {}), ...(actionTo ? { [Op.lte]: `${actionTo} 23:59:59` } : {}) };
  addTextSearch(where, query.search, ['capa_number', 'source_reference', 'incident_category', 'title', 'description', 'responsibility'], CorrectiveAction);
  const requestedDepartment = query.responsibleDepartment || query.department;
  if (requestedDepartment && requestedDepartment !== 'All') {
    const department = await Department.findOne({
      where: { [Op.or]: [{ id: requestedDepartment }, { code: requestedDepartment }, { name: requestedDepartment }] },
      attributes: ['id'],
    });
    where.responsibleDepartmentId = department?.id || '__no_matching_department__';
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
  options.order = parseOrder(req.query, { capaNumber: 'capaNumber', dueDate: 'dueDate', createdAt: 'createdAt', status: 'status', priority: 'priority' });

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
const csvDate = (value) => {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toISOString().slice(0, 10);
};
const exportActions = asyncHandler(async (req, res) => {
  const where = await buildActionWhere(req.query);
  await sendCsvExport(res, CorrectiveAction, {
    where,
    include: [{ model: Department, as: 'responsibleDepartment', attributes: ['name', 'code'], required: false }],
    nest: true,
    serializeRow: (row) => ({
      Date: csvDate(row.createdAt),
      'CAPA ID': row.capaNumber || '',
      Source: row.sourceType || '',
      'Source Reference': row.sourceReference || '',
      'Incident Category': row.incidentCategory || '',
      'Action Item': row.description || row.title || '',
      'Responsible Department': row.responsibleDepartment?.code || row.responsibleDepartment?.name || '',
      Responsibility: row.responsibility || '',
      'Risk / Priority': row.priority || '',
      'Target Date': csvDate(row.dueDate),
      Status: String(row.status || '').replaceAll('_', ' '),
    }),
    order: parseOrder(req.query, { capaNumber: 'capaNumber', dueDate: 'dueDate', createdAt: 'createdAt' }),
  }, `corrective-actions-${new Date().toISOString().slice(0, 10)}.csv`);
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
