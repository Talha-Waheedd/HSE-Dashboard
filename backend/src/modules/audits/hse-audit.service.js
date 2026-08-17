'use strict';

const auditRepository = require('../../repositories/hse-audit.repository');
const plantRepository = require('../../repositories/plant.repository');
const AuditStatus = require('../../shared/enums/AuditStatus');
const { ApiError } = require('../../shared/utils/index');
const { MESSAGES } = require('../../shared/constants');
const { sequelize } = require('../../database/connection');

class HseAuditService {
  /**
   * Create a new HSE audit
   */
  async createAudit(data, userId) {
    const plant = await plantRepository.findById(data.plantId);
    if (!plant) {
      throw ApiError.notFound(MESSAGES.PLANT_NOT_FOUND);
    }

    data.auditedBy = userId;
    data.createdBy = userId;
    
    // Generate audit number
    const currentYear = new Date().getFullYear();
    const count = await auditRepository.model.count({
      where: {
        scheduledDate: {
          [sequelize.Sequelize.Op.gte]: `${currentYear}-01-01`,
        },
      },
      paranoid: false,
    });
    
    data.auditNumber = `AUD-${currentYear}-${String(count + 1).padStart(4, '0')}`;

    const transaction = await sequelize.transaction();
    try {
      const audit = await auditRepository.create(data, { transaction });

      if (data.findings && Array.isArray(data.findings) && data.findings.length > 0) {
        const findingsData = data.findings.map(finding => ({
          ...finding,
          auditId: audit.id,
        }));
        await auditRepository.model.sequelize.models.AuditFinding.bulkCreate(findingsData, { transaction });
      }

      await transaction.commit();
      return this.getAuditById(audit.id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get all audits
   */
  async getAllAudits(options = {}) {
    return auditRepository.findAndCountAll(options);
  }

  /**
   * Get audit by ID
   */
  async getAuditById(id) {
    const audit = await auditRepository.getDetails(id);
    if (!audit) {
      throw ApiError.notFound(MESSAGES.AUDIT_NOT_FOUND);
    }
    return audit;
  }

  /**
   * Update audit
   */
  async updateAudit(id, updateData, userId) {
    const audit = await this.getAuditById(id);

    if (updateData.plantId && updateData.plantId !== audit.plantId) {
      const plant = await plantRepository.findById(updateData.plantId);
      if (!plant) throw ApiError.notFound(MESSAGES.PLANT_NOT_FOUND);
    }

    updateData.updatedBy = userId;
    return auditRepository.updateById(id, updateData);
  }

  /**
   * Update audit status
   */
  async updateStatus(id, newStatus, userId) {
    const audit = await this.getAuditById(id);

    const validStatuses = Object.values(AuditStatus);
    if (!validStatuses.includes(newStatus)) {
      throw ApiError.badRequest('Invalid audit status');
    }

    const updateData = {
      status: newStatus,
      updatedBy: userId,
    };

    if (newStatus === AuditStatus.COMPLETED) {
      updateData.completedDate = new Date();
    }

    return auditRepository.updateById(id, updateData);
  }

  /**
   * Delete audit
   */
  async deleteAudit(id) {
    await this.getAuditById(id);
    return auditRepository.deleteById(id);
  }
}

module.exports = new HseAuditService();
