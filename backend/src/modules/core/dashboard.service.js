'use strict';

const hazardRepository = require('../../repositories/hazard.repository');
const nearMissRepository = require('../../repositories/near-miss.repository');
const incidentRepository = require('../../repositories/incident.repository');
const correctiveActionRepository = require('../../repositories/corrective-action.repository');
const { Hazard, TrainingSession, HseAudit, Inspection } = require('../../database/models');
const { Department } = require('../../database/models');
const { Op } = require('sequelize');

class DashboardService {
  /**
   * Get overall HSE statistics for the dashboard
   * @param {object} query - Optional dashboard filters
   */
  async getHseStats(query = {}) {
    const filter = {};
    let departmentPredicate = null;
    if (query.plantId) filter.plantId = query.plantId;

    if (query.department && query.department !== 'All') {
      const department = await Department.findOne({
        where: { [Op.or]: [{ code: query.department }, { name: query.department }] },
        attributes: ['id'],
      });
      filter.departmentId = department?.id || '__no_matching_department__';
      departmentPredicate = {
        [Op.or]: [
          ...(department?.id ? [{ departmentId: department.id }] : []),
          // Sequelize's nested fn() builder drops the quotes around MySQL's
          // JSON path. Use a bound/escaped literal so imported source
          // department labels can be filtered without producing invalid SQL.
          Hazard.sequelize.literal(
            `JSON_UNQUOTE(JSON_EXTRACT(\`metadata\`, '$.originated_department')) = ${Hazard.sequelize.escape(query.department)}`,
          ),
        ],
      };
    }

    const statusMap = {
      Open: ['reported', 'submitted'],
      Pending: ['draft', 'under_investigation', 'under_review'],
      'Work in Progress': ['corrective_action'],
      Closed: ['closed', 'resolved'],
    };
    if (query.status && query.status !== 'All') {
      filter.status = statusMap[query.status] || query.status;
    }

    // Dashboard date filters use the timestamp common to every persisted record.
    // This keeps aggregate totals aligned with the same year/date window as the UI.
    const year = query.year && query.year !== 'All' ? String(query.year) : null;
    const fromDate = query.fromDate || (year ? `${year}-01-01` : null);
    const toDate = query.toDate
      ? (String(query.toDate).length === 10 ? `${query.toDate} 23:59:59` : query.toDate)
      : (year ? `${year}-12-31 23:59:59` : null);
    const dateRange = {};
    if (fromDate) dateRange[Op.gte] = fromDate;
    if (toDate) dateRange[Op.lte] = toDate;
    const whereFor = (dateField, fallbackCreatedAt = false, includeHazardDepartmentMetadata = false, includeDepartmentField = true) => {
      const where = { ...filter };
      delete where.status;
      const andConditions = [];
      if (includeHazardDepartmentMetadata && departmentPredicate) {
        delete where.departmentId;
        andConditions.push(departmentPredicate);
      }
      if (!includeDepartmentField) delete where.departmentId;
      if (fromDate || toDate) {
        andConditions.push(fallbackCreatedAt
          ? {
            [Op.or]: [
              { [dateField]: dateRange },
              // Imported records have an import-time createdAt. Only use it
              // when the actual event date is genuinely unavailable.
              { [Op.and]: [{ [dateField]: { [Op.is]: null } }, { createdAt: dateRange }] },
            ],
          }
          : { [dateField]: dateRange });
      }
      if (andConditions.length) where[Op.and] = andConditions;
      return where;
    };
    const withStatus = (where, statuses = filter.status) => {
      if (statuses) where.status = statuses;
      return where;
    };

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
      hazardRepository.countByStatus(withStatus(whereFor('reportedAt', true, true))),
      Hazard.findAll({
        attributes: ['severityLevel', [Hazard.sequelize.fn('COUNT', 'id'), 'count']],
        where: withStatus(whereFor('reportedAt', true, true)),
        group: ['severityLevel'],
        raw: true,
      }),
      // NearMissRepo doesn't have a specific count method yet, but we can use count
      nearMissRepository.model.count({ where: withStatus(whereFor('reportedAt', true)) }),
      incidentRepository.countByTypeAndStatus(withStatus(whereFor('incidentDate'))),
      // Corrective actions are polymorphic and currently have no department_id
      // column; filtering them by that field causes the entire dashboard query
      // to fail. Their source record carries the department relationship.
      correctiveActionRepository.countByStatus(withStatus(whereFor('dueDate', true, false, false))),
      TrainingSession.count({ where: withStatus(whereFor('scheduledDate', true)) }),
      HseAudit.count({ where: withStatus(whereFor('scheduledDate', true)) }),
      Inspection.count({ where: withStatus(whereFor('scheduledDate', true)) }),
    ]);

    // Format hazards by status
    const formattedHazards = hazards.reduce((acc, curr) => {
      acc[curr.status] = parseInt(curr.count, 10);
      acc.total = (acc.total || 0) + parseInt(curr.count, 10);
      return acc;
    }, { total: 0 });
    const displaySeverity = (value) => {
      const text = String(value || '');
      return text ? text.charAt(0).toUpperCase() + text.slice(1).toLowerCase() : 'Unknown';
    };
    const displayIncidentType = (value) => ({
      first_aid: 'First Aid', mtc: 'MTC', lti: 'LTI', rwc: 'RWC', fatality: 'Fatality',
      minor_fire: 'Minor Fire', significant_near_miss: 'Significant Near Miss',
    }[String(value || '').toLowerCase()] || value);
    formattedHazards.severity = hazardSeverity.reduce((acc, curr) => {
      acc[displaySeverity(curr.severityLevel)] = parseInt(curr.count, 10);
      return acc;
    }, {});

    // Format incidents by type
    const formattedIncidents = incidents.reduce((acc, curr) => {
      const type = displayIncidentType(curr.incidentType);
      acc[type] = (acc[type] || 0) + parseInt(curr.count, 10);
      acc.total = (acc.total || 0) + parseInt(curr.count, 10);
      return acc;
    }, { total: 0 });

    // Format corrective actions by status
    const formattedActions = actions.reduce((acc, curr) => {
      const status = ({ open: 'Open', in_progress: 'Work in Progress', completed: 'Closed', verified: 'Closed', overdue: 'Pending', cancelled: 'Cancelled' }[String(curr.status || '').toLowerCase()] || curr.status);
      acc[status] = (acc[status] || 0) + parseInt(curr.count, 10);
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
