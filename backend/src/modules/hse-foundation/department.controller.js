'use strict';

const departmentService = require('./department.service');
const { ApiResponse, asyncHandler } = require('../../shared/utils/index');
const { parsePagination, parseOrder, paginationMeta } = require('../../shared/utils/pagination');

/**
 * Create a new department
 */
const createDepartment = asyncHandler(async (req, res) => {
  const dept = await departmentService.createDepartment(req.body, req.user.id);
  res.status(201).json(ApiResponse.success(dept, 'Department created successfully', 201));
});

/**
 * Get all departments
 */
const getAllDepartments = asyncHandler(async (req, res) => {
  const pagination = parsePagination(req.query);
  const options = {
    ...pagination,
    where: req.query.isActive ? { isActive: req.query.isActive === 'true' } : {},
  };
  options.order = parseOrder(req.query, { name: 'name', createdAt: 'createdAt' }, ['name', 'ASC']);
  const result = await departmentService.getAllDepartments(options);
  res.status(200).json(ApiResponse.success(result.rows, 'Departments retrieved successfully', paginationMeta({ ...pagination, total: result.count })));
});

/**
 * Get departments by plant
 */
const getDepartmentsByPlant = asyncHandler(async (req, res) => {
  const depts = await departmentService.getDepartmentsByPlant(req.params.plantId);
  res.status(200).json(ApiResponse.success(depts, 'Departments retrieved successfully'));
});

/**
 * Get department by ID
 */
const getDepartmentById = asyncHandler(async (req, res) => {
  const dept = await departmentService.getDepartmentById(req.params.id);
  res.status(200).json(ApiResponse.success(dept, 'Department retrieved successfully'));
});

/**
 * Update department
 */
const updateDepartment = asyncHandler(async (req, res) => {
  const count = await departmentService.updateDepartment(req.params.id, req.body, req.user.id);
  res.status(200).json(ApiResponse.success({ updated: count }, 'Department updated successfully'));
});

/**
 * Delete department
 */
const deleteDepartment = asyncHandler(async (req, res) => {
  await departmentService.deleteDepartment(req.params.id);
  res.status(200).json(ApiResponse.success(null, 'Department deleted successfully'));
});

module.exports = {
  createDepartment,
  getAllDepartments,
  getDepartmentsByPlant,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
};
