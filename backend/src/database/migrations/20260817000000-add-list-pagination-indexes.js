'use strict';

// Additive indexes for stable, filtered list queries. No data is changed.
module.exports = {
  async up(queryInterface) {
    const indexes = [
      ['incidents', ['created_at', 'id'], 'idx_incidents_created_id'],
      ['incidents', ['status', 'created_at', 'id'], 'idx_incidents_status_created_id'],
      ['near_misses', ['reported_at', 'created_at', 'id'], 'idx_near_misses_reported_created_id'],
      ['near_misses', ['status', 'created_at', 'id'], 'idx_near_misses_status_created_id'],
      ['training_sessions', ['scheduled_date', 'created_at', 'id'], 'idx_training_scheduled_created_id'],
      ['corrective_actions', ['status', 'created_at', 'id'], 'idx_actions_status_created_id'],
      ['corrective_actions', ['due_date', 'created_at', 'id'], 'idx_actions_due_created_id'],
      ['audits', ['scheduled_date', 'created_at', 'id'], 'idx_audits_scheduled_created_id'],
      ['inspections', ['scheduled_date', 'created_at', 'id'], 'idx_inspections_scheduled_created_id'],
    ];
    for (const [table, fields, name] of indexes) {
      try { await queryInterface.addIndex(table, fields, { name }); } catch (error) {
        // Existing deployments may already have an equivalent index. Keep the
        // migration safe and non-destructive in that case.
        if (!/duplicate|exists|too many keys|max 64 keys/i.test(error.message || '')) throw error;
      }
    }
  },
  async down(queryInterface) {
    const indexes = [
      ['incidents', 'idx_incidents_created_id'], ['incidents', 'idx_incidents_status_created_id'],
      ['near_misses', 'idx_near_misses_reported_created_id'], ['near_misses', 'idx_near_misses_status_created_id'],
      ['training_sessions', 'idx_training_scheduled_created_id'], ['corrective_actions', 'idx_actions_status_created_id'],
      ['corrective_actions', 'idx_actions_due_created_id'], ['audits', 'idx_audits_scheduled_created_id'],
      ['inspections', 'idx_inspections_scheduled_created_id'],
    ];
    for (const [table, name] of indexes) {
      try { await queryInterface.removeIndex(table, name); } catch (error) {
        if (!/doesn't exist|unknown|not found/i.test(error.message || '')) throw error;
      }
    }
  },
};
