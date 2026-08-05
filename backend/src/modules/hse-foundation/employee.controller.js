'use strict';

const employeeService = require('./employee.service');
const { ApiResponse, asyncHandler } = require('../../shared/utils/index');

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
  const options = {
    limit: parseInt(req.query.limit, 10) || 10,
    offset: parseInt(req.query.offset, 10) || 0,
  };
  const employees = await employeeService.getAllEmployees(options);
  res.status(200).json(ApiResponse.success(employees, 'Employees retrieved successfully'));
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

module.exports = {
  createEmployee,
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
};
