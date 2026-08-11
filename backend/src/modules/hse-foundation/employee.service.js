'use strict';

const employeeRepository = require('../../repositories/employee.repository');
const departmentRepository = require('../../repositories/department.repository');
const plantRepository = require('../../repositories/plant.repository');
const { User } = require('../../database/models');
const { ApiError } = require('../../shared/utils/index');
const { MESSAGES } = require('../../shared/constants');

class EmployeeService {
  /**
   * Create or update an employee profile for a user
   */
  async createEmployee(data) {
    // 1. Verify user exists
    const user = await User.findByPk(data.userId);
    if (!user) {
      throw ApiError.notFound(MESSAGES.USER_NOT_FOUND);
    }

    // 2. Check if user already has an employee profile
    const existingProfile = await employeeRepository.findByUserId(data.userId);
    if (existingProfile) {
      throw ApiError.conflict(MESSAGES.EMPLOYEE_ALREADY_EXISTS);
    }

    // 3. Check if employee ID is unique
    const existingEmpId = await employeeRepository.findByEmployeeId(data.employeeId);
    if (existingEmpId) {
      throw ApiError.conflict(MESSAGES.EMPLOYEE_ID_TAKEN);
    }

    // 4. Validate FKs
    if (data.plantId) {
      const plant = await plantRepository.findById(data.plantId);
      if (!plant) throw ApiError.notFound(MESSAGES.PLANT_NOT_FOUND);
    }

    if (data.departmentId) {
      const dept = await departmentRepository.findById(data.departmentId);
      if (!dept) throw ApiError.notFound(MESSAGES.DEPARTMENT_NOT_FOUND);
    }

    return employeeRepository.create(data);
  }

  /**
   * Get all employees
   */
  async getAllEmployees(options = {}) {
    return employeeRepository.findAll(options);
  }

  /**
   * Get employee by ID
   */
  async getEmployeeById(id) {
    const employee = await employeeRepository.getDetails(id);
    if (!employee) {
      throw ApiError.notFound(MESSAGES.EMPLOYEE_NOT_FOUND);
    }
    return employee;
  }

  /**
   * Get employee by human-readable Employee ID
   */
  async getEmployeeByEmpId(empId) {
    const employee = await employeeRepository.getByEmployeeIdDetails(empId);
    if (!employee) {
      throw ApiError.notFound(MESSAGES.EMPLOYEE_NOT_FOUND);
    }
    return employee;
  }

  /**
   * Lookup used by form auto-fill. A missing ID is an expected result while a
   * user is typing, so it should not be surfaced as an operational 404.
   */
  async findEmployeeByEmpId(empId) {
    return employeeRepository.getByEmployeeIdDetails(empId);
  }

  /**
   * Update employee profile
   */
  async updateEmployee(id, updateData) {
    const employee = await this.getEmployeeById(id);

    if (updateData.employeeId && updateData.employeeId !== employee.employeeId) {
      const existing = await employeeRepository.findByEmployeeId(updateData.employeeId);
      if (existing) {
        throw ApiError.conflict(MESSAGES.EMPLOYEE_ID_TAKEN);
      }
    }

    return employeeRepository.updateById(id, updateData);
  }
}

module.exports = new EmployeeService();
