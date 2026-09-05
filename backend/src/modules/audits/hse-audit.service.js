'use strict';

const auditRepository = require('../../repositories/hse-audit.repository');
const plantRepository = require('../../repositories/plant.repository');
const AuditStatus = require('../../shared/enums/AuditStatus');
const { ApiError } = require('../../shared/utils/index');
const { MESSAGES } = require('../../shared/constants');
const { sequelize } = require('../../database/connection');
const { Op } = require('sequelize');
const { AuditFinding } = require('../../database/models');
const { syncBestEffort } = require('../actions/capa-sync.service');

const scoringFor = (findings = []) => {
  const scores = findings.map((finding) => Number(finding.score)).filter((score) => Number.isInteger(score) && score >= 1 && score <= 4);
  const pointsScored = scores.reduce((sum, score) => sum + score, 0);
  const pointsAvailable = scores.length * 4;
  return {
    pointsScored,
    pointsAvailable,
    overallCompliance: pointsAvailable ? Number(((pointsScored / pointsAvailable) * 100).toFixed(2)) : 0,
  };
};

const withScoring = (audit) => {
  if (!audit) return audit;
  const values = typeof audit.toJSON === 'function' ? audit.toJSON() : audit;
  return { ...values, ...scoringFor(values.findings || []) };
};

class HseAuditService {
  /**
   * Create a new HSE audit
   */
  async createAudit(data, userId) {
    if (!data.plantId) throw ApiError.badRequest('The authenticated user is not assigned to a plant.');
    const plant = await plantRepository.findById(data.plantId);
    if (!plant) {
      throw ApiError.notFound(MESSAGES.PLANT_NOT_FOUND);
    }

    data.source = data.source === 'audit-management' ? 'manual' : (data.source || 'manual');
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
      const persisted = await this.getAuditById(audit.id);
      await syncBestEffort('audit', audit.id);
      return persisted;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get all audits
   */
  async getAllAudits(options = {}) {
    return auditRepository.listDetails(options);
  }

  /**
   * Get audit by ID
   */
  async getAuditById(id) {
    const audit = await auditRepository.getDetails(id);
    if (!audit) {
      throw ApiError.notFound(MESSAGES.AUDIT_NOT_FOUND);
    }
    return withScoring(audit);
  }

  /**
   * Update audit
   */
  async updateAudit(id, updateData, userId) {
    const audit = await auditRepository.findById(id);
    if (!audit) throw ApiError.notFound(MESSAGES.AUDIT_NOT_FOUND);

    if (updateData.plantId && updateData.plantId !== audit.plantId) {
      const plant = await plantRepository.findById(updateData.plantId);
      if (!plant) throw ApiError.notFound(MESSAGES.PLANT_NOT_FOUND);
    }

    const { findings, ...auditUpdates } = updateData;
    auditUpdates.updatedBy = userId;
    if (auditUpdates.status === AuditStatus.COMPLETED && !auditUpdates.completedDate) {
      auditUpdates.completedDate = new Date().toISOString().slice(0, 10);
    } else if (auditUpdates.status && auditUpdates.status !== AuditStatus.COMPLETED) {
      auditUpdates.completedDate = null;
    }

    const transaction = await sequelize.transaction();
    try {
      if (Array.isArray(findings)) {
        const retainedIds = [];
        for (let index = 0; index < findings.length; index += 1) {
          const finding = findings[index];
          const values = {
            standardReference: finding.standardReference || null,
            description: finding.description,
            standardLimitRequirement: finding.standardLimitRequirement || null,
            score: finding.score || null,
            severityLevel: finding.severityLevel || null,
            recommendation: finding.recommendation || null,
            targetDate: finding.targetDate || null,
            responsibility: finding.responsibility || null,
            responsibleDepartmentId: finding.responsibleDepartmentId || null,
            sortOrder: finding.sortOrder ?? index,
            status: finding.status || 'open',
            closedAt: finding.status === 'closed' ? new Date() : null,
          };
          if (finding.id) {
            const [updated] = await AuditFinding.update(values, { where: { id: finding.id, auditId: id }, transaction });
            if (!updated) throw ApiError.badRequest('An Audit Item does not belong to this Audit Log.');
            retainedIds.push(finding.id);
          } else {
            const created = await AuditFinding.create({ ...values, auditId: id }, { transaction });
            retainedIds.push(created.id);
          }
        }
        await AuditFinding.destroy({
          where: { auditId: id, ...(retainedIds.length ? { id: { [Op.notIn]: retainedIds } } : {}) },
          transaction,
        });
        const scoring = scoringFor(findings);
        auditUpdates.score = scoring.pointsAvailable ? scoring.overallCompliance : null;
      }
      await audit.update(auditUpdates, { transaction });
      await transaction.commit();
      const persisted = await this.getAuditById(id);
      await syncBestEffort('audit', id);
      return persisted;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Update audit status
   */
  async updateStatus(id, newStatus, userId) {
    await this.getAuditById(id);

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

    const result = await auditRepository.updateById(id, updateData);
    await syncBestEffort('audit', id);
    return result;
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
