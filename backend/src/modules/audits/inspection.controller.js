'use strict';

const inspectionService = require('./inspection.service');
const { ApiResponse, asyncHandler } = require('../../shared/utils/index');
const { Op } = require('sequelize');
const { parsePagination, parseOrder, paginationMeta, addTextSearch, sendCsvExport } = require('../../shared/utils/pagination');
const { Inspection } = require('../../database/models');

/**
 * Create a new inspection
 */
const createInspection = asyncHandler(async (req, res) => {
  const inspection = await inspectionService.createInspection(req.body, req.user.id);
  res.status(201).json(ApiResponse.success(inspection, 'Inspection created successfully', 201));
});

/**
 * Get all inspections
 */
const getAllInspections = asyncHandler(async (req, res) => {
  const pagination = parsePagination(req.query);
  const options = {
    ...pagination,
    where: {},
  };
  
  if (req.query.plantId) options.where.plantId = req.query.plantId;
  if (req.query.status) options.where.status = req.query.status;
  if (req.query.inspectionType) options.where.inspectionType = req.query.inspectionType;
  const inspectionFrom = req.query.fromDate || (req.query.year && /^\d{4}$/.test(req.query.year) ? `${req.query.year}-01-01` : null);
  const inspectionTo = req.query.toDate || (req.query.year && /^\d{4}$/.test(req.query.year) ? `${req.query.year}-12-31 23:59:59` : null);
  if (inspectionFrom || inspectionTo) options.where.scheduledDate = { ...(inspectionFrom ? { [Op.gte]: inspectionFrom } : {}), ...(inspectionTo ? { [Op.lte]: inspectionTo } : {}) };
  addTextSearch(options.where, req.query.search, ['inspection_number', 'title', 'description'], Inspection);
  options.order = parseOrder(req.query, { date: 'scheduledDate', scheduledDate: 'scheduledDate', createdAt: 'createdAt' });

  const result = await inspectionService.getAllInspections(options);
  res.status(200).json(ApiResponse.success(result.rows, 'Inspections retrieved successfully', paginationMeta({ ...pagination, total: result.count })));
});

/**
 * Get inspection by ID
 */
const getInspectionById = asyncHandler(async (req, res) => {
  const inspection = await inspectionService.getInspectionById(req.params.id);
  res.status(200).json(ApiResponse.success(inspection, 'Inspection retrieved successfully'));
});
const exportInspections = asyncHandler(async (req, res) => {
  const where = {};
  if (req.query.plantId) where.plantId = req.query.plantId;
  if (req.query.status && req.query.status !== 'All') where.status = req.query.status;
  if (req.query.inspectionType) where.inspectionType = req.query.inspectionType;
  addTextSearch(where, req.query.search, ['inspection_number', 'title', 'description'], Inspection);
  await sendCsvExport(res, Inspection, { where, order: parseOrder(req.query, { date: 'scheduledDate', createdAt: 'createdAt' }) }, `inspections-${new Date().toISOString().slice(0, 10)}.csv`);
});

/**
 * Update inspection
 */
const updateInspection = asyncHandler(async (req, res) => {
  const count = await inspectionService.updateInspection(req.params.id, req.body, req.user.id);
  res.status(200).json(ApiResponse.success({ updated: count }, 'Inspection updated successfully'));
});

/**
 * Update inspection status
 */
const updateStatus = asyncHandler(async (req, res) => {
  const count = await inspectionService.updateStatus(req.params.id, req.body.status, req.user.id);
  res.status(200).json(ApiResponse.success({ updated: count }, 'Inspection status updated successfully'));
});

/**
 * Delete inspection
 */
const deleteInspection = asyncHandler(async (req, res) => {
  await inspectionService.deleteInspection(req.params.id);
  res.status(200).json(ApiResponse.success(null, 'Inspection deleted successfully'));
});

module.exports = {
  createInspection,
  getAllInspections,
  getInspectionById,
  exportInspections,
  updateInspection,
  updateStatus,
  deleteInspection,
};
