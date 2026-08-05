'use strict';

const BaseRepository = require('./base.repository');
const { HseAudit, AuditFinding, User, Department, Plant } = require('../database/models');

class HseAuditRepository extends BaseRepository {
  constructor() {
    super(HseAudit);
  }

  /**
   * Get audit details with relations and findings
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async getDetails(id) {
    return this.findById(id, {
      include: [
        { model: User, as: 'auditor', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Department, as: 'department', attributes: ['id', 'name'] },
        { model: Plant, as: 'plant', attributes: ['id', 'name', 'code'] },
        { model: AuditFinding, as: 'findings' },
      ],
    });
  }

  /**
   * Add a finding to an audit
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async addFinding(data) {
    return AuditFinding.create(data);
  }

  /**
   * Get findings for a specific audit
   * @param {string} auditId
   * @returns {Promise<Array>}
   */
  async getFindings(auditId) {
    return AuditFinding.findAll({ where: { auditId } });
  }

  /**
   * Update a specific finding
   * @param {string} findingId
   * @param {Object} data
   * @returns {Promise<number>}
   */
  async updateFinding(findingId, data) {
    if (data.status === 'closed') {
      data.closedAt = new Date();
    }
    const [updatedCount] = await AuditFinding.update(data, { where: { id: findingId } });
    return updatedCount;
  }
}

module.exports = new HseAuditRepository();
