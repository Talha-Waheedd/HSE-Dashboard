'use strict';

/** Persisted supervisor analysis for records from the HSE reporting modules. */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('master_analyses', {
      id: { type: Sequelize.UUID, allowNull: false, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      source_type: { type: Sequelize.STRING(40), allowNull: false },
      source_id: { type: Sequelize.UUID, allowNull: false },
      analysis_status: {
        type: Sequelize.ENUM('not_reviewed', 'under_review', 'completed'),
        allowNull: false,
        defaultValue: 'not_reviewed',
      },
      analysis_data: { type: Sequelize.JSON, allowNull: true },
      created_by: { type: Sequelize.UUID, allowNull: true },
      updated_by: { type: Sequelize.UUID, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });
    await queryInterface.addConstraint('master_analyses', {
      fields: ['source_type', 'source_id'],
      type: 'unique',
      name: 'master_analyses_source_unique',
    });
    await queryInterface.addIndex('master_analyses', ['analysis_status', 'updated_at'], { name: 'master_analyses_status_updated_idx' });
    await queryInterface.addIndex('master_analyses', ['source_type', 'source_id'], { name: 'master_analyses_source_idx' });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('master_analyses', 'master_analyses_status_updated_idx');
    await queryInterface.removeIndex('master_analyses', 'master_analyses_source_idx');
    await queryInterface.removeConstraint('master_analyses', 'master_analyses_source_unique');
    await queryInterface.dropTable('master_analyses');
  },
};
