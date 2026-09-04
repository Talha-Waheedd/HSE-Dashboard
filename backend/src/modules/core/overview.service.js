'use strict';

const crypto = require('crypto');
const { sequelize } = require('../../database/connection');
const cacheService = require('./cache.service');

const { QueryTypes } = sequelize;

const cacheKey = (prefix, query) => `${prefix}:${crypto.createHash('sha1').update(JSON.stringify(Object.keys(query).sort().reduce((out, key) => { out[key] = query[key]; return out; }, {}))).digest('hex').slice(0, 16)}`;

const filtersFor = (query, dateColumn, departmentColumn = 'department_id', includeMetadata = true, severityColumn = 'severity_level', locationColumn = 'location') => {
  const clauses = ['deleted_at IS NULL'];
  const replacements = {};
  const year = query.year && query.year !== 'All' ? String(query.year) : null;
  const from = query.fromDate || (year ? `${year}-01-01` : null);
  const to = query.toDate ? `${query.toDate} 23:59:59` : (year ? `${year}-12-31 23:59:59` : null);

  if (query.plantId && query.plantId !== 'All') { clauses.push('plant_id = :plantId'); replacements.plantId = query.plantId; }
  if (query.location && query.location !== 'All' && locationColumn) { clauses.push(`${locationColumn} = :location`); replacements.location = query.location; }
  if (query.department && query.department !== 'All' && departmentColumn) {
    const metadataPredicates = includeMetadata ? " OR JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.originated_department')) = :department" : '';
    clauses.push(`(${departmentColumn} = :department OR ${departmentColumn} = (SELECT id FROM departments WHERE code = :department OR name = :department LIMIT 1)${metadataPredicates})`);
    replacements.department = query.department;
  }
  if (query.severity && query.severity !== 'All' && severityColumn) { clauses.push(`${severityColumn} = :severity`); replacements.severity = String(query.severity).toLowerCase(); }
  if (query.status && query.status !== 'All') {
    const statusGroups = {
      Open: ['open', 'reported', 'submitted', 'scheduled'],
      Pending: ['draft', 'under_review', 'under_investigation', 'pending', 'planned'],
      // Hazard list APIs treat under_review as the in-progress state. Keep it
      // here as well so the Hazard Closing cards and table use identical
      // status semantics.
      'Work in Progress': ['under_review', 'corrective_action', 'in_progress'],
      Closed: ['closed', 'resolved', 'completed', 'verified', 'approved'],
      Cancelled: ['cancelled'],
    };
    const label = String(query.status).trim();
    const values = statusGroups[label] || [label.toLowerCase().replaceAll(' ', '_')];
    const placeholders = values.map((_, index) => `:status${index}`).join(', ');
    clauses.push(`status IN (${placeholders})`);
    values.forEach((value, index) => { replacements[`status${index}`] = value; });
  }
  if (from) { clauses.push(`${dateColumn} >= :fromDate`); replacements.fromDate = from; }
  if (to) { clauses.push(`${dateColumn} <= :toDate`); replacements.toDate = to; }
  return { where: clauses.join(' AND '), replacements };
};

const rows = async (sql, replacements) => sequelize.query(sql, { replacements, type: QueryTypes.SELECT });
const qualifyWhere = (where, alias, columns) => columns.reduce((sql, column) => sql.replace(new RegExp(`\\b${column}\\b(?![0-9])`, 'g'), `${alias}.${column}`), where);
const number = value => Number(value || 0);

class OverviewService {
  async dashboard(query = {}) {
    const key = cacheKey('dashboard:overview', query);
    return cacheService.remember(key, 30, async () => {
      const hazard = filtersFor(query, 'reported_at');
      const incident = filtersFor(query, 'incident_date', 'department_id', false);
      incident.where += ' AND source_near_miss_id IS NULL AND source_hazard_id IS NULL';
      const nearMiss = filtersFor(query, 'reported_at');
      const training = filtersFor(query, 'scheduled_date', 'department_id', false, null, null);
      const actions = filtersFor(query, 'due_date', null, false, 'priority', null);
      const assurance = filtersFor(query, 'scheduled_date', 'department_id', false, null, null);

      const [hazardRows, incidentRows, nearMissRows, trainingRows, actionRows, assuranceRows, trendRows, hazardDimensionRows, recentIncidentRows, incidentDepartmentRows, trainingDepartmentRows] = await Promise.all([
        rows(`SELECT COUNT(*) total,
          SUM(status IN ('draft','reported','submitted','under_review','corrective_action')) open_count,
          SUM(status IN ('closed','resolved')) closed_count,
          SUM(LOWER(severity_level) IN ('high','critical')) high_risk,
          SUM(LOWER(severity_level) = 'medium') medium_risk,
          SUM(LOWER(severity_level) = 'low') low_risk
          FROM hazards WHERE ${hazard.where}`, hazard.replacements),
        rows(`SELECT COUNT(*) total,
          SUM(LOWER(incident_type) IN ('fatality','fatal')) fatalities,
          SUM(LOWER(incident_type) = 'lti') lti,
          SUM(LOWER(incident_type) = 'rwc') rwc,
          SUM(LOWER(incident_type) = 'mtc') mtc,
          SUM(LOWER(incident_type) = 'first_aid') first_aid,
          SUM(LOWER(incident_type) IN ('major_fire','minor_fire','fire')) fire
          FROM incidents WHERE ${incident.where}`, incident.replacements),
        rows(`SELECT COUNT(*) total, SUM(status IN ('closed','resolved')) closed_count
          FROM near_misses WHERE ${nearMiss.where}`, nearMiss.replacements),
        rows(`SELECT COUNT(*) total, COALESCE(SUM(COALESCE(manhours, participant_count * duration_minutes / 60, 0)), 0) manhours
          FROM training_sessions WHERE ${training.where} AND status <> 'draft'`, training.replacements),
        rows(`SELECT COUNT(*) total,
          SUM(status IN ('open','in_progress','pending','planned')) open_count,
          SUM(status IN ('completed','closed','verified')) closed_count,
          SUM(due_date < CURRENT_DATE AND status NOT IN ('completed','closed','verified')) overdue_count
          FROM corrective_actions WHERE ${actions.where}`, actions.replacements),
        rows(`SELECT 'audits' source, COUNT(*) total FROM audits WHERE ${assurance.where}
          UNION ALL SELECT 'inspections' source, COUNT(*) total FROM inspections WHERE ${assurance.where}`, assurance.replacements),
        rows(`SELECT 'hazards' source, YEAR(reported_at) year, MONTH(reported_at) month, COUNT(*) total FROM hazards WHERE ${hazard.where} GROUP BY YEAR(reported_at), MONTH(reported_at)
          UNION ALL SELECT 'incidents' source, YEAR(incident_date) year, MONTH(incident_date) month, COUNT(*) total FROM incidents WHERE ${incident.where} GROUP BY YEAR(incident_date), MONTH(incident_date)
          UNION ALL SELECT 'nearMisses' source, YEAR(reported_at) year, MONTH(reported_at) month, COUNT(*) total FROM near_misses WHERE ${nearMiss.where} GROUP BY YEAR(reported_at), MONTH(reported_at)`, { ...hazard.replacements, ...incident.replacements, ...nearMiss.replacements }),
        rows(`SELECT LOWER(category) category, LOWER(severity_level) severity, COUNT(*) total FROM hazards WHERE ${hazard.where} GROUP BY category, severity`, hazard.replacements),
        rows(`SELECT i.id, i.description, i.incident_date date, COALESCE(d.code, d.name, 'Unassigned') department, i.status
          FROM incidents i LEFT JOIN departments d ON d.id = i.department_id
          WHERE ${qualifyWhere(incident.where, 'i', ['department_id', 'incident_date', 'deleted_at', 'status', 'severity_level', 'source_near_miss_id', 'source_hazard_id'])}
          ORDER BY i.created_at DESC LIMIT 5`, incident.replacements),
        rows(`SELECT COALESCE(d.code, d.name, 'Unassigned') department, COUNT(*) total
          FROM incidents i LEFT JOIN departments d ON d.id = i.department_id
          WHERE ${qualifyWhere(incident.where, 'i', ['department_id', 'incident_date', 'deleted_at', 'status', 'severity_level', 'source_near_miss_id', 'source_hazard_id'])}
          GROUP BY department ORDER BY total DESC LIMIT 10`, incident.replacements),
        rows(`SELECT COALESCE(d.code, d.name, 'All Departments') department,
          COALESCE(SUM(COALESCE(t.manhours, t.participant_count * t.duration_minutes / 60, 0)), 0) manhours
          FROM training_sessions t LEFT JOIN departments d ON d.id = t.department_id
          WHERE ${qualifyWhere(training.where, 't', ['department_id', 'scheduled_date', 'deleted_at', 'status'])} AND t.status <> 'draft'
          GROUP BY department ORDER BY manhours DESC LIMIT 10`, training.replacements),
      ]);

      const h = hazardRows[0] || {}; const i = incidentRows[0] || {}; const n = nearMissRows[0] || {};
      const t = trainingRows[0] || {}; const a = actionRows[0] || {};
      const audits = assuranceRows.find(row => row.source === 'audits')?.total || 0;
      const inspections = assuranceRows.find(row => row.source === 'inspections')?.total || 0;
      const trend = trendRows.reduce((out, row) => {
        out[row.source] ||= {};
        out[row.source][`${row.year}-${String(row.month).padStart(2, '0')}`] = number(row.total);
        return out;
      }, {});
      const dimensions = hazardDimensionRows.reduce((out, row) => { out.byCategory[row.category || 'other'] = (out.byCategory[row.category || 'other'] || 0) + number(row.total); out.bySeverity[row.severity || 'unknown'] = (out.bySeverity[row.severity || 'unknown'] || 0) + number(row.total); return out; }, { byCategory: {}, bySeverity: {} });
      return {
        summary: {
          hazards: { total: number(h.total), open: number(h.open_count), closed: number(h.closed_count), highRisk: number(h.high_risk), severity: { Low: number(h.low_risk), Medium: number(h.medium_risk), High: number(h.high_risk) } },
          nearMisses: { total: number(n.total), closed: number(n.closed_count) },
          incidents: { total: number(i.total), fatalities: number(i.fatalities), lti: number(i.lti), rwc: number(i.rwc), mtc: number(i.mtc), firstAid: number(i.first_aid), fire: number(i.fire), byType: { fatality: number(i.fatalities), lti: number(i.lti), rwc: number(i.rwc), mtc: number(i.mtc), first_aid: number(i.first_aid), fire: number(i.fire) } },
          training: { total: number(t.total), manhours: number(t.manhours) },
          correctiveActions: { total: number(a.total), open: number(a.open_count), closed: number(a.closed_count), overdue: number(a.overdue_count) },
          assurance: { audits: number(audits), inspections: number(inspections) },
        },
        leadingIndicators: { hazards: number(h.total), nearMisses: number(n.total), trainingManhours: number(t.manhours), audits: number(audits), inspections: number(inspections), hazardClosure: number(h.total) ? Math.round((number(h.closed_count) / number(h.total)) * 100) : 0, actionClosure: number(a.total) ? Math.round((number(a.closed_count) / number(a.total)) * 100) : 0 },
        laggingIndicators: { fatalities: number(i.fatalities), lti: number(i.lti), rwc: number(i.rwc), mtc: number(i.mtc), firstAid: number(i.first_aid), fire: number(i.fire) },
        departmentStatistics: { incidents: incidentDepartmentRows.map(row => ({ department: row.department, total: number(row.total) })), training: trainingDepartmentRows.map(row => ({ department: row.department, manhours: Math.round(number(row.manhours)) })) },
        charts: { hazards: dimensions.byCategory, hazardSeverity: dimensions.bySeverity, monthly: trend },
        recent: { incidents: recentIncidentRows, hazards: [], nearMisses: [] },
      };
    });
  }

  async analytics(query = {}) {
    const key = cacheKey('analytics:overview', query);
    return cacheService.remember(key, 30, async () => {
      const hazard = filtersFor(query, 'reported_at'); const incident = filtersFor(query, 'incident_date', 'department_id', false); const nearMiss = filtersFor(query, 'reported_at');
      incident.where += ' AND source_near_miss_id IS NULL AND source_hazard_id IS NULL';
      const training = filtersFor(query, 'scheduled_date', 'department_id', false, null, null); const action = filtersFor(query, 'due_date', null, false, 'priority', null); const assurance = filtersFor(query, 'scheduled_date', 'department_id', false, null, null);
      const [hazards, incidents, nearMisses, trainings, actions, audits, inspections] = await Promise.all([
        rows(`SELECT LOWER(category) category, LOWER(severity_level) severity, LOWER(status) status, MONTH(reported_at) month, COUNT(*) total FROM hazards WHERE ${hazard.where} GROUP BY category, severity, status, month`, hazard.replacements),
        rows(`SELECT LOWER(incident_type) type, MONTH(incident_date) month, COUNT(*) total FROM incidents WHERE ${incident.where} GROUP BY type, month`, incident.replacements),
        rows(`SELECT MONTH(reported_at) month, LOWER(department_id) department, COUNT(*) total FROM near_misses WHERE ${nearMiss.where} GROUP BY month, department`, nearMiss.replacements),
        rows(`SELECT MONTH(t.scheduled_date) month, COALESCE(d.name, t.department_id) department, COUNT(*) total, COALESCE(SUM(COALESCE(t.manhours, t.participant_count * t.duration_minutes / 60, 0)),0) manhours FROM training_sessions t LEFT JOIN departments d ON d.id = t.department_id WHERE ${qualifyWhere(training.where, 't', ['department_id', 'scheduled_date', 'deleted_at', 'status'])} AND t.status <> 'draft' GROUP BY month, t.department_id, d.name`, training.replacements),
        rows(`SELECT LOWER(status) status, LOWER(priority) severity, COUNT(*) total, SUM(status IN ('completed','closed','verified')) completed FROM corrective_actions WHERE ${action.where} GROUP BY status, severity`, action.replacements),
        rows(`SELECT 'audits' source, department_id department, COUNT(*) total FROM audits WHERE ${assurance.where} GROUP BY department_id`, assurance.replacements),
        rows(`SELECT 'inspections' source, department_id department, COUNT(*) total FROM inspections WHERE ${assurance.where} GROUP BY department_id`, assurance.replacements),
      ]);
      const hazardSummary = hazards.reduce((out, row) => { out.total += number(row.total); out.byCategory[row.category || 'other'] = (out.byCategory[row.category || 'other'] || 0) + number(row.total); out.bySeverity[row.severity || 'unknown'] = (out.bySeverity[row.severity || 'unknown'] || 0) + number(row.total); out.byStatus[row.status || 'unknown'] = (out.byStatus[row.status || 'unknown'] || 0) + number(row.total); out.monthly[row.month] = (out.monthly[row.month] || 0) + number(row.total); return out; }, { total: 0, byCategory: {}, bySeverity: {}, byStatus: {}, monthly: {} });
      const incidentSummary = incidents.reduce((out, row) => { out.total += number(row.total); out.byType[row.type || 'other'] = (out.byType[row.type || 'other'] || 0) + number(row.total); out.monthly[row.month] = (out.monthly[row.month] || 0) + number(row.total); return out; }, { total: 0, byType: {}, monthly: {} });
      const trainingSummary = trainings.reduce((out, row) => { out.total += number(row.total); out.manhours += number(row.manhours); out.monthly[row.month] = (out.monthly[row.month] || 0) + number(row.manhours); out.byDepartment[row.department || 'unassigned'] = (out.byDepartment[row.department || 'unassigned'] || 0) + number(row.manhours); return out; }, { total: 0, manhours: 0, monthly: {}, byDepartment: {} });
      const actionSummary = actions.reduce((out, row) => { out.total += number(row.total); out.completed += number(row.completed); out.byStatus[row.status || 'unknown'] = (out.byStatus[row.status || 'unknown'] || 0) + number(row.total); return out; }, { total: 0, completed: 0, byStatus: {} });
      const nearMissSummary = { total: nearMisses.reduce((sum, row) => sum + number(row.total), 0), byMonth: nearMisses.reduce((out, row) => { out[row.month] = (out[row.month] || 0) + number(row.total); return out; }, {}) };
      return { summary: { hazards: hazardSummary, incidents: incidentSummary, nearMisses: nearMissSummary, training: trainingSummary, actions: actionSummary, audits: audits.reduce((sum, row) => sum + number(row.total), 0), inspections: inspections.reduce((sum, row) => sum + number(row.total), 0) }, hazardStatistics: hazardSummary, incidentStatistics: incidentSummary, trainingStatistics: trainingSummary, correctiveActionStatistics: actionSummary, departmentStatistics: [...audits, ...inspections], charts: { hazardsByCategory: hazardSummary.byCategory, hazardsBySeverity: hazardSummary.bySeverity, hazardsByStatus: hazardSummary.byStatus, hazardsByMonth: hazardSummary.monthly, incidentsByMonth: incidentSummary.monthly, nearMissesByMonth: nearMissSummary.byMonth, trainingByMonth: trainingSummary.monthly }, leadingIndicators: { hazards: hazardSummary.total, nearMisses: nearMissSummary.total, trainingManhours: trainingSummary.manhours }, laggingIndicators: { incidents: incidentSummary.total }, assurance: { audits, inspections } };
    });
  }
}

module.exports = new OverviewService();
