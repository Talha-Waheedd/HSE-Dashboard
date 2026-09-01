'use strict';

/**
 * Adds the one-to-one link used by generated Incident Investigations.
 * Existing incident rows are untouched; NULL is valid for ordinary incidents.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const existing = await queryInterface.describeTable('incidents');
    if (!existing.source_near_miss_id) {
      await queryInterface.addColumn('incidents', 'source_near_miss_id', {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'near_misses', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Near Miss that generated this Incident Investigation record',
      });
    }

    try {
      await queryInterface.addIndex('incidents', ['source_near_miss_id'], {
        name: 'incidents_source_near_miss_unique',
        unique: true,
      });
    } catch (error) {
      if (!/duplicate|exists|too many keys|max 64 keys/i.test(error.message || '')) throw error;
    }
  },

  async down(queryInterface) {
    try {
      await queryInterface.removeIndex('incidents', 'incidents_source_near_miss_unique');
    } catch (error) {
      if (!/doesn't exist|unknown|not found/i.test(error.message || '')) throw error;
    }
    const existing = await queryInterface.describeTable('incidents');
    if (existing.source_near_miss_id) await queryInterface.removeColumn('incidents', 'source_near_miss_id');
  },
};
