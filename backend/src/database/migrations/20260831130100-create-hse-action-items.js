'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('hse_action_items', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      source_hash: {
        type: Sequelize.STRING(64),
        allowNull: false,
        unique: true,
        comment: 'SHA-256 hash of core fields to prevent duplicate imports',
      },
      sr_no: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      date_text: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      month: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      auditor_name: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      action_derived_from: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      audit_description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      area_clauses: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      recommendation: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      severity: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      responsible_department: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      responsible_manager: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      target_date_text: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      target_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      status: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      plant_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'plants',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    await queryInterface.addIndex('hse_action_items', ['source_hash'], { name: 'hse_action_items_source_hash_idx' });
    await queryInterface.addIndex('hse_action_items', ['date'], { name: 'hse_action_items_date_idx' });
    await queryInterface.addIndex('hse_action_items', ['plant_id'], { name: 'hse_action_items_plant_id_idx' });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('hse_action_items');
  },
};
