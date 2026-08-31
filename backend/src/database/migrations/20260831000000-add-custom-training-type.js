'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const columns = await queryInterface.describeTable('training_sessions');
    if (!columns.custom_training_type) {
      await queryInterface.addColumn('training_sessions', 'custom_training_type', {
        type: Sequelize.STRING(255),
        allowNull: true,
        after: 'training_type',
      });
    }
  },

  async down(queryInterface) {
    const columns = await queryInterface.describeTable('training_sessions');
    if (columns.custom_training_type) {
      await queryInterface.removeColumn('training_sessions', 'custom_training_type');
    }
  },
};
