'use strict';

const { Op } = require('sequelize');
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
const sendDepartments = async (req, res, activeOnly = false) => {
  const pagination = parsePagination(req.query);
  const requestedActiveFilter = req.query.isActive
    ? { isActive: req.query.isActive === 'true' }
    : {};
  const options = {
    ...pagination,
    where: activeOnly ? { isActive: true } : requestedActiveFilter,
  };
  const query = String(req.query.q || '').trim().slice(0, 100);
  if (query) {
    options.where[Op.or] = [
      { name: { [Op.like]: `%${query}%` } },
      { code: { [Op.like]: `%${query}%` } },
    ];
  }
  if (req.query.plantId) options.where.plantId = req.query.plantId;
  options.order = parseOrder(req.query, { name: 'name', createdAt: 'createdAt' }, ['name', 'ASC']);
  const result = await departmentService.getAllDepartments(options);
  res.status(200).json(ApiResponse.success(result.rows, 'Departments retrieved successfully', paginationMeta({ ...pagination, total: result.count })));
};

const getAllDepartments = asyncHandler(async (req, res) => sendDepartments(req, res));
const getActiveDepartments = asyncHandler(async (req, res) => sendDepartments(req, res, true));

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
  const department = await departmentService.updateDepartment(req.params.id, req.body, req.user.id);
  res.status(200).json(ApiResponse.success(department, 'Department updated successfully'));
});

/**
 * Delete department
 */
const deleteDepartment = asyncHandler(async (req, res) => {
  const department = await departmentService.deleteDepartment(req.params.id, req.user.id);
  res.status(200).json(ApiResponse.success(department, 'Department deactivated successfully'));
});

module.exports = {
  createDepartment,
  getAllDepartments,
  getActiveDepartments,
  getDepartmentsByPlant,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
};
