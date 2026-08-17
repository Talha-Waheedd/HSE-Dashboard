'use strict';

const employeeService = require('./employee.service');
const { ApiResponse, asyncHandler } = require('../../shared/utils/index');
const { parsePagination, parseOrder, paginationMeta } = require('../../shared/utils/pagination');

/**
 * Create employee profile
 */
const createEmployee = asyncHandler(async (req, res) => {
  const employee = await employeeService.createEmployee(req.body);
  res.status(201).json(ApiResponse.success(employee, 'Employee profile created successfully', 201));
});

/**
 * Get all employees
 */
const getAllEmployees = asyncHandler(async (req, res) => {
  const pagination = parsePagination(req.query);
  const options = { ...pagination, where: {} };
  if (req.query.search) options.where = { empId: { [require('sequelize').Op.like]: `%${String(req.query.search).slice(0, 100)}%` } };
  options.order = parseOrder(req.query, { createdAt: 'createdAt', empId: 'empId' });
  const result = await employeeService.getAllEmployees(options);
  res.status(200).json(ApiResponse.success(result.rows, 'Employees retrieved successfully', paginationMeta({ ...pagination, total: result.count })));
});

/**
 * Get employee by ID
 */
const getEmployeeById = asyncHandler(async (req, res) => {
  const employee = await employeeService.getEmployeeById(req.params.id);
  res.status(200).json(ApiResponse.success(employee, 'Employee retrieved successfully'));
});

/**
 * Update employee
 */
const updateEmployee = asyncHandler(async (req, res) => {
  const count = await employeeService.updateEmployee(req.params.id, req.body);
  res.status(200).json(ApiResponse.success({ updated: count }, 'Employee updated successfully'));
});

/**
 * Get employee by human-readable Employee ID
 */
const getEmployeeByEmpId = asyncHandler(async (req, res) => {
  const employee = await employeeService.findEmployeeByEmpId(req.params.empId);
  res.status(200).json(ApiResponse.success(
    employee,
    employee ? 'Employee retrieved successfully' : 'No employee found for this ID',
  ));
});

module.exports = {
  createEmployee,
  getAllEmployees,
  getEmployeeById,
  getEmployeeByEmpId,
  updateEmployee,
};
