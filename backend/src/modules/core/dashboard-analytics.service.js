const crypto = require('crypto');
const { QueryTypes } = require('sequelize');
const { sequelize } = require('../../database/connection');
const cacheService = require('./cache.service');
const { ApiError } = require('../../shared/utils/index');

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const jsonText = (alias, path) => `JSON_UNQUOTE(JSON_EXTRACT(${alias}.metadata, '$.${path}'))`;
const nonBlank = (expression) => `NULLIF(TRIM(${expression}), '')`;

const hazardDepartment = `COALESCE(
  ${nonBlank('d.code')}, ${nonBlank('d.name')},
  ${nonBlank(jsonText('h', 'originated_department'))},
  ${nonBlank(jsonText('h', 'originated_dept'))},
  ${nonBlank(jsonText('h', 'department_code'))},
  ${nonBlank(jsonText('h', 'department_name'))},
  'Unassigned'
)`;
const hazardResponsibleValue = `COALESCE(
  ${nonBlank(jsonText('h', 'responsible_department_id'))},
  ${nonBlank(jsonText('h', 'responsible_department'))},
  ${nonBlank(jsonText('h', 'responsibleDepartment'))}
)`;
const hazardResponsibleDepartment = `COALESCE(${nonBlank('rd.code')}, ${nonBlank('rd.name')}, ${hazardResponsibleValue}, 'Unassigned')`;
const nearMissDepartment = `COALESCE(
  ${nonBlank('d.code')}, ${nonBlank('d.name')},
  ${nonBlank(jsonText('nm', 'department_code'))},
  ${nonBlank(jsonText('nm', 'department_name'))},
  ${nonBlank(jsonText('nm', 'originated_department'))},
  'Unassigned'
)`;

const incidentGroups = {
  department: `COALESCE(${nonBlank('d.code')}, ${nonBlank('d.name')}, 'Unassigned')`,
  category: "COALESCE(NULLIF(LOWER(i.incident_type), ''), 'unknown')",
  severity: "COALESCE(NULLIF(LOWER(i.severity_level), ''), 'unknown')",
  status: "COALESCE(NULLIF(LOWER(i.status), ''), 'unknown')",
  month: "DATE_FORMAT(i.incident_date, '%Y-%m')",
  year: 'CAST(YEAR(i.incident_date) AS CHAR)',
  location: `COALESCE(${nonBlank('l.name')}, ${nonBlank('i.location')}, 'Unassigned')`,
};

const DATASETS = {
  incidents: {
    from: 'incidents i',
    joins: 'LEFT JOIN departments d ON d.id = i.department_id LEFT JOIN locations l ON l.id = i.location_id',
    dateExpression: 'i.incident_date',
    plantColumn: 'i.plant_id',
    departmentColumn: 'i.department_id',
    departmentLabel: incidentGroups.department,
    locationLabel: incidentGroups.location,
    severityColumn: 'i.severity_level',
    statusColumn: 'i.status',
    baseConditions: ['i.deleted_at IS NULL', 'i.source_near_miss_id IS NULL', 'i.source_hazard_id IS NULL'],
    groups: incidentGroups,
    metrics: { count: 'COUNT(*)' },
    defaultGroup: 'department',
    defaultMetric: 'count',
  },
  fire: {
    from: 'incidents i',
    joins: 'LEFT JOIN departments d ON d.id = i.department_id LEFT JOIN locations l ON l.id = i.location_id',
    dateExpression: 'i.incident_date',
    plantColumn: 'i.plant_id',
    departmentColumn: 'i.department_id',
    departmentLabel: incidentGroups.department,
    locationLabel: incidentGroups.location,
    severityColumn: 'i.severity_level',
    statusColumn: 'i.status',
    baseConditions: [
      'i.deleted_at IS NULL', 'i.source_near_miss_id IS NULL', 'i.source_hazard_id IS NULL',
      "LOWER(i.incident_type) IN ('fire', 'minor_fire', 'major_fire')",
    ],
    groups: incidentGroups,
    metrics: { count: 'COUNT(*)' },
    defaultGroup: 'department',
    defaultMetric: 'count',
  },
  hazards: {
    from: 'hazards h',
    joins: `LEFT JOIN departments d ON d.id = h.department_id
      LEFT JOIN departments rd ON rd.id = ${hazardResponsibleValue}
        OR LOWER(rd.code) = LOWER(${hazardResponsibleValue})
        OR LOWER(rd.name) = LOWER(${hazardResponsibleValue})`,
    dateExpression: 'COALESCE(h.reported_at, h.created_at)',
    plantColumn: 'h.plant_id',
    departmentColumn: 'h.department_id',
    departmentLabel: hazardDepartment,
    locationLabel: `COALESCE(${nonBlank('h.location')}, 'Unassigned')`,
    severityColumn: 'h.severity_level',
    statusColumn: 'h.status',
    statusAliases: {
      open: ['open', 'reported', 'submitted'],
      pending: ['pending', 'under_review', 'in_progress'],
      'in progress': ['under_review', 'in_progress'],
      close: ['closed', 'resolved'],
      closed: ['closed', 'resolved'],
    },
    baseConditions: ['h.deleted_at IS NULL'],
    groups: {
      department: hazardDepartment,
      responsibleDepartment: hazardResponsibleDepartment,
      category: "COALESCE(NULLIF(LOWER(h.category), ''), 'unknown')",
      riskRating: "COALESCE(NULLIF(LOWER(h.severity_level), ''), 'unknown')",
      status: "COALESCE(NULLIF(LOWER(h.status), ''), 'unknown')",
      month: "DATE_FORMAT(COALESCE(h.reported_at, h.created_at), '%Y-%m')",
      year: 'CAST(YEAR(COALESCE(h.reported_at, h.created_at)) AS CHAR)',
      location: `COALESCE(${nonBlank('h.location')}, 'Unassigned')`,
      hazardType: `COALESCE(${nonBlank(jsonText('h', 'unsafe_type'))}, 'Not specified')`,
    },
    metrics: { count: 'COUNT(*)' },
    defaultGroup: 'category',
    defaultMetric: 'count',
  },
  'near-misses': {
    from: 'near_misses nm',
    joins: 'LEFT JOIN departments d ON d.id = nm.department_id LEFT JOIN departments rd ON rd.id = nm.responsible_department_id',
    dateExpression: 'COALESCE(nm.reported_at, nm.created_at)',
    plantColumn: 'nm.plant_id',
    departmentColumn: 'nm.department_id',
    departmentLabel: nearMissDepartment,
    locationLabel: `COALESCE(${nonBlank('nm.location')}, 'Unassigned')`,
    statusColumn: 'nm.status',
    statusAliases: {
      open: ['open', 'reported', 'submitted', 'under_review'],
      pending: ['pending'],
      'in progress': ['in_progress'],
      close: ['closed', 'resolved'],
      closed: ['closed', 'resolved'],
    },
    baseConditions: ['nm.deleted_at IS NULL'],
    groups: {
      department: nearMissDepartment,
      responsibleDepartment: `COALESCE(${nonBlank('rd.code')}, ${nonBlank('rd.name')}, 'Unassigned')`,
      status: "COALESCE(NULLIF(LOWER(nm.status), ''), 'unknown')",
      month: "DATE_FORMAT(COALESCE(nm.reported_at, nm.created_at), '%Y-%m')",
      year: 'CAST(YEAR(COALESCE(nm.reported_at, nm.created_at)) AS CHAR)',
      location: `COALESCE(${nonBlank('nm.location')}, 'Unassigned')`,
      investigationRequired: "CASE WHEN nm.further_investigation_required = 1 THEN 'Yes' WHEN nm.further_investigation_required = 0 THEN 'No' ELSE 'Not specified' END",
      reportedInHazard: "CASE WHEN nm.reported_in_hazard = 1 THEN 'Yes' WHEN nm.reported_in_hazard = 0 THEN 'No' ELSE 'Not specified' END",
    },
    metrics: { count: 'COUNT(*)' },
    defaultGroup: 'department',
    defaultMetric: 'count',
  },
  training: {
    from: 'training_sessions t',
    joins: 'LEFT JOIN departments d ON d.id = t.department_id',
    dateExpression: 'COALESCE(t.scheduled_date, DATE(t.created_at))',
    plantColumn: 't.plant_id',
    departmentColumn: 't.department_id',
    departmentLabel: `COALESCE(${nonBlank('d.code')}, ${nonBlank('d.name')}, 'All Departments')`,
    locationLabel: `COALESCE(${nonBlank('t.venue')}, 'Not specified')`,
    statusColumn: 't.status',
    baseConditions: ['t.deleted_at IS NULL', "t.status <> 'draft'"],
    groups: {
      department: `COALESCE(${nonBlank('d.code')}, ${nonBlank('d.name')}, 'All Departments')`,
      month: "DATE_FORMAT(COALESCE(t.scheduled_date, DATE(t.created_at)), '%Y-%m')",
      year: 'CAST(YEAR(COALESCE(t.scheduled_date, DATE(t.created_at))) AS CHAR)',
      trainingType: `COALESCE(${nonBlank('t.custom_training_type')}, ${nonBlank('t.training_type')}, 'Not specified')`,
      location: `COALESCE(${nonBlank('t.venue')}, 'Not specified')`,
      status: "COALESCE(NULLIF(LOWER(t.status), ''), 'unknown')",
    },
    metrics: {
      sessions: 'COUNT(*)',
      manhours: 'ROUND(COALESCE(SUM(COALESCE(t.manhours, t.participant_count * t.duration_minutes / 60, 0)), 0), 2)',
      participants: 'COALESCE(SUM(COALESCE(t.participant_count, 0)), 0)',
    },
    defaultGroup: 'department',
    defaultMetric: 'manhours',
  },
  capa: {
    from: 'corrective_actions ca',
    joins: 'LEFT JOIN departments rd ON rd.id = ca.responsible_department_id',
    dateExpression: 'COALESCE(ca.due_date, DATE(ca.created_at))',
    plantColumn: 'ca.plant_id',
    departmentColumn: 'ca.responsible_department_id',
    departmentLabel: `COALESCE(${nonBlank('rd.code')}, ${nonBlank('rd.name')}, 'Unassigned')`,
    severityColumn: 'ca.priority',
    statusColumn: 'ca.status',
    baseConditions: ['ca.deleted_at IS NULL'],
    groups: {
      status: "COALESCE(NULLIF(LOWER(ca.status), ''), 'unknown')",
      department: `COALESCE(${nonBlank('rd.code')}, ${nonBlank('rd.name')}, 'Unassigned')`,
      category: `COALESCE(${nonBlank('ca.incident_category')}, 'Not specified')`,
      source: "COALESCE(NULLIF(LOWER(ca.source_type), ''), 'unknown')",
      priority: "COALESCE(NULLIF(LOWER(ca.priority), ''), 'Not specified')",
      month: "DATE_FORMAT(COALESCE(ca.due_date, DATE(ca.created_at)), '%Y-%m')",
      year: 'CAST(YEAR(COALESCE(ca.due_date, DATE(ca.created_at))) AS CHAR)',
    },
    metrics: { count: 'COUNT(*)' },
    defaultGroup: 'status',
    defaultMetric: 'count',
  },
  audits: {
    from: 'audits a',
    joins: 'LEFT JOIN departments d ON d.id = a.department_id',
    dateExpression: 'a.scheduled_date',
    plantColumn: 'a.plant_id',
    departmentColumn: 'a.department_id',
    departmentLabel: `COALESCE(${nonBlank('d.code')}, ${nonBlank('d.name')}, 'Unassigned')`,
    statusColumn: 'a.status',
    statusAliases: {
      open: ['planned'],
      pending: ['planned', 'pending'],
      wip: ['in_progress'],
      'in progress': ['in_progress'],
      close: ['completed'],
      closed: ['completed'],
      done: ['completed'],
    },
    baseConditions: ['a.deleted_at IS NULL'],
    groups: {
      status: "COALESCE(NULLIF(LOWER(a.status), ''), 'unknown')",
      riskRating: `COALESCE(${nonBlank('a.risk_rating')}, 'Not specified')`,
      auditor: `COALESCE(${nonBlank('a.auditors')}, 'Not specified')`,
      month: "DATE_FORMAT(a.scheduled_date, '%Y-%m')",
      year: 'CAST(YEAR(a.scheduled_date) AS CHAR)',
      area: `COALESCE(${nonBlank('a.title')}, 'Not specified')`,
      frequency: `COALESCE(${nonBlank('a.frequency')}, 'Not specified')`,
    },
    metrics: { count: 'COUNT(*)' },
    defaultGroup: 'status',
    defaultMetric: 'count',
  },
};

const statusValues = (value, aliases) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (aliases?.[normalized]) return aliases[normalized];
  return ({
    open: ['open', 'reported', 'submitted', 'scheduled'],
    pending: ['draft', 'pending', 'planned'],
    'in progress': ['in_progress', 'under_review', 'under_investigation', 'corrective_action', 'wip'],
    closed: ['closed', 'resolved', 'completed', 'verified', 'approved', 'done'],
    close: ['closed', 'resolved', 'completed', 'verified', 'approved', 'done'],
    cancelled: ['cancelled'],
  })[normalized] || [normalized.replaceAll(' ', '_')];
};

const addInFilter = (clauses, replacements, column, values, prefix) => {
  const placeholders = values.map((value, index) => {
    replacements[`${prefix}${index}`] = value;
    return `:${prefix}${index}`;
  });
  clauses.push(`LOWER(${column}) IN (${placeholders.join(', ')})`);
};

const buildFilters = (config, query) => {
  const clauses = [...config.baseConditions];
  const replacements = {};
  if (query.plantId && query.plantId !== 'All') {
    clauses.push(`${config.plantColumn} = :plantId`);
    replacements.plantId = query.plantId;
  }
  if (query.department && query.department !== 'All' && config.departmentColumn) {
    clauses.push(`(
      ${config.departmentColumn} = :department
      OR ${config.departmentColumn} = (SELECT department_match.id FROM departments department_match
        WHERE LOWER(department_match.code) = LOWER(:department)
          OR LOWER(department_match.name) = LOWER(:department) LIMIT 1)
      OR LOWER(${config.departmentLabel}) = LOWER(:department)
    )`);
    replacements.department = query.department;
  }
  if (query.location && query.location !== 'All' && config.locationLabel) {
    clauses.push(`LOWER(${config.locationLabel}) = LOWER(:location)`);
    replacements.location = query.location;
  }
  if (query.status && query.status !== 'All' && config.statusColumn) {
    addInFilter(clauses, replacements, config.statusColumn, statusValues(query.status, config.statusAliases), 'status');
  }
  if (query.severity && query.severity !== 'All' && config.severityColumn) {
    clauses.push(`LOWER(${config.severityColumn}) = LOWER(:severity)`);
    replacements.severity = query.severity;
  }

  const year = query.year && query.year !== 'All' ? Number(query.year) : null;
  if (year) {
    clauses.push(`${config.dateExpression} >= :yearStart AND ${config.dateExpression} < :yearEnd`);
    replacements.yearStart = `${year}-01-01`;
    replacements.yearEnd = `${year + 1}-01-01`;
  }
  if (query.fromDate) {
    clauses.push(`${config.dateExpression} >= :fromDate`);
    replacements.fromDate = query.fromDate;
  }
  if (query.toDate) {
    clauses.push(`${config.dateExpression} < DATE_ADD(:toDate, INTERVAL 1 DAY)`);
    replacements.toDate = query.toDate;
  }
  return { clauses, replacements };
};

const titleCase = (value) => String(value || '')
  .replaceAll('_', ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .replace(/\b\w/g, (character) => character.toUpperCase());

const labelFor = (dataset, groupBy, value) => {
  const raw = String(value ?? '').trim();
  if (!raw || UUID_PATTERN.test(raw)) return 'Unassigned';
  if (groupBy === 'month' && /^\d{4}-\d{2}$/.test(raw)) {
    const [year, month] = raw.split('-').map(Number);
    return `${MONTH_NAMES[month - 1] || month} ${year}`;
  }
  if (groupBy === 'year') return raw;
  if (groupBy === 'hazardType') {
    const normalized = raw.toLowerCase();
    if (normalized === 'act' || normalized === 'unsafe act') return 'Unsafe Act';
    if (normalized === 'condition' || normalized === 'unsafe condition') return 'Unsafe Condition';
  }
  if (groupBy === 'category' && (dataset === 'incidents' || dataset === 'fire')) {
    return ({
      first_aid: 'First Aid',
      mtc: 'MTC',
      rwc: 'RWC',
      lti: 'LTI',
      fatality: 'Fatality',
      fire: 'Fire',
      minor_fire: 'Minor Fire',
      major_fire: 'Major Fire',
    })[raw.toLowerCase()] || titleCase(raw);
  }
  if (groupBy === 'category') return titleCase(raw);
  if (groupBy === 'status') {
    const status = raw.toLowerCase();
    if (dataset === 'audits') return ({ planned: 'Pending', in_progress: 'WIP', completed: 'Done' })[status] || titleCase(raw);
    if (dataset === 'hazards') {
      return ({
        submitted: 'Open', under_review: 'Pending', closed: 'Closed', resolved: 'Closed', draft: 'Draft',
      })[status] || titleCase(raw);
    }
    if (dataset === 'near-misses') {
      return ({
        submitted: 'Open', under_review: 'Open', closed: 'Closed', draft: 'Draft',
      })[status] || titleCase(raw);
    }
    return ({
      open: 'Open', in_progress: 'In Progress', completed: 'Closed', verified: 'Closed', closed: 'Closed',
    })[status] || titleCase(raw);
  }
  if (groupBy === 'source') {
    return ({
      near_miss: 'Near Miss', hazard: 'Hazard', incident: 'Incident', audit: 'Audit Finding',
    })[raw.toLowerCase()] || titleCase(raw);
  }
  if (['severity', 'riskRating', 'priority', 'trainingType'].includes(groupBy)) return titleCase(raw);
  return raw;
};

const chartTypeFor = (groupBy) => {
  if (groupBy === 'month' || groupBy === 'year') return 'line';
  const distributionGroups = [
    'status', 'category', 'severity', 'riskRating', 'priority',
    'investigationRequired', 'reportedInHazard',
  ];
  if (distributionGroups.includes(groupBy)) return 'donut';
  return 'bar';
};

const unitFor = (metric) => ({
  manhours: 'Hrs', participants: 'Participants', sessions: 'Sessions', count: 'Count',
}[metric] || 'Count');

const cacheKey = (dataset, query) => {
  const sorted = Object.keys(query)
    .sort()
    .reduce((out, key) => ({ ...out, [key]: query[key] }), {});
  const digest = crypto.createHash('sha1').update(JSON.stringify(sorted)).digest('hex').slice(0, 16);
  return `dashboard:analytics:${dataset}:${digest}`;
};

class DashboardAnalyticsService {
  getCatalog() {
    return Object.fromEntries(Object.entries(DATASETS).map(([dataset, config]) => [dataset, {
      dimensions: Object.keys(config.groups),
      metrics: Object.keys(config.metrics),
      defaultGroup: config.defaultGroup,
      defaultMetric: config.defaultMetric,
    }]));
  }

  async aggregate(dataset, query = {}) {
    const config = DATASETS[dataset];
    if (!config) throw ApiError.badRequest(`Unsupported dashboard analytics dataset: ${dataset}`);
    const groupBy = query.groupBy || config.defaultGroup;
    const metric = query.metric || config.defaultMetric;
    const groupExpression = config.groups[groupBy];
    const metricExpression = config.metrics[metric];
    if (!groupExpression) throw ApiError.badRequest(`Unsupported ${dataset} grouping: ${groupBy}`);
    if (!metricExpression) throw ApiError.badRequest(`Unsupported ${dataset} metric: ${metric}`);
    if (query.fromDate && query.toDate && query.fromDate > query.toDate) {
      throw ApiError.badRequest('fromDate must be before or equal to toDate');
    }

    return cacheService.remember(cacheKey(dataset, { ...query, groupBy, metric }), 30, async () => {
      const { clauses, replacements } = buildFilters(config, query);
      const temporal = groupBy === 'month' || groupBy === 'year';
      let defaultLimit = 10;
      if (groupBy === 'month') defaultLimit = 12;
      if (groupBy === 'year') defaultLimit = 20;
      const limit = Math.max(1, Math.min(20, Number(query.limit || defaultLimit)));
      const sql = `SELECT ${groupExpression} label, ${metricExpression} value
        FROM ${config.from}
        ${config.joins || ''}
        WHERE ${clauses.join(' AND ')}
        GROUP BY ${groupExpression}
        ORDER BY ${temporal ? 'label DESC' : 'value DESC'}, label ASC
        LIMIT ${limit}`;
      const rows = await sequelize.query(sql, { replacements, type: QueryTypes.SELECT });
      const merged = new Map();
      rows.forEach((row) => {
        const key = String(row.label ?? 'Unassigned');
        const label = labelFor(dataset, groupBy, key);
        const value = Number(row.value || 0);
        const current = merged.get(label);
        merged.set(label, {
          key: current?.key || key,
          label,
          value: Number(((current?.value || 0) + value).toFixed(2)),
        });
      });
      const data = [...merged.values()];
      data.sort(temporal
        ? (left, right) => left.key.localeCompare(right.key)
        : (left, right) => right.value - left.value || left.label.localeCompare(right.label));
      return {
        dataset,
        groupBy,
        metric,
        chartType: chartTypeFor(groupBy),
        unit: unitFor(metric),
        total: Number(data.reduce((sum, item) => sum + item.value, 0).toFixed(2)),
        data,
      };
    });
  }
}

module.exports = new DashboardAnalyticsService();
