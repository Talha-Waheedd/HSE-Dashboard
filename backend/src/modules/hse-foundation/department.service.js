'use strict';

const departmentRepository = require('../../repositories/department.repository');
const plantRepository = require('../../repositories/plant.repository');
const { ApiError } = require('../../shared/utils/index');
const { MESSAGES } = require('../../shared/constants');

class DepartmentService {
  /**
   * Create a new department
   */
  async createDepartment(data, userId) {
    const plant = await plantRepository.findById(data.plantId);
    if (!plant) {
      throw ApiError.notFound(MESSAGES.PLANT_NOT_FOUND);
    }
    data.createdBy = userId;
    return departmentRepository.create(data);
  }

  /**
   * Get all departments with options
   */
  async getAllDepartments(options = {}) {
    return departmentRepository.findAndCountAll(options);
  }

  /**
   * Get departments by plant ID
   */
  async getDepartmentsByPlant(plantId) {
    return departmentRepository.findByPlantId(plantId);
  }

  /**
   * Get department by ID
   */
  async getDepartmentById(id) {
    const dept = await departmentRepository.getDetails(id);
    if (!dept) {
      throw ApiError.notFound(MESSAGES.DEPARTMENT_NOT_FOUND);
    }
    return dept;
  }

  /**
   * Update department
   */
  async updateDepartment(id, updateData, userId) {
    const dept = await this.getDepartmentById(id);

    if (updateData.plantId && updateData.plantId !== dept.plantId) {
      const plant = await plantRepository.findById(updateData.plantId);
      if (!plant) {
        throw ApiError.notFound(MESSAGES.PLANT_NOT_FOUND);
      }
    }

    updateData.updatedBy = userId;
    return departmentRepository.updateById(id, updateData);
  }

  /**
   * Delete department (soft delete)
   */
  async deleteDepartment(id) {
    await this.getDepartmentById(id);
    return departmentRepository.deleteById(id);
  }
}

module.exports = new DepartmentService();
