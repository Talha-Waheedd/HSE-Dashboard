'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('training_sessions', 'status', {
      type: Sequelize.ENUM('draft', 'scheduled', 'in_progress', 'completed', 'cancelled'),
      defaultValue: 'scheduled',
      allowNull: false,
    });
    await queryInterface.changeColumn('training_sessions', 'title', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
    await queryInterface.changeColumn('training_sessions', 'training_type', {
      type: Sequelize.ENUM('induction', 'refresher', 'toolbox_talk', 'fire_safety', 'first_aid', 'ppe_usage', 'chemical_handling', 'emergency_response', 'other'),
      allowNull: true,
    });
    await queryInterface.changeColumn('training_sessions', 'scheduled_date', {
      type: Sequelize.DATEONLY,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query("UPDATE training_sessions SET status = 'scheduled', title = COALESCE(NULLIF(title, ''), 'Untitled Training'), training_type = COALESCE(training_type, 'other'), scheduled_date = COALESCE(scheduled_date, CURRENT_DATE) WHERE status = 'draft' OR title IS NULL OR training_type IS NULL OR scheduled_date IS NULL");
    await queryInterface.changeColumn('training_sessions', 'title', {
      type: Sequelize.STRING(255),
      allowNull: false,
    });
    await queryInterface.changeColumn('training_sessions', 'training_type', {
      type: Sequelize.ENUM('induction', 'refresher', 'toolbox_talk', 'fire_safety', 'first_aid', 'ppe_usage', 'chemical_handling', 'emergency_response', 'other'),
      allowNull: false,
    });
    await queryInterface.changeColumn('training_sessions', 'scheduled_date', {
      type: Sequelize.DATEONLY,
      allowNull: false,
    });
    await queryInterface.changeColumn('training_sessions', 'status', {
      type: Sequelize.ENUM('scheduled', 'in_progress', 'completed', 'cancelled'),
      defaultValue: 'scheduled',
      allowNull: false,
    });
  },
};
