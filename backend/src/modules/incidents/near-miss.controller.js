'use strict';

const nearMissService = require('./near-miss.service');
const { ApiError, ApiResponse, asyncHandler } = require('../../shared/utils/index');
const { Department, NearMiss } = require('../../database/models');
const { Op } = require('sequelize');
const { parsePagination, parseOrder, paginationMeta, addTextSearch, sendCsvExport } = require('../../shared/utils/pagination');

const NEAR_MISS_STATUS_FILTERS = {
  open: ['draft', 'reported', 'submitted', 'under_review', 'open'],
  closed: ['closed', 'close'],
  close: ['closed', 'close'],
};

const normalizeNearMissStatusFilter = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  return NEAR_MISS_STATUS_FILTERS[normalized] || value;
};

const addAndCondition = (where, condition) => {
  where[Op.and] = [...(where[Op.and] || []), condition];
};

const nearMissStatusLabel = (value) => ['closed', 'close'].includes(String(value || '').toLowerCase()) ? 'Closed' : 'Open';
const csvDate = (value) => {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toISOString().slice(0, 10);
};

const serializeNearMissCsv = (row) => {
  const metadata = row.metadata || {};
  return {
    'Near Miss ID': row.id,
    'EMP ID': metadata.emp_id || '',
    Date: csvDate(row.reportedAt || row.createdAt),
    Department: row.department?.code || row.department?.name || metadata.department || '',
    'Reported By': metadata.reported_by || '',
    Designation: metadata.designation || '',
    'Affected Person Name': metadata.affected_person || '',
    'Affected Person Designation': metadata.affected_designation || '',
    Time: metadata.time || '',
    Location: row.location || metadata.location || '',
    Details: metadata.details || row.description || '',
    'Preventive Action Suggestion': metadata.preventive_action || row.immediateAction || '',
    'Responsible Department': row.responsibleDepartment?.code || row.responsibleDepartment?.name || metadata.responsible_department || '',
    'Further Investigation Required': row.furtherInvestigationRequired ? 'Yes' : 'No',
    'Reported in Hazard': row.reportedInHazard ? 'Yes' : 'No',
    Status: nearMissStatusLabel(row.status),
    Remarks: row.remarks || metadata.remarks || '',
  };
};

const buildNearMissWhere = async (query = {}) => {
  const where = {};
  if (query.plantId && query.plantId !== 'All') where.plantId = query.plantId;
  if (query.status && query.status !== 'All') where.status = normalizeNearMissStatusFilter(query.status);
  if (query.severityLevel) where.severityLevel = query.severityLevel;
  addTextSearch(where, query.search, ['title', 'description', 'location', 'metadata'], NearMiss);

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
    addAndCondition(where, NearMiss.sequelize.where(
      NearMiss.sequelize.fn('MONTH', NearMiss.sequelize.col('reported_at')),
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
        NearMiss.sequelize.literal(`JSON_UNQUOTE(JSON_EXTRACT(\`metadata\`, '$.department')) = ${NearMiss.sequelize.escape(query.department)}`),
      ],
    });
  }
  return where;
};

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
    where: await buildNearMissWhere(req.query),
    include: [
      { model: Department, as: 'department', attributes: ['id', 'name', 'code'] },
      { model: Department, as: 'responsibleDepartment', attributes: ['id', 'name', 'code'] },
    ],
    order: parseOrder(req.query, { date: 'reportedAt', reportedAt: 'reportedAt', createdAt: 'createdAt' }, ['reportedAt', 'DESC']),
  };
  
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
  const where = await buildNearMissWhere(req.query);
  await sendCsvExport(res, NearMiss, {
    where,
    include: [
      { model: Department, as: 'department', attributes: ['name', 'code'], required: false },
      { model: Department, as: 'responsibleDepartment', attributes: ['name', 'code'], required: false },
    ],
    nest: true,
    serializeRow: serializeNearMissCsv,
    order: parseOrder(req.query, { date: 'reportedAt', createdAt: 'createdAt' }, ['reportedAt', 'DESC']),
  }, `near-misses-${new Date().toISOString().slice(0, 10)}.csv`);
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
