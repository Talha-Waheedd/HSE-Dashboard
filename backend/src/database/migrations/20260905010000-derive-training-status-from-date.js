'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // Older manual-entry saves always wrote `scheduled`, including training
    // that had already taken place. Align those rows with the date-driven
    // rule now enforced by TrainingService.
    await queryInterface.sequelize.query(`
      UPDATE training_sessions
      SET status = 'completed'
      WHERE status = 'scheduled'
        AND scheduled_date IS NOT NULL
        AND scheduled_date <= CURRENT_DATE
    `);
  },

  async down() {
    // This is a one-way data correction. Previously completed and corrected
    // rows cannot be distinguished safely, so rollback must not falsify them.
  },
};
