'use strict';

const { QueryTypes, Op } = require('sequelize');
const { sequelize } = require('../../database/connection');
const { Hazard, NearMiss, Incident, MasterAnalysis } = require('../../database/models');
const ApiError = require('../../shared/utils/ApiError');

const SOURCE_TABLES = {
  'Hazard Reporting': { key: 'hazard', label: 'Hazard Reporting', model: Hazard, table: 'hazards', date: 'reported_at', status: 'status' },
  'Near Miss': { key: 'near_miss', label: 'Near Miss', model: NearMiss, table: 'near_misses', date: 'reported_at', status: 'status' },
  'Incident Log': { key: 'incident', label: 'Incident Log', model: Incident, table: 'incidents', date: 'incident_date', status: 'status' },
};
const SOURCE_KEYS = Object.fromEntries(Object.entries(SOURCE_TABLES).map(([label, value]) => [value.key, { ...value, label }]));
const STATUS_VALUES = ['not_reviewed', 'under_review', 'completed'];

const clean = (value) => (value === undefined || value === null || value === '' || value === 'All' ? null : String(value).trim());
const parsePage = (value, fallback, max) => Math.min(max, Math.max(1, Number.parseInt(value, 10) || fallback));
const parseFilters = (query = {}) => ({
  search: clean(query.search),
  reportType: clean(query.reportType),
  analysisStatus: clean(query.analysisStatus),
  department: clean(query.department),
  year: clean(query.year),
  fromDate: clean(query.fromDate),
  toDate: clean(query.toDate),
});

const unionSql = Object.values(SOURCE_TABLES).map((source) => `
  SELECT
    CONVERT(CONCAT('${source.key}:', CAST(s.id AS CHAR)) USING utf8mb4) COLLATE utf8mb4_unicode_ci AS analysis_key,
    CONVERT('${source.key}' USING utf8mb4) COLLATE utf8mb4_unicode_ci AS source_type,
    s.id AS source_id,
    CONVERT('${source.label}' USING utf8mb4) COLLATE utf8mb4_unicode_ci AS report_type,
    CONVERT(COALESCE(CAST(s.reported_by AS CHAR), '') USING utf8mb4) COLLATE utf8mb4_unicode_ci AS reported_by,
    s.department_id AS department_id,
    CONVERT(COALESCE(d.name, CAST(s.department_id AS CHAR), '—') USING utf8mb4) COLLATE utf8mb4_unicode_ci AS department,
    CONVERT(COALESCE(s.location, '—') USING utf8mb4) COLLATE utf8mb4_unicode_ci AS location,
    s.${source.date} AS report_date,
    CONVERT(COALESCE(s.title, LEFT(s.description, 120), '${source.label}') USING utf8mb4) COLLATE utf8mb4_unicode_ci AS title,
    CONVERT(COALESCE(s.description, '') USING utf8mb4) COLLATE utf8mb4_unicode_ci AS description,
    CONVERT(COALESCE(s.${source.status}, '') USING utf8mb4) COLLATE utf8mb4_unicode_ci AS original_status,
    CONVERT(COALESCE(ma.analysis_status, 'not_reviewed') USING utf8mb4) COLLATE utf8mb4_unicode_ci AS analysis_status,
    COALESCE(ma.analysis_data, JSON_OBJECT()) AS analysis_data,
    JSON_MERGE_PATCH(JSON_OBJECT('id', s.id, 'title', s.title, 'description', s.description, 'location', s.location, 'status', s.${source.status}, 'departmentId', s.department_id), COALESCE(s.metadata, JSON_OBJECT())) AS original_data,
    s.created_at AS source_created_at
  FROM ${source.table} s
  LEFT JOIN departments d ON d.id = s.department_id
  LEFT JOIN master_analyses ma ON ma.source_type = '${source.key}' AND ma.source_id = s.id AND ma.deleted_at IS NULL
  WHERE s.deleted_at IS NULL`).join('\nUNION ALL\n');

const buildWhere = (filters, replacements) => {
  const clauses = [];
  if (filters.reportType && SOURCE_TABLES[filters.reportType]) {
    replacements.reportType = SOURCE_TABLES[filters.reportType].key;
    clauses.push('source_type = :reportType');
  }
  if (filters.analysisStatus && STATUS_VALUES.includes(filters.analysisStatus)) {
    replacements.analysisStatus = filters.analysisStatus;
    clauses.push('analysis_status = :analysisStatus');
  }
  if (filters.search) {
    replacements.search = `%${filters.search}%`;
    clauses.push('(analysis_key LIKE :search OR title LIKE :search OR description LIKE :search OR reported_by LIKE :search OR department LIKE :search OR location LIKE :search)');
  }
  if (filters.department) { replacements.department = filters.department; clauses.push('(department = :department OR department_id = :department)'); }
  if (filters.year && /^\d{4}$/.test(filters.year)) { replacements.yearStart = `${filters.year}-01-01`; replacements.yearEnd = `${filters.year}-12-31`; clauses.push('report_date >= :yearStart AND report_date <= :yearEnd'); }
  if (filters.fromDate) { replacements.fromDate = filters.fromDate; clauses.push('report_date >= :fromDate'); }
  if (filters.toDate) { replacements.toDate = filters.toDate; clauses.push('report_date <= :toDate'); }
  return clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
};

const parseStatus = (value) => {
  const normalized = String(value || '').trim().toLowerCase().replaceAll(' ', '_');
  if (!STATUS_VALUES.includes(normalized)) throw ApiError.badRequest('Invalid analysis status', [{ field: 'analysisStatus', message: `Allowed values: ${STATUS_VALUES.join(', ')}` }]);
  return normalized;
};
const sourceFromKey = (key) => {
  const separator = String(key || '').indexOf(':');
  const source = SOURCE_KEYS[String(key).slice(0, separator)];
  const id = String(key).slice(separator + 1);
  if (!source || !/^[0-9a-f-]{36}$/i.test(id)) throw ApiError.badRequest('Invalid master analysis record key');
  return { ...source, id };
};

const list = async (query = {}) => {
  const filters = parseFilters(query);
  const page = parsePage(query.page, 1, 100000);
  const limit = parsePage(query.limit, 10, 100);
  const replacements = { limit, offset: (page - 1) * limit };
  const where = buildWhere(filters, replacements);
  const base = `WITH unified AS (${unionSql}) SELECT * FROM unified ${where}`;
  const [rows, countRows, summaryRows] = await Promise.all([
    sequelize.query(`${base} ORDER BY report_date DESC, source_created_at DESC, source_id DESC LIMIT :limit OFFSET :offset`, { replacements, type: QueryTypes.SELECT }),
    sequelize.query(`WITH unified AS (${unionSql}) SELECT COUNT(*) AS total FROM unified ${where}`, { replacements, type: QueryTypes.SELECT }),
    sequelize.query(`WITH unified AS (${unionSql}) SELECT COUNT(*) AS total, SUM(analysis_status = 'not_reviewed') AS not_reviewed, SUM(analysis_status = 'under_review') AS under_review, SUM(analysis_status = 'completed') AS completed FROM unified ${where}`, { replacements, type: QueryTypes.SELECT }),
  ]);
  const total = Number(countRows[0]?.total || 0);
  return {
    records: rows,
    summary: { totalReports: Number(summaryRows[0]?.total || 0), notReviewed: Number(summaryRows[0]?.not_reviewed || 0), underReview: Number(summaryRows[0]?.under_review || 0), completed: Number(summaryRows[0]?.completed || 0) },
    meta: { currentPage: page, pageSize: limit, totalRecords: total, totalPages: Math.ceil(total / limit) },
  };
};

const get = async (key) => {
  const source = sourceFromKey(key);
  const replacements = { sourceType: source.key, sourceId: source.id };
  const [rows] = await sequelize.query(`WITH unified AS (${unionSql}) SELECT * FROM unified WHERE source_type = :sourceType AND source_id = :sourceId LIMIT 1`, { replacements, type: QueryTypes.SELECT });
  if (!rows) throw ApiError.notFound('Source report not found');
  return rows;
};

const save = async (key, body, userId) => {
  const source = sourceFromKey(key);
  const status = parseStatus(body.analysisStatus);
  const analysisData = body.analysisData && typeof body.analysisData === 'object' && !Array.isArray(body.analysisData) ? body.analysisData : {};
  const transaction = await sequelize.transaction();
  try {
    const sourceRecord = await source.model.findByPk(source.id, { transaction, attributes: ['id'] });
    if (!sourceRecord) throw ApiError.notFound('Source report not found');
    await MasterAnalysis.upsert({ sourceType: source.key, sourceId: source.id, analysisStatus: status, analysisData, updatedBy: userId, createdBy: userId }, { transaction });
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
  return get(key);
};

module.exports = { list, get, save };
