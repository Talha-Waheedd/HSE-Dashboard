'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Training sessions table
    await queryInterface.createTable('training_sessions', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      plant_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'plants', key: 'id' }, onDelete: 'RESTRICT' },
      department_id: { type: Sequelize.UUID, allowNull: true, references: { model: 'departments', key: 'id' }, onDelete: 'SET NULL' },
      title: { type: Sequelize.STRING(255), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      training_type: {
        type: Sequelize.ENUM('induction', 'refresher', 'toolbox_talk', 'fire_safety', 'first_aid', 'ppe_usage', 'chemical_handling', 'emergency_response', 'other'),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('scheduled', 'in_progress', 'completed', 'cancelled'),
        defaultValue: 'scheduled',
        allowNull: false,
      },
      trainer_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'RESTRICT' },
      scheduled_date: { type: Sequelize.DATEONLY, allowNull: false },
      scheduled_time: { type: Sequelize.TIME, allowNull: true },
      duration_minutes: { type: Sequelize.INTEGER, allowNull: true },
      venue: { type: Sequelize.STRING(255), allowNull: true },
      max_attendees: { type: Sequelize.INTEGER, allowNull: true },
      notes: { type: Sequelize.TEXT, allowNull: true },
      created_by: { type: Sequelize.UUID, allowNull: true },
      updated_by: { type: Sequelize.UUID, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });

    await queryInterface.addIndex('training_sessions', ['plant_id'], { name: 'training_sessions_plant_id_idx' });
    await queryInterface.addIndex('training_sessions', ['department_id'], { name: 'training_sessions_department_id_idx' });
    await queryInterface.addIndex('training_sessions', ['trainer_id'], { name: 'training_sessions_trainer_id_idx' });
    await queryInterface.addIndex('training_sessions', ['status'], { name: 'training_sessions_status_idx' });
    await queryInterface.addIndex('training_sessions', ['training_type'], { name: 'training_sessions_type_idx' });
    await queryInterface.addIndex('training_sessions', ['scheduled_date'], { name: 'training_sessions_date_idx' });

    // Training attendees table
    await queryInterface.createTable('training_attendees', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      session_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'training_sessions', key: 'id' }, onDelete: 'CASCADE' },
      user_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      attended: { type: Sequelize.BOOLEAN, defaultValue: false },
      signature_url: { type: Sequelize.STRING(500), allowNull: true },
      remarks: { type: Sequelize.TEXT, allowNull: true },
      marked_by: { type: Sequelize.UUID, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      marked_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('training_attendees', ['session_id'], { name: 'training_attendees_session_id_idx' });
    await queryInterface.addIndex('training_attendees', ['user_id'], { name: 'training_attendees_user_id_idx' });
    await queryInterface.addIndex('training_attendees', ['session_id', 'user_id'], { unique: true, name: 'training_attendees_session_user_unique' });
    await queryInterface.addIndex('training_attendees', ['attended'], { name: 'training_attendees_attended_idx' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('training_attendees');
    await queryInterface.dropTable('training_sessions');
  },
};
