'use strict';

// The import process previously caused repeated sync/index creation for the
// nullable source_fingerprint column. Remove only redundant indexes; records
// and the canonical uniqueness guarantee are preserved.
module.exports = {
  async up(queryInterface) {
    const indexes = await queryInterface.showIndex('training_sessions');
    const redundant = indexes
      .filter((index) => /^source_fingerprint(?:_\d+)?$/.test(index.name) || index.name === 'training_sessions_source_fingerprint_unique')
      .sort((a, b) => (a.name === 'source_fingerprint' ? -1 : a.name.localeCompare(b.name)));
    // Keep the first unique source_fingerprint index and remove all aliases.
    const keep = redundant.find((index) => index.name === 'training_sessions_source_fingerprint_unique') || redundant.find((index) => index.unique) || redundant[0];
    for (const index of redundant) {
      if (index.name !== keep?.name) await queryInterface.removeIndex('training_sessions', index.name);
    }
    const current = await queryInterface.showIndex('training_sessions');
    if (!current.some((index) => index.name === 'idx_training_department_status_date')) {
      await queryInterface.addIndex('training_sessions', ['department_id', 'status', 'scheduled_date', 'created_at', 'id'], { name: 'idx_training_department_status_date' });
    }
  },
  async down(queryInterface) {
    const indexes = await queryInterface.showIndex('training_sessions');
    if (indexes.some((index) => index.name === 'idx_training_department_status_date')) await queryInterface.removeIndex('training_sessions', 'idx_training_department_status_date');
  },
};
