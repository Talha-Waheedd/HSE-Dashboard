'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        "UPDATE audits SET source = 'manual' WHERE source IS NULL OR source = 'audit-management'",
        { transaction },
      );
      await queryInterface.changeColumn('audits', 'source', {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'manual',
      }, { transaction });
      const indexes = await queryInterface.showIndex('audits', { transaction });
      if (!indexes.some(index => index.name === 'audits_source_idx')) {
        await queryInterface.addIndex('audits', ['source'], { name: 'audits_source_idx', transaction });
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const indexes = await queryInterface.showIndex('audits', { transaction });
      if (indexes.some(index => index.name === 'audits_source_idx')) {
        await queryInterface.removeIndex('audits', 'audits_source_idx', { transaction });
      }
      await queryInterface.changeColumn('audits', 'source', {
        type: Sequelize.STRING(50),
        allowNull: true,
        defaultValue: 'audit-management',
      }, { transaction });
    });
  },
};
