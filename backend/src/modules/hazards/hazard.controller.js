'use strict';

const hazardService = require('./hazard.service');
const { ApiResponse, asyncHandler } = require('../../shared/utils/index');
const { Department, Hazard } = require('../../database/models');
const { Op } = require('sequelize');

// Coalesce duplicate requests while a browser retry or double-click is still
// in flight. The frontend also disables Save Record, but the API must remain
// safe when two identical requests arrive concurrently.
const inFlightCreates = new Map();

/**
 * Report a new hazard
 */
const createHazard = asyncHandler(async (req, res) => {
  const requestKey = String(req.get('Idempotency-Key') || '').trim();
  const cacheKey = requestKey ? `${req.user.id}:${requestKey}` : null;

  // Re-use an in-flight promise for the same key (double-click / network retry).
  // Important: a REJECTED promise must NOT be cached — evict it immediately so
  // the caller can safely retry with the same idempotency key.
  let operation = cacheKey ? inFlightCreates.get(cacheKey) : null;
  if (!operation) {
    operation = hazardService.createHazard(req.body, req.user.id);
    if (cacheKey) {
      inFlightCreates.set(cacheKey, operation);
      // Evict rejected promises right away so retries don't re-await failures.
      operation.catch(() => {
        if (inFlightCreates.get(cacheKey) === operation) inFlightCreates.delete(cacheKey);
      });
    }
  }

  try {
    const hazard = await operation;
    res.status(201).json(ApiResponse.success(hazard, 'Hazard reported successfully', 201));
  } finally {
    // Always clean up after the awaiting caller is done with this operation.
    if (cacheKey && inFlightCreates.get(cacheKey) === operation) inFlightCreates.delete(cacheKey);
  }
});


/**
 * Get all hazards
 */
const getAllHazards = asyncHandler(async (req, res) => {
  const parsedPage = Number.parseInt(String(req.query.page ?? '1'), 10);
  const parsedLimit = Number.parseInt(String(req.query.limit ?? '10'), 10);
  const page = Number.isInteger(parsedPage) && parsedPage > 0 ? Math.min(parsedPage, 1000000) : 1;
  const limit = Number.isInteger(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 10000) : 10;
  const parsedOffset = Number.parseInt(String(req.query.offset ?? '0'), 10);
  const offset = req.query.page !== undefined
    ? (page - 1) * limit
    : (Number.isInteger(parsedOffset) && parsedOffset >= 0 ? parsedOffset : 0);
  const options = {
    limit,
    offset,
    where: {},
    order: [['createdAt', 'DESC'], ['id', 'DESC']],
  };
  
  if (req.query.plantId) options.where.plantId = req.query.plantId;
  if (req.query.status && req.query.status !== 'All') {
    const statusMap = {
      Open: ['reported', 'submitted'],
      Pending: ['draft', 'under_review'],
      'Work in Progress': ['under_review'],
      Closed: ['closed', 'resolved'],
      Cancelled: ['closed'],
      submitted: ['submitted', 'reported'],
      under_review: ['under_review', 'draft'],
      closed: ['closed', 'resolved'],
    };
    options.where.status = statusMap[req.query.status] || req.query.status;
  }
  if (req.query.severityLevel) options.where.severityLevel = req.query.severityLevel;

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
    options.where[Op.and] = [{ [Op.or]: [
      ...(department?.id ? [{ departmentId: department.id }] : []),
      Hazard.sequelize.literal(`JSON_UNQUOTE(JSON_EXTRACT(\`metadata\`, '$.originated_department')) = ${Hazard.sequelize.escape(req.query.department)}`),
    ] }];
    delete options.where.departmentId;
  }

  const result = await hazardService.getAllHazards(options);
  const currentPage = Math.floor(options.offset / options.limit) + 1;
  const totalPages = Math.ceil(result.count / options.limit);
  const meta = {
    page: currentPage,
    currentPage,
    limit: options.limit,
    pageSize: options.limit,
    total: result.count,
    totalRecords: result.count,
    totalPages,
  };
  const response = ApiResponse.success(result.rows, 'Hazards retrieved successfully', meta);
  // Keep the existing array in `data` for CRUD/list consumers while exposing
  // an explicit record-list contract for server-paginated clients.
  response.records = result.rows;
  res.status(200).json(response);
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
