'use strict';

const hazardRepository = require('../../repositories/hazard.repository');
const incidentRepository = require('../../repositories/incident.repository');
const { sequelize } = require('../../database/connection');

class ReportService {
  /**
   * Generate an HSE performance report for a given date range
   */
  async generatePerformanceReport(startDate, endDate, plantId = null) {
    const filter = {};
    if (plantId) filter.plantId = plantId;

    const dateFilter = {
      [sequelize.Sequelize.Op.between]: [startDate, endDate],
    };

    // Note: A real reporting engine might use a dedicated OLAP database or complex views.
    // Here we're aggregating using the ORM.

    const [
      hazards,
      incidents,
    ] = await Promise.all([
      hazardRepository.findAll({ where: { ...filter, createdAt: dateFilter } }),
      incidentRepository.findAll({ where: { ...filter, incidentDate: dateFilter } }),
    ]);

    // Calculate metrics like LTIFR (Lost Time Injury Frequency Rate)
    // Formula typically: (Number of LTIs x 1,000,000) / Total hours worked
    // Since we don't have total hours worked here, we just provide the raw counts for now.

    const ltiCount = incidents.filter(i => i.incidentType === 'lti').length;
    const mtcCount = incidents.filter(i => i.incidentType === 'mtc').length;
    const firstAidCount = incidents.filter(i => i.incidentType === 'first_aid').length;
    
    let totalLostDays = 0;
    incidents.forEach(i => {
      if (i.lostDays) totalLostDays += i.lostDays;
    });

    return {
      period: { startDate, endDate },
      plantId: plantId || 'All Plants',
      metrics: {
        totalHazardsReported: hazards.length,
        totalIncidents: incidents.length,
        lti: ltiCount,
        mtc: mtcCount,
        firstAid: firstAidCount,
        totalLostDays,
      },
    };
  }
}

module.exports = new ReportService();
