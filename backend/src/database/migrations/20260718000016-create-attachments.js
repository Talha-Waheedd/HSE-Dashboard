'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('attachments', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      source_type: { type: Sequelize.ENUM('hazard', 'near_miss', 'incident', 'training', 'audit', 'inspection', 'corrective_action'), allowNull: false },
      source_id: { type: Sequelize.UUID, allowNull: false },
      filename: { type: Sequelize.STRING(255), allowNull: false },
      original_name: { type: Sequelize.STRING(255), allowNull: false },
      mime_type: { type: Sequelize.STRING(100), allowNull: true },
      size_bytes: { type: Sequelize.BIGINT, allowNull: true },
      storage_driver: { type: Sequelize.ENUM('local', 's3'), defaultValue: 'local', allowNull: false },
      storage_path: { type: Sequelize.STRING(500), allowNull: true },
      url: { type: Sequelize.STRING(1000), allowNull: true },
      uploaded_by: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'RESTRICT' },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('attachments', ['source_type', 'source_id'], { name: 'attachments_source_idx' });
    await queryInterface.addIndex('attachments', ['uploaded_by'], { name: 'attachments_uploaded_by_idx' });
    await queryInterface.addIndex('attachments', ['source_type'], { name: 'attachments_source_type_idx' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('attachments');
  },
};
