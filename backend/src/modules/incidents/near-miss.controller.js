'use strict';

const nearMissService = require('./near-miss.service');
const { ApiResponse, asyncHandler } = require('../../shared/utils/index');
const { Department, NearMiss } = require('../../database/models');
const { Op } = require('sequelize');
const { parsePagination, parseOrder, paginationMeta, addTextSearch, sendCsvExport } = require('../../shared/utils/pagination');

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
  const pagination = parsePagination(req.query);
  const options = {
    ...pagination,
    where: {},
    order: parseOrder(req.query, { date: 'reportedAt', reportedAt: 'reportedAt', createdAt: 'createdAt' }, ['reportedAt', 'DESC']),
  };
  
  if (req.query.plantId) options.where.plantId = req.query.plantId;
  if (req.query.status && req.query.status !== 'All') {
    options.where.status = ({
      Open: ['reported', 'submitted'],
      Pending: ['draft', 'under_review'],
      'Work in Progress': ['under_review'],
      Closed: ['closed'],
    }[req.query.status] || req.query.status);
  }
  if (req.query.severityLevel) options.where.severityLevel = req.query.severityLevel;
  addTextSearch(options.where, req.query.search, ['title', 'description', 'near_miss_number'], NearMiss);

  const year = req.query.year && req.query.year !== 'All' ? String(req.query.year) : null;
  const fromDate = req.query.fromDate || (year ? `${year}-01-01` : null);
  const toDate = req.query.toDate
    ? (String(req.query.toDate).length === 10 ? `${req.query.toDate} 23:59:59` : req.query.toDate)
    : (year ? `${year}-12-31 23:59:59` : null);
  if (fromDate || toDate) {
    options.where.reportedAt = {};
    if (fromDate) options.where.reportedAt[Op.gte] = fromDate;
    if (toDate) options.where.reportedAt[Op.lte] = toDate;
  }

  if (req.query.department && req.query.department !== 'All') {
    const department = await Department.findOne({
      where: { [Op.or]: [{ code: req.query.department }, { name: req.query.department }] },
      attributes: ['id'],
    });
    options.where[Op.and] = [
      { [Op.or]: [
        ...(department?.id ? [{ departmentId: department.id }] : []),
        NearMiss.sequelize.literal(`JSON_UNQUOTE(JSON_EXTRACT(\`metadata\`, '$.department')) = ${NearMiss.sequelize.escape(req.query.department)}`),
      ] },
    ];
    delete options.where.departmentId;
  }

  const result = await NearMiss.findAndCountAll(options);
  res.status(200).json(ApiResponse.success(result.rows, 'Near misses retrieved successfully', paginationMeta({ ...pagination, total: result.count })));
});

/**
 * Get near miss by ID
 */
const getNearMissById = asyncHandler(async (req, res) => {
  const nearMiss = await nearMissService.getNearMissById(req.params.id);
  res.status(200).json(ApiResponse.success(nearMiss, 'Near miss retrieved successfully'));
});
const exportNearMisses = asyncHandler(async (req, res) => {
  const where = {};
  if (req.query.plantId) where.plantId = req.query.plantId;
  if (req.query.status && req.query.status !== 'All') where.status = req.query.status;
  if (req.query.severityLevel) where.severityLevel = req.query.severityLevel;
  addTextSearch(where, req.query.search, ['title', 'description', 'near_miss_number'], NearMiss);
  await sendCsvExport(res, NearMiss, { where, order: parseOrder(req.query, { date: 'reportedAt', createdAt: 'createdAt' }, ['reportedAt', 'DESC']) }, `near-misses-${new Date().toISOString().slice(0, 10)}.csv`);
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
  exportNearMisses,
  updateNearMiss,
  updateStatus,
  deleteNearMiss,
};
