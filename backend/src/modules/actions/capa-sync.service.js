'use strict';

const crypto = require('crypto');
const { Op, fn, col, where: sqlWhere } = require('sequelize');
const { sequelize } = require('../../database/connection');
const Hazard = require('../hazards/hazard.model');
const NearMiss = require('../incidents/near-miss.model');
const Incident = require('../incidents/incident.model');
const HseAudit = require('../audits/audit.model');
const AuditFinding = require('../audits/audit-finding.model');
const CorrectiveAction = require('./corrective-action.model');
const Department = require('../hse-foundation/department.model');
const logger = require('../../shared/utils/logger');

const SOURCE_TYPES = Object.freeze({
  HAZARD: 'hazard',
  NEAR_MISS: 'near_miss',
  INCIDENT: 'incident',
  AUDIT: 'audit',
});

const text = (value) => String(value ?? '').trim();
const lower = (value) => text(value).toLowerCase();
const isUuid = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(text(value));
const dateOnly = (value) => {
  const match = text(value).match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
};
const priority = (value) => {
  const normalized = lower(value);
  return ['low', 'medium', 'high', 'critical'].includes(normalized) ? normalized : null;
};
const completedStatus = (value) => ['close', 'closed', 'complete', 'completed', 'done', 'resolved', 'verified'].includes(lower(value));
const progressStatus = (value) => ['pending', 'in progress', 'in_progress', 'wip', 'under_review', 'under_investigation', 'corrective_action', 'overdue'].includes(lower(value));
const capaStatus = (value) => (completedStatus(value) ? 'completed' : progressStatus(value) ? 'in_progress' : 'open');
const metadataFor = (record) => record?.metadata && typeof record.metadata === 'object' ? record.metadata : {};
const plain = (record) => typeof record?.get === 'function' ? record.get({ plain: true }) : record;
const DEPARTMENT_ALIASES = Object.freeze({ prj: 'projects', store: 'stores' });

const readableNumber = (sourceType, sourceId, sourceItemKey, year) => {
  const digest = crypto.createHash('sha256').update(`${sourceType}:${sourceId}:${sourceItemKey}`).digest('hex').slice(0, 12).toUpperCase();
  return `CAPA-${year || new Date().getFullYear()}-${digest}`;
};

const sourceReference = (prefix, record, metadata = {}) => (
  text(metadata.reference_number || metadata.reference_no || metadata.s_no || metadata.serial_number)
  || text(record.incidentNumber || record.auditNumber)
  || `${prefix}-${text(record.id).slice(0, 8).toUpperCase()}`
);

const departmentCache = new Map();
const resolveDepartmentId = async (values, transaction) => {
  for (const raw of values) {
    const value = typeof raw === 'object' && raw ? (raw.id || raw.code || raw.name) : raw;
    const normalized = DEPARTMENT_ALIASES[lower(value)] || lower(value);
    if (!normalized) continue;
    if (departmentCache.has(normalized)) {
      const cached = departmentCache.get(normalized);
      if (cached) return cached;
      continue;
    }
    const department = isUuid(value)
      ? await Department.findByPk(value, { attributes: ['id'], transaction })
      : await Department.findOne({
        where: {
          [Op.or]: [
            sqlWhere(fn('LOWER', col('code')), normalized),
            sqlWhere(fn('LOWER', col('name')), normalized),
          ],
        },
        attributes: ['id'],
        transaction,
      });
    departmentCache.set(normalized, department?.id || null);
    if (department?.id) return department.id;
  }
  return null;
};

const commonCandidate = (record, values) => ({
  sourceType: values.sourceType,
  sourceId: record.id,
  sourceItemId: values.sourceItemId || null,
  sourceItemKey: values.sourceItemKey,
  sourceReference: values.sourceReference,
  incidentCategory: values.incidentCategory,
  plantId: record.plantId,
  title: values.title,
  description: values.description,
  responsibleDepartmentId: values.responsibleDepartmentId || null,
  responsibility: values.responsibility || null,
  assignedTo: null,
  assignedBy: null,
  dueDate: values.dueDate || null,
  status: values.status || 'open',
  priority: values.priority || null,
  completedAt: values.status === 'completed' ? (record.closedAt || record.completedDate || null) : null,
  completedBy: null,
  verifiedAt: null,
  verifiedBy: null,
  verificationNotes: null,
  lastSyncedAt: new Date(),
});

const buildHazardCandidates = async (input, transaction) => {
  const record = plain(input);
  const metadata = metadataFor(record);
  const action = text(metadata.corrective_action);
  if (!action) return [];
  const responsibleDepartmentId = await resolveDepartmentId([
    metadata.responsible_department_id,
    metadata.responsible_department,
  ], transaction);
  const reference = sourceReference('HAZ', record, metadata);
  return [commonCandidate(record, {
    sourceType: SOURCE_TYPES.HAZARD,
    sourceItemKey: 'corrective-action',
    sourceReference: reference,
    incidentCategory: 'Hazard',
    title: `Hazard action - ${reference}`,
    description: action,
    responsibleDepartmentId,
    responsibility: text(metadata.responsible_person),
    dueDate: dateOnly(metadata.target_date),
    priority: priority(metadata.risk_rating_id || record.severityLevel),
    status: capaStatus(record.status),
  })];
};

const buildNearMissCandidates = async (input, transaction) => {
  const record = plain(input);
  const metadata = metadataFor(record);
  const action = text(record.immediateAction || metadata.preventive_action);
  if (!action) return [];
  const sourceResponsibility = text(metadata.responsible_department || metadata.resp);
  const responsibleDepartmentId = await resolveDepartmentId([
    record.responsibleDepartmentId,
    metadata.responsible_department_id,
    sourceResponsibility,
  ], transaction);
  const reference = sourceReference('NM', record, metadata);
  return [commonCandidate(record, {
    sourceType: SOURCE_TYPES.NEAR_MISS,
    sourceItemKey: 'preventive-action',
    sourceReference: reference,
    incidentCategory: 'Near Miss',
    title: `Near Miss action - ${reference}`,
    description: action,
    responsibleDepartmentId,
    responsibility: responsibleDepartmentId ? null : sourceResponsibility,
    dueDate: null,
    priority: null,
    status: capaStatus(record.status),
  })];
};

const buildIncidentCandidates = async (input, transaction) => {
  const record = plain(input);
  // CAPA v1 integrates the Incident Investigation workflow only. Generic
  // lagging incidents remain available for a later, confirmed business rule.
  if (!record.sourceNearMissId && !record.sourceHazardId) return [];
  const metadata = metadataFor(record);
  const action = text(metadata.preventive_action_safety_measures);
  if (!action) return [];
  const responsibility = text(metadata.responsibility || metadata.capa_responsibility);
  const responsibleDepartmentId = await resolveDepartmentId([
    metadata.responsible_department_id,
    responsibility,
  ], transaction);
  const reference = sourceReference('INC', record, metadata);
  const completionState = metadata.completion_status || metadata.capa_completion_status || record.status;
  return [commonCandidate(record, {
    sourceType: SOURCE_TYPES.INCIDENT,
    sourceItemKey: 'preventive-action',
    sourceReference: reference,
    incidentCategory: 'Incident',
    title: `Incident Investigation action - ${reference}`,
    description: action,
    responsibleDepartmentId,
    responsibility,
    dueDate: dateOnly(metadata.target_date || metadata.capa_target_date || metadata.timeline),
    priority: null,
    status: capaStatus(completionState),
  })];
};

const buildAuditCandidates = async (input, transaction) => {
  const record = plain(input);
  const findings = record.findings || await AuditFinding.findAll({ where: { auditId: record.id }, transaction });
  const reference = sourceReference('AUD', record);
  const candidates = [];
  for (const rawFinding of findings) {
    const finding = plain(rawFinding);
    const action = text(finding.recommendation);
    if (!action) continue;
    const responsibleDepartmentId = await resolveDepartmentId([finding.responsibleDepartmentId], transaction);
    candidates.push(commonCandidate(record, {
      sourceType: SOURCE_TYPES.AUDIT,
      sourceItemId: finding.id,
      sourceItemKey: `finding:${finding.id}`,
      sourceReference: reference,
      incidentCategory: 'Audit Finding',
      title: `Audit finding action - ${reference}`,
      description: action,
      responsibleDepartmentId,
      responsibility: text(finding.responsibility),
      dueDate: dateOnly(finding.targetDate),
      priority: priority(finding.severityLevel),
      status: capaStatus(finding.status),
    }));
  }
  return candidates;
};

const BUILDERS = {
  [SOURCE_TYPES.HAZARD]: buildHazardCandidates,
  [SOURCE_TYPES.NEAR_MISS]: buildNearMissCandidates,
  [SOURCE_TYPES.INCIDENT]: buildIncidentCandidates,
  [SOURCE_TYPES.AUDIT]: buildAuditCandidates,
};

const loadSource = async (sourceType, sourceId, transaction) => {
  const options = { where: { id: sourceId }, transaction };
  if (sourceType === SOURCE_TYPES.HAZARD) return Hazard.findOne(options);
  if (sourceType === SOURCE_TYPES.NEAR_MISS) return NearMiss.findOne(options);
  if (sourceType === SOURCE_TYPES.INCIDENT) return Incident.findOne(options);
  if (sourceType === SOURCE_TYPES.AUDIT) return HseAudit.findOne(options);
  return null;
};

const comparable = (value) => {
  if (value instanceof Date) return value.toISOString();
  return value == null ? null : String(value);
};

const synchronizeRecord = async (sourceType, input, options = {}) => {
  const { transaction, dryRun = false } = options;
  const record = plain(input);
  const builder = BUILDERS[sourceType];
  if (!builder || !record?.id) return { candidates: 0, created: 0, updated: 0, unchanged: 0, deactivated: 0 };
  const candidates = await builder(record, transaction);
  const stats = { candidates: candidates.length, created: 0, updated: 0, unchanged: 0, deactivated: 0 };
  const activeKeys = new Set(candidates.map((candidate) => candidate.sourceItemKey));

  for (const candidate of candidates) {
    const identity = { sourceType, sourceId: record.id, sourceItemKey: candidate.sourceItemKey };
    let existing = await CorrectiveAction.findOne({ where: identity, paranoid: false, transaction });
    const year = String(record.reportedAt || record.incidentDate || record.scheduledDate || record.createdAt || '').slice(0, 4);
    const values = {
      ...candidate,
      capaNumber: existing?.capaNumber || readableNumber(sourceType, record.id, candidate.sourceItemKey, /^\d{4}$/.test(year) ? year : null),
    };
    if (!existing) {
      stats.created += 1;
      if (!dryRun) {
        try {
          existing = await CorrectiveAction.create(values, { transaction });
        } catch (error) {
          if (error.name !== 'SequelizeUniqueConstraintError') throw error;
          existing = await CorrectiveAction.findOne({ where: identity, paranoid: false, transaction });
          if (!existing) throw error;
          await existing.restore({ transaction });
          await existing.update(values, { transaction });
        }
      }
      continue;
    }

    const keys = Object.keys(values).filter((key) => key !== 'lastSyncedAt');
    const changed = Boolean(existing.deletedAt) || keys.some((key) => comparable(existing.get(key)) !== comparable(values[key]));
    if (!changed) {
      stats.unchanged += 1;
      if (!dryRun) await existing.update({ lastSyncedAt: values.lastSyncedAt }, { transaction });
      continue;
    }
    stats.updated += 1;
    if (!dryRun) {
      if (existing.deletedAt) await existing.restore({ transaction });
      await existing.update(values, { transaction });
    }
  }

  const existingGenerated = await CorrectiveAction.findAll({
    where: {
      sourceType,
      sourceId: record.id,
      sourceItemKey: { [Op.ne]: 'legacy' },
    },
    paranoid: false,
    transaction,
  });
  for (const existing of existingGenerated) {
    if (activeKeys.has(existing.sourceItemKey) || existing.deletedAt) continue;
    stats.deactivated += 1;
    if (!dryRun) await existing.destroy({ transaction });
  }
  return stats;
};

const synchronizeSource = async (sourceType, sourceId) => sequelize.transaction(async (transaction) => {
  const source = await loadSource(sourceType, sourceId, transaction);
  if (!source) {
    const where = {
      sourceType,
      sourceId,
      sourceItemKey: { [Op.ne]: 'legacy' },
    };
    const deactivated = await CorrectiveAction.count({ where, transaction });
    if (deactivated) await CorrectiveAction.destroy({ where, transaction });
    return { candidates: 0, created: 0, updated: 0, unchanged: 0, deactivated };
  }
  return synchronizeRecord(sourceType, source, { transaction });
});

const syncBestEffort = async (sourceType, sourceId) => {
  try {
    return await synchronizeSource(sourceType, sourceId);
  } catch (error) {
    logger.error(`CAPA synchronization failed for ${sourceType}:${sourceId}: ${error.message}`, { stack: error.stack });
    return null;
  }
};

const addStats = (target, delta) => {
  for (const key of ['candidates', 'created', 'updated', 'unchanged', 'deactivated']) target[key] += delta[key] || 0;
};

const backfillAll = async ({ dryRun = true } = {}) => {
  const run = async (transaction) => {
    departmentCache.clear();
    const sources = {
      hazards: { type: SOURCE_TYPES.HAZARD, rows: await Hazard.findAll({ transaction }) },
      nearMisses: { type: SOURCE_TYPES.NEAR_MISS, rows: await NearMiss.findAll({ transaction }) },
      incidentInvestigations: {
        type: SOURCE_TYPES.INCIDENT,
        rows: await Incident.findAll({
          where: {
            [Op.or]: [
              { sourceNearMissId: { [Op.ne]: null } },
              { sourceHazardId: { [Op.ne]: null } },
            ],
          },
          transaction,
        }),
      },
      auditFindings: { type: SOURCE_TYPES.AUDIT, rows: await HseAudit.findAll({ transaction }) },
    };
    const result = { dryRun, totals: { candidates: 0, created: 0, updated: 0, unchanged: 0, deactivated: 0 }, bySource: {} };
    for (const [name, source] of Object.entries(sources)) {
      const stats = { candidates: 0, created: 0, updated: 0, unchanged: 0, deactivated: 0 };
      for (const row of source.rows) addStats(stats, await synchronizeRecord(source.type, row, { transaction, dryRun }));

      // A source record can be permanently removed after it generated CAPA.
      // Those generated actions must not remain active forever. Legacy CAPA
      // imports deliberately use source_item_key = "legacy" and are excluded.
      const sourceIds = source.rows.map((row) => row.id);
      const orphanWhere = {
        sourceType: source.type,
        sourceItemKey: { [Op.ne]: 'legacy' },
        ...(sourceIds.length ? { sourceId: { [Op.notIn]: sourceIds } } : {}),
      };
      const orphanedGenerated = await CorrectiveAction.count({ where: orphanWhere, transaction });
      stats.deactivated += orphanedGenerated;
      if (!dryRun && orphanedGenerated) {
        await CorrectiveAction.destroy({ where: orphanWhere, transaction });
      }

      result.bySource[name] = stats;
      addStats(result.totals, stats);
    }
    return result;
  };
  return dryRun ? run(null) : sequelize.transaction(run);
};

module.exports = {
  SOURCE_TYPES,
  synchronizeRecord,
  synchronizeSource,
  syncBestEffort,
  backfillAll,
};
