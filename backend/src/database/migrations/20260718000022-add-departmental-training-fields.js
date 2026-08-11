'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('training_sessions', 'trainer_name', { type: Sequelize.STRING(255), allowNull: true });
    await queryInterface.addColumn('training_sessions', 'participant_count', { type: Sequelize.INTEGER, allowNull: true });
    await queryInterface.addColumn('training_sessions', 'manhours', { type: Sequelize.DECIMAL(12, 2), allowNull: true });
    await queryInterface.addColumn('training_sessions', 'source_fingerprint', { type: Sequelize.STRING(64), allowNull: true, unique: true });
    await queryInterface.addIndex('training_sessions', ['source_fingerprint'], { unique: true, name: 'training_sessions_source_fingerprint_unique' });
  },
  async down(queryInterface) {
    await queryInterface.removeIndex('training_sessions', 'training_sessions_source_fingerprint_unique');
    await queryInterface.removeColumn('training_sessions', 'source_fingerprint');
    await queryInterface.removeColumn('training_sessions', 'manhours');
    await queryInterface.removeColumn('training_sessions', 'participant_count');
    await queryInterface.removeColumn('training_sessions', 'trainer_name');
  },
};
