'use strict';

const { Op } = require('sequelize');
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
    const name = data.name.trim();
    const code = data.code?.trim() || null;
    const duplicate = await departmentRepository.findOne({
      plantId: data.plantId,
      [Op.or]: [{ name }, ...(code ? [{ code }] : [])],
    });
    if (duplicate) throw ApiError.conflict('A department with this name or code already exists for the selected plant');
    return departmentRepository.create({
      ...data, name, code, createdBy: userId, updatedBy: userId,
    });
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

    const patch = { ...updateData, updatedBy: userId };
    if (Object.prototype.hasOwnProperty.call(patch, 'name')) patch.name = patch.name.trim();
    if (Object.prototype.hasOwnProperty.call(patch, 'code')) patch.code = patch.code?.trim() || null;
    const plantId = patch.plantId || dept.plantId;
    if (patch.name || patch.code) {
      const duplicate = await departmentRepository.findOne({
        id: { [Op.ne]: id },
        plantId,
        [Op.or]: [
          ...(patch.name ? [{ name: patch.name }] : []),
          ...(patch.code ? [{ code: patch.code }] : []),
        ],
      });
      if (duplicate) throw ApiError.conflict('A department with this name or code already exists for the selected plant');
    }
    await departmentRepository.updateById(id, patch);
    return this.getDepartmentById(id);
  }

  /**
   * Delete department (soft delete)
   */
  async deleteDepartment(id, userId) {
    await this.getDepartmentById(id);
    await departmentRepository.updateById(id, { isActive: false, updatedBy: userId });
    return this.getDepartmentById(id);
  }
}

module.exports = new DepartmentService();
