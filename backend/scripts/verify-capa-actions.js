'use strict';

require('dotenv').config();
const assert = require('assert');
const crypto = require('crypto');
const { Op, QueryTypes } = require('sequelize');
const { sequelize } = require('../src/database/connection');
const CorrectiveAction = require('../src/modules/actions/corrective-action.model');
const {
  backfillAll,
  synchronizeRecord,
  synchronizeSource,
} = require('../src/modules/actions/capa-sync.service');

const main = async () => {
  const dryRun = await backfillAll({ dryRun: true });
  assert.strictEqual(dryRun.totals.created, 0, 'Backfill is not idempotent: new rows would be created.');
  assert.strictEqual(dryRun.totals.updated, 0, 'Backfill is not stable: rows would be updated.');
  assert(dryRun.totals.candidates > 0, 'No actionable source records were found.');

  const [duplicates] = await sequelize.query(`
    SELECT COUNT(*) AS duplicate_groups FROM (
      SELECT source_type, source_id, source_item_key
      FROM corrective_actions
      WHERE deleted_at IS NULL AND source_item_key <> 'legacy'
      GROUP BY source_type, source_id, source_item_key
      HAVING COUNT(*) > 1
    ) duplicate_actions
  `, { type: QueryTypes.SELECT });
  const [duplicateNumbers] = await sequelize.query(`
    SELECT COUNT(*) AS duplicate_groups FROM (
      SELECT capa_number
      FROM corrective_actions
      WHERE deleted_at IS NULL
      GROUP BY capa_number
      HAVING COUNT(*) > 1
    ) duplicate_numbers
  `, { type: QueryTypes.SELECT });
  assert.strictEqual(Number(duplicates.duplicate_groups), 0, 'Duplicate CAPA source links exist.');
  assert.strictEqual(Number(duplicateNumbers.duplicate_groups), 0, 'Duplicate readable CAPA numbers exist.');

  const grouped = await CorrectiveAction.findAll({
    attributes: ['sourceType', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
    where: { sourceItemKey: { [Op.ne]: 'legacy' } },
    group: ['sourceType'],
    raw: true,
  });
  const generatedBySource = Object.fromEntries(grouped.map((row) => [row.sourceType, Number(row.count)]));
  assert.strictEqual(generatedBySource.hazard || 0, dryRun.bySource.hazards.candidates);
  assert.strictEqual(generatedBySource.near_miss || 0, dryRun.bySource.nearMisses.candidates);
  assert.strictEqual(generatedBySource.incident || 0, dryRun.bySource.incidentInvestigations.candidates);
  assert.strictEqual(generatedBySource.audit || 0, dryRun.bySource.auditFindings.candidates);

  const orphanQueries = {
    hazard: 'SELECT COUNT(*) AS count FROM corrective_actions c LEFT JOIN hazards h ON h.id = c.source_id AND h.deleted_at IS NULL WHERE c.deleted_at IS NULL AND c.source_type = \'hazard\' AND c.source_item_key <> \'legacy\' AND h.id IS NULL',
    near_miss: 'SELECT COUNT(*) AS count FROM corrective_actions c LEFT JOIN near_misses n ON n.id = c.source_id AND n.deleted_at IS NULL WHERE c.deleted_at IS NULL AND c.source_type = \'near_miss\' AND c.source_item_key <> \'legacy\' AND n.id IS NULL',
    incident: 'SELECT COUNT(*) AS count FROM corrective_actions c LEFT JOIN incidents i ON i.id = c.source_id AND i.deleted_at IS NULL WHERE c.deleted_at IS NULL AND c.source_type = \'incident\' AND c.source_item_key <> \'legacy\' AND i.id IS NULL',
    audit: 'SELECT COUNT(*) AS count FROM corrective_actions c LEFT JOIN audits a ON a.id = c.source_id AND a.deleted_at IS NULL LEFT JOIN audit_findings f ON f.id = c.source_item_id AND f.audit_id = a.id WHERE c.deleted_at IS NULL AND c.source_type = \'audit\' AND c.source_item_key <> \'legacy\' AND (a.id IS NULL OR f.id IS NULL)',
  };
  const orphanCounts = {};
  for (const [sourceType, query] of Object.entries(orphanQueries)) {
    const [row] = await sequelize.query(query, { type: QueryTypes.SELECT });
    orphanCounts[sourceType] = Number(row.count);
    assert.strictEqual(orphanCounts[sourceType], 0, `Orphaned ${sourceType} CAPA links exist.`);
  }

  const syncChecks = {};
  for (const sourceType of ['hazard', 'near_miss', 'incident', 'audit']) {
    const sample = await CorrectiveAction.findOne({ where: { sourceType, sourceItemKey: { [Op.ne]: 'legacy' } } });
    assert(sample, `No ${sourceType} CAPA sample exists.`);
    const before = await CorrectiveAction.count({ where: { sourceType, sourceId: sample.sourceId } });
    await synchronizeSource(sourceType, sample.sourceId);
    await synchronizeSource(sourceType, sample.sourceId);
    const after = await CorrectiveAction.count({ where: { sourceType, sourceId: sample.sourceId } });
    assert.strictEqual(after, before, `Repeated ${sourceType} synchronization created a duplicate.`);
    syncChecks[sourceType] = { sourceId: sample.sourceId, before, after };
  }

  const legacyActions = await CorrectiveAction.count({ where: { sourceItemKey: 'legacy' } });
  const samplePlant = await CorrectiveAction.findOne({ attributes: ['plantId'] });
  assert(samplePlant?.plantId, 'A plant is required for the transactional synchronization test.');
  const transaction = await sequelize.transaction();
  let transactionalUpdate;
  try {
    const sourceId = crypto.randomUUID();
    const source = {
      id: sourceId,
      plantId: samplePlant.plantId,
      status: 'submitted',
      createdAt: new Date(),
      metadata: { corrective_action: 'Initial transactional verification action' },
    };
    const first = await synchronizeRecord('hazard', source, { transaction });
    source.metadata.corrective_action = 'Updated transactional verification action';
    const second = await synchronizeRecord('hazard', source, { transaction });
    const activeAfterUpdate = await CorrectiveAction.count({
      where: { sourceType: 'hazard', sourceId },
      transaction,
    });
    source.metadata.corrective_action = '';
    const removed = await synchronizeRecord('hazard', source, { transaction });
    const activeAfterRemoval = await CorrectiveAction.count({
      where: { sourceType: 'hazard', sourceId },
      transaction,
    });
    assert.strictEqual(first.created, 1);
    assert.strictEqual(second.updated, 1);
    assert.strictEqual(activeAfterUpdate, 1);
    assert.strictEqual(removed.deactivated, 1);
    assert.strictEqual(activeAfterRemoval, 0);
    transactionalUpdate = { first, second, removed, activeAfterUpdate, activeAfterRemoval };
  } finally {
    await transaction.rollback();
  }
  console.log(JSON.stringify({
    passed: true,
    actionableCandidates: dryRun.totals.candidates,
    generatedBySource,
    legacyActionsPreserved: legacyActions,
    duplicateSourceGroups: Number(duplicates.duplicate_groups),
    duplicateCapaNumbers: Number(duplicateNumbers.duplicate_groups),
    orphanCounts,
    repeatedSynchronization: syncChecks,
    transactionalCreateUpdateRemoval: transactionalUpdate,
  }, null, 2));
};

main()
  .then(() => sequelize.close())
  .catch(async (error) => {
    console.error(error.stack || error.message);
    await sequelize.close();
    process.exitCode = 1;
  });
