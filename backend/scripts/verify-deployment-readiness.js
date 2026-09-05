require('dotenv').config();

const assert = require('assert');
const crypto = require('crypto');
const { QueryTypes } = require('sequelize');
const { sequelize } = require('../src/database/connection');
const {
  User,
  Plant,
  Department,
  Hazard,
  NearMiss,
  Incident,
  CorrectiveAction,
} = require('../src/database/models');
const overviewService = require('../src/modules/core/overview.service');
const {
  ensureNearMissInvestigation,
  ensureHazardInvestigation,
} = require('../src/modules/incidents/investigation-sync.service');
const { synchronizeRecord } = require('../src/modules/actions/capa-sync.service');

const rows = (sql, replacements = {}) => sequelize.query(sql, {
  type: QueryTypes.SELECT,
  replacements,
});

const scalar = async (sql, replacements = {}) => {
  const [row] = await rows(sql, replacements);
  return Number(row?.value || 0);
};

const verifyInvestigationIdempotency = async () => {
  const transaction = await sequelize.transaction();
  try {
    const user = await User.findOne({ transaction });
    const plant = await Plant.findOne({ transaction });
    const department = await Department.findOne({ where: { isActive: true }, transaction });
    assert(user && plant && department, 'User, plant, and active department seed data are required.');

    const common = {
      reportedBy: user.id,
      plantId: plant.id,
      departmentId: department.id,
      severityLevel: 'medium',
      reportedAt: new Date(),
      createdBy: user.id,
    };
    const nearMiss = await NearMiss.create({
      ...common,
      title: 'Deployment verification near miss',
      description: 'Transactional record; always rolled back.',
      status: 'submitted',
      furtherInvestigationRequired: true,
    }, { transaction });
    const nearMissFirst = await ensureNearMissInvestigation(nearMiss, user.id, transaction);
    const nearMissSecond = await ensureNearMissInvestigation(nearMiss, user.id, transaction);
    const nearMissCount = await Incident.count({
      where: { sourceNearMissId: nearMiss.id },
      transaction,
    });

    const hazard = await Hazard.create({
      ...common,
      category: 'physical',
      title: 'Deployment verification hazard',
      description: 'Transactional record; always rolled back.',
      actionTaken: 'Transactional preventive action for CAPA verification.',
      status: 'submitted',
      furtherInvestigationRequired: true,
    }, { transaction });
    const hazardFirst = await ensureHazardInvestigation(hazard, user.id, transaction);
    const hazardSecond = await ensureHazardInvestigation(hazard, user.id, transaction);
    const hazardCount = await Incident.count({ where: { sourceHazardId: hazard.id }, transaction });
    await synchronizeRecord('incident', hazardFirst, { transaction });
    await synchronizeRecord('incident', hazardFirst, { transaction });
    const hazardInvestigationCapaCount = await CorrectiveAction.count({
      where: {
        sourceType: 'incident',
        sourceId: hazardFirst.id,
        sourceItemKey: 'preventive-action',
      },
      transaction,
    });

    const noInvestigationHazard = await Hazard.create({
      ...common,
      category: 'physical',
      title: 'Deployment verification no-investigation hazard',
      description: 'Transactional record; always rolled back.',
      status: 'submitted',
      furtherInvestigationRequired: false,
    }, { transaction });
    const noInvestigation = await ensureHazardInvestigation(
      noInvestigationHazard,
      user.id,
      transaction,
    );

    assert.strictEqual(nearMissCount, 1, 'Near Miss generated more than one investigation.');
    assert.strictEqual(nearMissFirst.id, nearMissSecond.id, 'Near Miss synchronization did not reuse its investigation.');
    assert.strictEqual(hazardCount, 1, 'Hazard generated more than one investigation.');
    assert.strictEqual(hazardFirst.id, hazardSecond.id, 'Hazard synchronization did not reuse its investigation.');
    assert.strictEqual(
      hazardInvestigationCapaCount,
      1,
      'Hazard-generated investigation did not synchronize exactly one CAPA action.',
    );
    assert.strictEqual(noInvestigation, null, 'Hazard with Further Investigation = No generated an investigation.');

    return {
      nearMiss: { firstId: nearMissFirst.id, secondId: nearMissSecond.id, count: nearMissCount },
      hazard: {
        firstId: hazardFirst.id,
        secondId: hazardSecond.id,
        count: hazardCount,
        capaCount: hazardInvestigationCapaCount,
      },
      hazardWithNoFurtherInvestigation: 'not created',
    };
  } finally {
    await transaction.rollback();
  }
};

const main = async () => {
  await sequelize.authenticate();

  const overview = await overviewService.dashboard({ verificationNonce: crypto.randomUUID() });
  const database = {
    hazards: await scalar('SELECT COUNT(*) value FROM hazards WHERE deleted_at IS NULL'),
    incidents: await scalar(
      'SELECT COUNT(*) value FROM incidents WHERE deleted_at IS NULL '
      + 'AND source_near_miss_id IS NULL AND source_hazard_id IS NULL',
    ),
    nearMisses: await scalar('SELECT COUNT(*) value FROM near_misses WHERE deleted_at IS NULL'),
    trainingSessions: await scalar("SELECT COUNT(*) value FROM training_sessions WHERE deleted_at IS NULL AND status <> 'draft'"),
    trainingParticipants: await scalar(
      'SELECT COALESCE(SUM(participant_count), 0) value FROM training_sessions '
      + "WHERE deleted_at IS NULL AND status <> 'draft'",
    ),
    trainingManhours: await scalar(
      'SELECT COALESCE(SUM(COALESCE(manhours, participant_count * '
      + 'duration_minutes / 60, 0)), 0) value FROM training_sessions '
      + "WHERE deleted_at IS NULL AND status <> 'draft'",
    ),
    audits: await scalar('SELECT COUNT(*) value FROM audits WHERE deleted_at IS NULL'),
    manualAudits: await scalar("SELECT COUNT(*) value FROM audits WHERE deleted_at IS NULL AND source = 'manual'"),
    scheduledAudits: await scalar('SELECT COUNT(*) value FROM audits WHERE deleted_at IS NULL AND critical_audit_plan_id IS NOT NULL'),
    criticalAuditPlans: await scalar('SELECT COUNT(*) value FROM critical_audit_plans WHERE deleted_at IS NULL'),
    capaActions: await scalar('SELECT COUNT(*) value FROM corrective_actions WHERE deleted_at IS NULL'),
    attachments: await scalar('SELECT COUNT(*) value FROM attachments'),
    activeDepartments: await scalar('SELECT COUNT(*) value FROM departments WHERE deleted_at IS NULL AND is_active = 1'),
    activeLocations: await scalar('SELECT COUNT(*) value FROM locations WHERE deleted_at IS NULL AND is_active = 1'),
  };

  assert.strictEqual(overview.summary.hazards.total, database.hazards, 'Dashboard Hazard count differs from the database.');
  assert.strictEqual(overview.summary.incidents.total, database.incidents, 'Dashboard Incident count differs from the canonical database count.');
  assert.strictEqual(overview.summary.training.total, database.trainingSessions, 'Dashboard Training count differs from the database.');
  assert.strictEqual(overview.summary.training.participants, database.trainingParticipants, 'Dashboard participant attendance sum differs from the database.');
  assert(Math.abs(overview.summary.training.manhours - database.trainingManhours) < 0.01, 'Dashboard training manhours differ from the database.');
  assert.strictEqual(overview.summary.assurance.audits, database.audits, 'Dashboard Audit count differs from the database.');

  const duplicateInvestigations = {
    nearMiss: await scalar('SELECT COUNT(*) value FROM (SELECT source_near_miss_id FROM incidents WHERE deleted_at IS NULL AND source_near_miss_id IS NOT NULL GROUP BY source_near_miss_id HAVING COUNT(*) > 1) duplicates'),
    hazard: await scalar('SELECT COUNT(*) value FROM (SELECT source_hazard_id FROM incidents WHERE deleted_at IS NULL AND source_hazard_id IS NOT NULL GROUP BY source_hazard_id HAVING COUNT(*) > 1) duplicates'),
  };
  const duplicateCapaLinks = await scalar("SELECT COUNT(*) value FROM (SELECT source_type, source_id, source_item_key FROM corrective_actions WHERE deleted_at IS NULL AND source_item_key <> 'legacy' GROUP BY source_type, source_id, source_item_key HAVING COUNT(*) > 1) duplicates");
  const capaSourceKeys = await rows(
    'SELECT source_type sourceType, source_item_key sourceItemKey, COUNT(*) count '
    + 'FROM corrective_actions WHERE deleted_at IS NULL '
    + 'GROUP BY source_type, source_item_key ORDER BY source_type, source_item_key',
  );
  const orphanCapaLinks = {
    hazard: await scalar("SELECT COUNT(*) value FROM corrective_actions c LEFT JOIN hazards h ON h.id = c.source_id AND h.deleted_at IS NULL WHERE c.deleted_at IS NULL AND c.source_type = 'hazard' AND c.source_item_key <> 'legacy' AND h.id IS NULL"),
    nearMiss: await scalar("SELECT COUNT(*) value FROM corrective_actions c LEFT JOIN near_misses n ON n.id = c.source_id AND n.deleted_at IS NULL WHERE c.deleted_at IS NULL AND c.source_type = 'near_miss' AND c.source_item_key <> 'legacy' AND n.id IS NULL"),
    incident: await scalar("SELECT COUNT(*) value FROM corrective_actions c LEFT JOIN incidents i ON i.id = c.source_id AND i.deleted_at IS NULL WHERE c.deleted_at IS NULL AND c.source_type = 'incident' AND c.source_item_key <> 'legacy' AND i.id IS NULL"),
    audit: await scalar("SELECT COUNT(*) value FROM corrective_actions c LEFT JOIN audits a ON a.id = c.source_id AND a.deleted_at IS NULL LEFT JOIN audit_findings f ON f.id = c.source_item_id AND f.audit_id = a.id WHERE c.deleted_at IS NULL AND c.source_type = 'audit' AND c.source_item_key <> 'legacy' AND (a.id IS NULL OR f.id IS NULL)"),
  };
  assert.strictEqual(duplicateInvestigations.nearMiss, 0, 'Duplicate Near Miss investigations exist.');
  assert.strictEqual(duplicateInvestigations.hazard, 0, 'Duplicate Hazard investigations exist.');
  assert.strictEqual(duplicateCapaLinks, 0, 'Duplicate CAPA source links exist.');
  Object.entries(orphanCapaLinks).forEach(([source, count]) => {
    assert.strictEqual(count, 0, `Orphaned ${source} CAPA source links exist.`);
  });
  assert(database.activeDepartments > 0, 'No active Departments are available for new-entry dropdowns.');
  assert(database.activeLocations > 0, 'No active Locations are available for new-entry dropdowns.');

  const investigationSynchronization = await verifyInvestigationIdempotency();
  process.stdout.write(`${JSON.stringify({
    verified: true,
    database,
    dashboard: {
      hazards: overview.summary.hazards.total,
      incidents: overview.summary.incidents.total,
      trainingSessions: overview.summary.training.total,
      trainingParticipants: overview.summary.training.participants,
      trainingManhours: overview.summary.training.manhours,
      audits: overview.summary.assurance.audits,
      comparisons: overview.comparisons,
    },
    duplicateInvestigations,
    duplicateCapaLinks,
    orphanCapaLinks,
    capaSourceKeys,
    investigationSynchronization,
  }, null, 2)}\n`);
};

main()
  .then(() => sequelize.close())
  .catch(async (error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    await sequelize.close();
    process.exitCode = 1;
  });
