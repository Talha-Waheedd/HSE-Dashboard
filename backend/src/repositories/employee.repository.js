'use strict';

const BaseRepository = require('./base.repository');
const { Employee, User, Department, Plant } = require('../database/models');

class EmployeeRepository extends BaseRepository {
  constructor() {
    super(Employee);
  }

  /**
   * Find employee profile by user ID
   * @param {string} userId
   * @returns {Promise<Object|null>}
   */
  async findByUserId(userId) {
    return this.findOne({ userId });
  }

  /**
   * Find employee by employee ID (e.g. EMP-001)
   * @param {string} employeeId
   * @returns {Promise<Object|null>}
   */
  async findByEmployeeId(employeeId) {
    return this.findOne({ employeeId });
  }

  /**
   * Get complete employee details with user, department, and plant associations
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async getDetails(id) {
    return this.findById(id, {
      include: [
        { model: User, as: 'user', attributes: { exclude: ['password'] } },
        { model: Department, as: 'department', attributes: ['id', 'name', 'code'] },
        { model: Plant, as: 'plant', attributes: ['id', 'name', 'code'] },
      ],
    });
  }

  /**
   * Get complete employee details by human-readable employeeId
   * @param {string} employeeId
   * @returns {Promise<Object|null>}
   */
  async getByEmployeeIdDetails(employeeId) {
    return this.findOne({ employeeId }, {
      include: [
        { model: User, as: 'user', attributes: { exclude: ['password'] } },
        { model: Department, as: 'department', attributes: ['id', 'name', 'code'] },
        { model: Plant, as: 'plant', attributes: ['id', 'name', 'code'] },
      ],
    });
  }
}

module.exports = new EmployeeRepository();
