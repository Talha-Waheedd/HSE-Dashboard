'use strict';

const hseAuditService = require('./hse-audit.service');
const { ApiResponse, asyncHandler } = require('../../shared/utils/index');
const { Op } = require('sequelize');
const { parsePagination, parseOrder, paginationMeta, addTextSearch, sendCsvExport } = require('../../shared/utils/pagination');
const { HseAudit } = require('../../database/models');
const criticalAuditPlanService = require('./critical-audit-plan.service');
const { CriticalAuditPlan } = require('../../database/models');
const ApiError = require('../../shared/utils/ApiError');

/**
 * Create a new audit
 */
const createAudit = asyncHandler(async (req, res) => {
  const audit = await hseAuditService.createAudit(req.body, req.user.id);
  res.status(201).json(ApiResponse.success(audit, 'Audit created successfully', 201));
});

/**
 * Get all audits
 */
const getAllAudits = asyncHandler(async (req, res) => {
  const pagination = parsePagination(req.query);
  const options = {
    ...pagination,
    where: {},
  };
  
  if (req.query.plantId) options.where.plantId = req.query.plantId;
  if (req.query.status) options.where.status = req.query.status;
  if (req.query.auditType) options.where.auditType = req.query.auditType;
  if (req.query.source) options.where.source = req.query.source;
  if (req.query.hasPlan === 'true') options.where.criticalAuditPlanId = { [Op.not]: null };
  if (req.query.planId) options.where.criticalAuditPlanId = req.query.planId;
  const auditFrom = req.query.fromDate || (req.query.year && /^\d{4}$/.test(req.query.year) ? `${req.query.year}-01-01` : null);
  const auditTo = req.query.toDate || (req.query.year && /^\d{4}$/.test(req.query.year) ? `${req.query.year}-12-31 23:59:59` : null);
  if (auditFrom || auditTo) options.where.scheduledDate = { ...(auditFrom ? { [Op.gte]: auditFrom } : {}), ...(auditTo ? { [Op.lte]: auditTo } : {}) };
  addTextSearch(options.where, req.query.search, ['audit_number', 'title', 'area_owner', 'audit_objective', 'auditors'], HseAudit);
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
  const where = {};
  if (req.query.plantId) where.plantId = req.query.plantId;
  if (req.query.status && req.query.status !== 'All') where.status = req.query.status;
  if (req.query.auditType) where.auditType = req.query.auditType;
  if (req.query.source) where.source = req.query.source;
  addTextSearch(where, req.query.search, ['audit_number', 'title', 'description'], HseAudit);
  await sendCsvExport(res, HseAudit, { where, order: parseOrder(req.query, { date: 'scheduledDate', createdAt: 'createdAt' }) }, `audits-${new Date().toISOString().slice(0, 10)}.csv`);
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
