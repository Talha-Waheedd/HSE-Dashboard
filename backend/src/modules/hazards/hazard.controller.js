'use strict';

const hazardService = require('./hazard.service');
const { ApiError, ApiResponse, asyncHandler } = require('../../shared/utils/index');
const { Department, Hazard } = require('../../database/models');
const { Op } = require('sequelize');
const { parseOrder, addTextSearch, sendCsvExport } = require('../../shared/utils/pagination');

// Coalesce duplicate requests while a browser retry or double-click is still
// in flight. The frontend also disables Save Record, but the API must remain
// safe when two identical requests arrive concurrently.
const inFlightCreates = new Map();

const addAndCondition = (where, condition) => {
  where[Op.and] = [...(where[Op.and] || []), condition];
};

const buildHazardWhere = async (query = {}) => {
  const where = {};
  if (query.plantId && query.plantId !== 'All') where.plantId = query.plantId;
  if (query.status && query.status !== 'All') {
    const statusMap = {
      Open: ['reported', 'submitted'],
      Pending: ['draft', 'under_review'],
      'Work in Progress': ['under_review'],
      Close: ['closed', 'resolved'],
      Closed: ['closed', 'resolved'],
      Cancelled: ['closed'],
      open: ['reported', 'submitted'],
      pending: ['draft', 'under_review'],
      close: ['closed', 'resolved'],
      submitted: ['submitted', 'reported'],
      under_review: ['under_review', 'draft'],
      closed: ['closed', 'resolved'],
    };
    where.status = statusMap[query.status] || query.status;
  }
  const requestedRiskRating = query.riskRating || query.severityLevel;
  if (requestedRiskRating && requestedRiskRating !== 'All') {
    const normalizedRiskRating = String(requestedRiskRating).trim().toLowerCase();
    if (query.riskRating && !['low', 'medium', 'high'].includes(normalizedRiskRating)) {
      throw ApiError.badRequest('riskRating must be Low, Medium, or High');
    }
    where.severityLevel = normalizedRiskRating;
  }
  addTextSearch(where, query.search, ['title', 'description'], Hazard);

  const year = query.year && query.year !== 'All' ? Number(query.year) : null;
  if (year !== null && (!Number.isInteger(year) || year < 1900 || year > 2200)) {
    throw ApiError.badRequest('year must be a valid four-digit year');
  }
  const month = query.month && query.month !== 'All' ? Number(query.month) : null;
  if (month !== null && (!Number.isInteger(month) || month < 1 || month > 12)) {
    throw ApiError.badRequest('month must be an integer between 1 and 12');
  }

  if (year !== null) {
    const startMonth = month || 1;
    const endMonth = month ? month + 1 : 13;
    const periodStart = `${year}-${String(startMonth).padStart(2, '0')}-01`;
    const periodEnd = endMonth === 13
      ? `${year + 1}-01-01`
      : `${year}-${String(endMonth).padStart(2, '0')}-01`;
    addAndCondition(where, { reportedAt: { [Op.gte]: periodStart, [Op.lt]: periodEnd } });
  } else if (month !== null) {
    addAndCondition(where, Hazard.sequelize.where(
      Hazard.sequelize.fn('MONTH', Hazard.sequelize.col('reported_at')),
      month,
    ));
  }

  if (query.fromDate) addAndCondition(where, { reportedAt: { [Op.gte]: query.fromDate } });
  if (query.toDate) {
    const toDate = String(query.toDate).length === 10 ? `${query.toDate} 23:59:59` : query.toDate;
    addAndCondition(where, { reportedAt: { [Op.lte]: toDate } });
  }

  if (query.department && query.department !== 'All') {
    const department = await Department.findOne({
      where: { [Op.or]: [{ code: query.department }, { name: query.department }] },
      attributes: ['id'],
    });
    addAndCondition(where, {
      [Op.or]: [
        ...(department?.id ? [{ departmentId: department.id }] : []),
        Hazard.sequelize.literal(`JSON_UNQUOTE(JSON_EXTRACT(\`metadata\`, '$.originated_department')) = ${Hazard.sequelize.escape(query.department)}`),
      ],
    });
    delete where.departmentId;
  }
  return where;
};

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
  const { parsePagination, paginationMeta } = require('../../shared/utils/pagination');
  const { page, limit } = parsePagination(req.query);
  const offset = (page - 1) * limit;
  const options = {
    limit,
    offset,
    where: await buildHazardWhere(req.query),
    include: [{ model: Department, as: 'department', attributes: ['id', 'name', 'code'] }],
    order: parseOrder(req.query, { date: 'reportedAt', reportedAt: 'reportedAt', createdAt: 'createdAt' }),
  };

  const result = await hazardService.getAllHazards(options);
  const currentPage = Math.floor(options.offset / options.limit) + 1;
  const totalPages = Math.ceil(result.count / options.limit);
  const meta = { ...paginationMeta({ page: currentPage, limit: options.limit, total: result.count }), page: currentPage, limit: options.limit, total: result.count };
  const response = ApiResponse.success(result.rows, 'Hazards retrieved successfully', meta);
  // Keep the existing array in `data` for CRUD/list consumers while exposing
  // an explicit record-list contract for server-paginated clients.
  response.records = result.rows;
  res.status(200).json(response);
});

const getHazardSummary = asyncHandler(async (req, res) => {
  const where = await buildHazardWhere(req.query);
  const [summary] = await Hazard.findAll({
    where,
    raw: true,
    attributes: [
      [Hazard.sequelize.fn('COUNT', Hazard.sequelize.col('id')), 'totalRecords'],
      [Hazard.sequelize.literal('SUM(CASE WHEN `assigned_to` IS NOT NULL THEN 1 ELSE 0 END)'), 'assigned'],
      [Hazard.sequelize.literal("SUM(CASE WHEN `status` IN ('submitted','under_review') THEN 1 ELSE 0 END)"), 'submittedForReview'],
      [Hazard.sequelize.literal("SUM(CASE WHEN `status` IN ('closed','resolved') AND `closed_at` IS NOT NULL AND `closed_at` >= DATE_FORMAT(CURRENT_DATE, '%Y-%m-01') AND `closed_at` < DATE_ADD(DATE_FORMAT(CURRENT_DATE, '%Y-%m-01'), INTERVAL 1 MONTH) THEN 1 ELSE 0 END)"), 'closedThisMonth'],
    ],
  });
  const data = Object.fromEntries(['totalRecords', 'assigned', 'submittedForReview', 'closedThisMonth'].map((key) => [key, Number(summary?.[key] || 0)]));
  res.status(200).json(ApiResponse.success(data, 'Hazard summary retrieved successfully', { totalRecords: data.totalRecords }));
});

/**
 * Get hazard by ID
 */
const getHazardById = asyncHandler(async (req, res) => {
  const hazard = await hazardService.getHazardById(req.params.id);
  res.status(200).json(ApiResponse.success(hazard, 'Hazard retrieved successfully'));
});

const exportHazards = asyncHandler(async (req, res) => {
  const where = await buildHazardWhere(req.query);
  await sendCsvExport(res, Hazard, { where, order: parseOrder(req.query, { date: 'reportedAt', createdAt: 'createdAt' }) }, `hazards-${new Date().toISOString().slice(0, 10)}.csv`);
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
  getHazardSummary,
  getHazardById,
  exportHazards,
  updateHazard,
  updateStatus,
  deleteHazard,
};
