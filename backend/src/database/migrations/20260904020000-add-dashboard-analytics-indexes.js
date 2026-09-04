const ensureIndex = async (queryInterface, table, fields, name) => {
  const indexes = await queryInterface.showIndex(table);
  if (!indexes.some((index) => index.name === name)) {
    await queryInterface.addIndex(table, fields, { name });
  }
};

const removeIndexIfPresent = async (queryInterface, table, name) => {
  const indexes = await queryInterface.showIndex(table);
  if (indexes.some((index) => index.name === name)) await queryInterface.removeIndex(table, name);
};

module.exports = {
  async up(queryInterface) {
    // reported_at is the authoritative business date used by Dashboard time
    // filters; these source tables previously indexed only created_at.
    await ensureIndex(queryInterface, 'hazards', ['reported_at', 'department_id'], 'hazards_analytics_date_department_idx');
    await ensureIndex(queryInterface, 'near_misses', ['reported_at', 'department_id'], 'near_misses_analytics_date_department_idx');
  },

  async down(queryInterface) {
    await removeIndexIfPresent(queryInterface, 'near_misses', 'near_misses_analytics_date_department_idx');
    await removeIndexIfPresent(queryInterface, 'hazards', 'hazards_analytics_date_department_idx');
  },
};
