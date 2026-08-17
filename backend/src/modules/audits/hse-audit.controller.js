'use strict';

const hseAuditService = require('./hse-audit.service');
const { ApiResponse, asyncHandler } = require('../../shared/utils/index');
const { Op } = require('sequelize');
const { parsePagination, parseOrder, paginationMeta, addTextSearch, sendCsvExport } = require('../../shared/utils/pagination');
const { HseAudit } = require('../../database/models');

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
  const auditFrom = req.query.fromDate || (req.query.year && /^\d{4}$/.test(req.query.year) ? `${req.query.year}-01-01` : null);
  const auditTo = req.query.toDate || (req.query.year && /^\d{4}$/.test(req.query.year) ? `${req.query.year}-12-31 23:59:59` : null);
  if (auditFrom || auditTo) options.where.scheduledDate = { ...(auditFrom ? { [Op.gte]: auditFrom } : {}), ...(auditTo ? { [Op.lte]: auditTo } : {}) };
  addTextSearch(options.where, req.query.search, ['audit_number', 'title', 'description'], HseAudit);
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
  addTextSearch(where, req.query.search, ['audit_number', 'title', 'description'], HseAudit);
  await sendCsvExport(res, HseAudit, { where, order: parseOrder(req.query, { date: 'scheduledDate', createdAt: 'createdAt' }) }, `audits-${new Date().toISOString().slice(0, 10)}.csv`);
});

/**
 * Update audit
 */
const updateAudit = asyncHandler(async (req, res) => {
  const count = await hseAuditService.updateAudit(req.params.id, req.body, req.user.id);
  res.status(200).json(ApiResponse.success({ updated: count }, 'Audit updated successfully'));
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
};
