'use strict';

const hazardRepository = require('../../repositories/hazard.repository');
const nearMissRepository = require('../../repositories/near-miss.repository');
const incidentRepository = require('../../repositories/incident.repository');
const correctiveActionRepository = require('../../repositories/corrective-action.repository');
const { Hazard, TrainingSession, HseAudit, Inspection } = require('../../database/models');
const { Op } = require('sequelize');

class DashboardService {
  /**
   * Get overall HSE statistics for the dashboard
   * @param {object} query - Optional dashboard filters
   */
  async getHseStats(query = {}) {
    const filter = {};
    if (query.plantId) filter.plantId = query.plantId;

    // Dashboard date filters use the timestamp common to every persisted record.
    // This keeps aggregate totals aligned with the same year/date window as the UI.
    const year = query.year && query.year !== 'All' ? String(query.year) : null;
    const fromDate = query.fromDate || (year ? `${year}-01-01` : null);
    const toDate = query.toDate
      ? (String(query.toDate).length === 10 ? `${query.toDate} 23:59:59` : query.toDate)
      : (year ? `${year}-12-31 23:59:59` : null);
    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) filter.createdAt[Op.gte] = fromDate;
      if (toDate) filter.createdAt[Op.lte] = toDate;
    }

    const [
      hazards,
      hazardSeverity,
      nearMisses,
      incidents,
      actions,
      training,
      audits,
      inspections,
    ] = await Promise.all([
      hazardRepository.countByStatus(filter),
      Hazard.findAll({
        attributes: ['severityLevel', [Hazard.sequelize.fn('COUNT', 'id'), 'count']],
        where: filter,
        group: ['severityLevel'],
        raw: true,
      }),
      // NearMissRepo doesn't have a specific count method yet, but we can use count
      nearMissRepository.model.count({ where: filter }),
      incidentRepository.countByTypeAndStatus(filter),
      correctiveActionRepository.countByStatus(filter),
      TrainingSession.count({ where: filter }),
      HseAudit.count({ where: filter }),
      Inspection.count({ where: filter }),
    ]);

    // Format hazards by status
    const formattedHazards = hazards.reduce((acc, curr) => {
      acc[curr.status] = parseInt(curr.count, 10);
      acc.total = (acc.total || 0) + parseInt(curr.count, 10);
      return acc;
    }, { total: 0 });
    formattedHazards.severity = hazardSeverity.reduce((acc, curr) => {
      acc[curr.severityLevel] = parseInt(curr.count, 10);
      return acc;
    }, {});

    // Format incidents by type
    const formattedIncidents = incidents.reduce((acc, curr) => {
      acc[curr.incidentType] = (acc[curr.incidentType] || 0) + parseInt(curr.count, 10);
      acc.total = (acc.total || 0) + parseInt(curr.count, 10);
      return acc;
    }, { total: 0 });

    // Format corrective actions by status
    const formattedActions = actions.reduce((acc, curr) => {
      acc[curr.status] = parseInt(curr.count, 10);
      acc.total = (acc.total || 0) + parseInt(curr.count, 10);
      return acc;
    }, { total: 0 });

    return {
      hazards: formattedHazards,
      nearMisses: { total: nearMisses },
      incidents: formattedIncidents,
      correctiveActions: formattedActions,
      training: { total: training },
      audits: { total: audits },
      inspections: { total: inspections },
    };
  }
}

module.exports = new DashboardService();
