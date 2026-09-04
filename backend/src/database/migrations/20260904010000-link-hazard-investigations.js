'use strict';

/**
 * Adds Hazard -> Incident Investigation persistence. Existing rows remain
 * untouched and NULL remains valid for ordinary incident/accident records.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const hazards = await queryInterface.describeTable('hazards');
    if (!hazards.further_investigation_required) {
      await queryInterface.addColumn('hazards', 'further_investigation_required', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Whether a finalized Hazard must generate an Incident Investigation',
      });
    }

    const incidents = await queryInterface.describeTable('incidents');
    if (!incidents.source_hazard_id) {
      await queryInterface.addColumn('incidents', 'source_hazard_id', {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'hazards', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Hazard that generated this Incident Investigation record',
      });
    }

    try {
      await queryInterface.addIndex('incidents', ['source_hazard_id'], {
        name: 'incidents_source_hazard_unique',
        unique: true,
      });
    } catch (error) {
      if (!/duplicate|exists|too many keys|max 64 keys/i.test(error.message || '')) throw error;
    }
  },

  async down(queryInterface) {
    try {
      await queryInterface.removeIndex('incidents', 'incidents_source_hazard_unique');
    } catch (error) {
      if (!/doesn't exist|unknown|not found/i.test(error.message || '')) throw error;
    }
    const incidents = await queryInterface.describeTable('incidents');
    if (incidents.source_hazard_id) await queryInterface.removeColumn('incidents', 'source_hazard_id');
    const hazards = await queryInterface.describeTable('hazards');
    if (hazards.further_investigation_required) await queryInterface.removeColumn('hazards', 'further_investigation_required');
  },
};
