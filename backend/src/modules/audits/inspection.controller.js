'use strict';

const inspectionService = require('./inspection.service');
const { ApiResponse, asyncHandler } = require('../../shared/utils/index');

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
  const options = {
    limit: parseInt(req.query.limit, 10) || 10,
    offset: parseInt(req.query.offset, 10) || 0,
    where: {},
  };
  
  if (req.query.plantId) options.where.plantId = req.query.plantId;
  if (req.query.status) options.where.status = req.query.status;
  if (req.query.inspectionType) options.where.inspectionType = req.query.inspectionType;

  const inspections = await inspectionService.getAllInspections(options);
  res.status(200).json(ApiResponse.success(inspections, 'Inspections retrieved successfully'));
});

/**
 * Get inspection by ID
 */
const getInspectionById = asyncHandler(async (req, res) => {
  const inspection = await inspectionService.getInspectionById(req.params.id);
  res.status(200).json(ApiResponse.success(inspection, 'Inspection retrieved successfully'));
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
  updateInspection,
  updateStatus,
  deleteInspection,
};
