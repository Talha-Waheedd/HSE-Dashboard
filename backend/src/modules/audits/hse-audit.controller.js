'use strict';

const hseAuditService = require('./hse-audit.service');
const { ApiResponse, asyncHandler } = require('../../shared/utils/index');

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
  const options = {
    limit: parseInt(req.query.limit, 10) || 10,
    offset: parseInt(req.query.offset, 10) || 0,
    where: {},
  };
  
  if (req.query.plantId) options.where.plantId = req.query.plantId;
  if (req.query.status) options.where.status = req.query.status;
  if (req.query.auditType) options.where.auditType = req.query.auditType;

  const audits = await hseAuditService.getAllAudits(options);
  res.status(200).json(ApiResponse.success(audits, 'Audits retrieved successfully'));
});

/**
 * Get audit by ID
 */
const getAuditById = asyncHandler(async (req, res) => {
  const audit = await hseAuditService.getAuditById(req.params.id);
  res.status(200).json(ApiResponse.success(audit, 'Audit retrieved successfully'));
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
  updateAudit,
  updateStatus,
  deleteAudit,
};
