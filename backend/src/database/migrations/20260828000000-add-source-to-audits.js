'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('audits', 'source', {
      type: Sequelize.STRING(50),
      allowNull: true,
      defaultValue: 'audit-management',
      after: 'audit_type',
    });
    
    await queryInterface.addIndex('audits', ['source'], {
      name: 'audits_source_idx'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('audits', 'audits_source_idx');
    await queryInterface.removeColumn('audits', 'source');
  }
};
