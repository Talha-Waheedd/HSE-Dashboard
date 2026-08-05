'use strict';

const hazardRepository = require('../../repositories/hazard.repository');
const nearMissRepository = require('../../repositories/near-miss.repository');
const incidentRepository = require('../../repositories/incident.repository');
const correctiveActionRepository = require('../../repositories/corrective-action.repository');

class DashboardService {
  /**
   * Get overall HSE statistics for the dashboard
   * @param {string} plantId - Optional filter by plant
   */
  async getHseStats(plantId = null) {
    const filter = plantId ? { plantId } : {};

    const [
      hazards,
      nearMisses,
      incidents,
      actions,
    ] = await Promise.all([
      hazardRepository.countByStatus(filter),
      // NearMissRepo doesn't have a specific count method yet, but we can use count
      nearMissRepository.model.count({ where: filter }),
      incidentRepository.countByTypeAndStatus(filter),
      correctiveActionRepository.countByStatus(filter),
    ]);

    // Format hazards by status
    const formattedHazards = hazards.reduce((acc, curr) => {
      acc[curr.status] = parseInt(curr.count, 10);
      acc.total = (acc.total || 0) + parseInt(curr.count, 10);
      return acc;
    }, { total: 0 });

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
    };
  }
}

module.exports = new DashboardService();
