'use strict';

const inspectionRepository = require('../../repositories/inspection.repository');
const plantRepository = require('../../repositories/plant.repository');
const InspectionStatus = require('../../shared/enums/InspectionStatus');
const { ApiError } = require('../../shared/utils/index');
const { MESSAGES } = require('../../shared/constants');
const { sequelize } = require('../../database/connection');

class InspectionService {
  /**
   * Create a new inspection
   */
  async createInspection(data, userId) {
    const plant = await plantRepository.findById(data.plantId);
    if (!plant) {
      throw ApiError.notFound(MESSAGES.PLANT_NOT_FOUND);
    }

    data.inspectedBy = userId;
    data.createdBy = userId;
    
    // Generate inspection number
    const currentYear = new Date().getFullYear();
    const count = await inspectionRepository.model.count({
      where: {
        scheduledDate: {
          [sequelize.Sequelize.Op.gte]: `${currentYear}-01-01`,
        },
      },
      paranoid: false,
    });
    
    data.inspectionNumber = `INS-${currentYear}-${String(count + 1).padStart(4, '0')}`;

    const transaction = await sequelize.transaction();
    try {
      const inspection = await inspectionRepository.create(data, { transaction });

      if (data.items && Array.isArray(data.items) && data.items.length > 0) {
        const itemsData = data.items.map(item => ({
          ...item,
          inspectionId: inspection.id,
        }));
        await inspectionRepository.model.sequelize.models.InspectionItem.bulkCreate(itemsData, { transaction });
      }

      await transaction.commit();
      return this.getInspectionById(inspection.id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get all inspections
   */
  async getAllInspections(options = {}) {
    return inspectionRepository.findAll(options);
  }

  /**
   * Get inspection by ID
   */
  async getInspectionById(id) {
    const inspection = await inspectionRepository.getDetails(id);
    if (!inspection) {
      throw ApiError.notFound(MESSAGES.INSPECTION_NOT_FOUND);
    }
    return inspection;
  }

  /**
   * Update inspection
   */
  async updateInspection(id, updateData, userId) {
    const inspection = await this.getInspectionById(id);

    if (updateData.plantId && updateData.plantId !== inspection.plantId) {
      const plant = await plantRepository.findById(updateData.plantId);
      if (!plant) throw ApiError.notFound(MESSAGES.PLANT_NOT_FOUND);
    }

    updateData.updatedBy = userId;
    return inspectionRepository.updateById(id, updateData);
  }

  /**
   * Update inspection status
   */
  async updateStatus(id, newStatus, userId) {
    const inspection = await this.getInspectionById(id);

    const validStatuses = Object.values(InspectionStatus);
    if (!validStatuses.includes(newStatus)) {
      throw ApiError.badRequest('Invalid inspection status');
    }

    const updateData = {
      status: newStatus,
      updatedBy: userId,
    };

    if (newStatus === InspectionStatus.COMPLETED) {
      updateData.completedDate = new Date();
    }

    return inspectionRepository.updateById(id, updateData);
  }

  /**
   * Delete inspection
   */
  async deleteInspection(id) {
    await this.getInspectionById(id);
    return inspectionRepository.deleteById(id);
  }
}

module.exports = new InspectionService();
