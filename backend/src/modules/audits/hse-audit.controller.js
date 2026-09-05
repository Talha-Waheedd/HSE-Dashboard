'use strict';

const hseAuditService = require('./hse-audit.service');
const { ApiResponse, asyncHandler } = require('../../shared/utils/index');
const { Op } = require('sequelize');
const { parsePagination, parseOrder, paginationMeta, addTextSearch, sendCsvExport } = require('../../shared/utils/pagination');
const { HseAudit, Department, CriticalAuditPlan } = require('../../database/models');
const criticalAuditPlanService = require('./critical-audit-plan.service');
const ApiError = require('../../shared/utils/ApiError');

const buildAuditWhere = async (query = {}) => {
  const where = {};
  const departmentValue = query.departmentId || query.department;
  if (query.plantId && query.plantId !== 'All') where.plantId = query.plantId;
  if (query.status && query.status !== 'All') where.status = query.status;
  if (query.auditType && query.auditType !== 'All') where.auditType = query.auditType;
  if (query.source && query.source !== 'All') where.source = query.source;
  if (query.riskRating && query.riskRating !== 'All') where.riskRating = query.riskRating;
  if (query.hasPlan === 'true') where.criticalAuditPlanId = { [Op.not]: null };
  if (query.planId) where.criticalAuditPlanId = query.planId;
  if (departmentValue && departmentValue !== 'All') {
    const department = await Department.findOne({
      where: { [Op.or]: [{ id: departmentValue }, { code: departmentValue }, { name: departmentValue }] },
      attributes: ['id'],
    });
    where.departmentId = department ? department.id : '__no_matching_department__';
  }

  const auditFrom = query.fromDate || (query.year && /^\d{4}$/.test(query.year) ? `${query.year}-01-01` : null);
  const auditTo = query.toDate || (query.year && /^\d{4}$/.test(query.year) ? `${query.year}-12-31` : null);
  if (auditFrom || auditTo) {
    where.scheduledDate = {
      ...(auditFrom ? { [Op.gte]: auditFrom } : {}),
      ...(auditTo ? { [Op.lte]: auditTo } : {}),
    };
  }
  addTextSearch(where, query.search, ['audit_number', 'title', 'area_owner', 'audit_objective', 'auditors'], HseAudit);
  return where;
};

const csvDate = (value) => {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toISOString().slice(0, 10);
};

const serializeAuditCsv = (row) => ({
  'Audit Number': row.auditNumber || row.audit_number || '',
  Date: csvDate(row.scheduledDate || row.scheduled_date),
  Source: row.criticalAuditPlan?.id || row.critical_audit_plan_id ? 'Critical Audit Plan' : 'Manual',
  Title: row.title || '',
  Department: row.department?.code || row.department?.name || '',
  'Area Owner': row.areaOwner || row.area_owner || '',
  Objective: row.auditObjective || row.audit_objective || '',
  'Risk Rating': row.riskRating || row.risk_rating || '',
  Auditors: row.auditors || '',
  Frequency: row.frequency || '',
  Type: row.auditType || row.audit_type || '',
  Status: ({ planned: 'Pending', in_progress: 'In Progress', completed: 'Closed', cancelled: 'Cancelled' }[row.status] || row.status || ''),
  'Compliance %': row.score ?? '',
});

/**
 * Create a new audit
 */
const createAudit = asyncHandler(async (req, res) => {
  const audit = await hseAuditService.createAudit({
    ...req.body,
    plantId: req.body.plantId || req.user.plantId || process.env.DEFAULT_PLANT_ID || '5126923e-b77f-4eb6-8b98-d5fc9db8d71b',
    source: req.body.source || 'manual',
  }, req.user.id);
  res.status(201).json(ApiResponse.success(audit, 'Audit created successfully', 201));
});

/**
 * Get all audits
 */
const getAllAudits = asyncHandler(async (req, res) => {
  const pagination = parsePagination(req.query);
  const options = {
    ...pagination,
    where: await buildAuditWhere(req.query),
  };
  options.order = parseOrder(req.query, { date: 'scheduledDate', scheduledDate: 'scheduledDate', createdAt: 'createdAt' });

  const result = await hseAuditService.getAllAudits(options);
  res.status(200).json(ApiResponse.success(result.rows, 'Audits retrieved successfully', paginationMeta({ ...pagination, total: result.count })));
});

/**
 * Get audit by ID
 */
const getAuditById = asyncHandler(async (req, res) => {
  const audit = await hseAuditService.getAuditById(req.params.id);
  res.status(200).json(ApiResponse.success(audit, 'Audit retrieved successfully'));
});
const exportAudits = asyncHandler(async (req, res) => {
  const where = await buildAuditWhere(req.query);
  await sendCsvExport(res, HseAudit, {
    where,
    include: [
      { model: Department, as: 'department', attributes: ['name', 'code'], required: false },
      { model: CriticalAuditPlan, as: 'criticalAuditPlan', attributes: ['id'], required: false },
    ],
    nest: true,
    serializeRow: serializeAuditCsv,
    order: parseOrder(req.query, { date: 'scheduledDate', createdAt: 'createdAt' }),
  }, `audits-${new Date().toISOString().slice(0, 10)}.csv`);
});

/**
 * Update audit
 */
const updateAudit = asyncHandler(async (req, res) => {
  const audit = await hseAuditService.updateAudit(req.params.id, req.body, req.user.id);
  res.status(200).json(ApiResponse.success(audit, 'Audit updated successfully'));
});

const getCriticalAuditPlans = asyncHandler(async (req, res) => {
  const pagination = parsePagination(req.query);
  const where = {};
  if (req.query.plantId) where.plantId = req.query.plantId;
  if (req.query.status) where.status = req.query.status;
  addTextSearch(where, req.query.search, ['area_name', 'area_owners', 'audit_objective', 'auditors', 'frequency'], CriticalAuditPlan);
  const result = await criticalAuditPlanService.listPlans({
    ...pagination,
    where,
    order: parseOrder(req.query, { serialNumber: 'serialNumber', areaName: 'areaName', status: 'status', importedAt: 'importedAt' }, ['serialNumber', 'ASC']),
  });
  res.status(200).json(ApiResponse.success(result.rows, 'Critical Audit Plan retrieved successfully', paginationMeta({ ...pagination, total: result.count })));
});

const importCriticalAuditPlan = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('An .xlsx Critical Audit Plan file is required.');
  if (!req.body.plantId) throw ApiError.badRequest('plantId is required.');
  const result = await criticalAuditPlanService.importWorkbook({
    buffer: req.file.buffer,
    filename: req.file.originalname,
    plantId: req.body.plantId,
    userId: req.user.id,
  });
  res.status(200).json(ApiResponse.success(result, 'Critical Audit Plan imported successfully.'));
});

/**
 * Update audit status
 */
const updateStatus = asyncHandler(async (req, res) => {
  const count = await hseAuditService.updateStatus(req.params.id, req.body.status, req.user.id);
  res.status(200).json(ApiResponse.success({ updated: count }, 'Audit status updated successfully'));
});

/**
 * Delete audit
 */
const deleteAudit = asyncHandler(async (req, res) => {
  await hseAuditService.deleteAudit(req.params.id);
  res.status(200).json(ApiResponse.success(null, 'Audit deleted successfully'));
});

module.exports = {
  createAudit,
  getAllAudits,
  getAuditById,
  exportAudits,
  updateAudit,
  updateStatus,
  deleteAudit,
  getCriticalAuditPlans,
  importCriticalAuditPlan,
};
