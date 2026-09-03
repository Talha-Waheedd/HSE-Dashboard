'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('incidents', 'location_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'locations', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      after: 'department_id',
    });
    await queryInterface.addColumn('incidents', 'source_type', {
      type: Sequelize.STRING(50),
      allowNull: true,
      after: 'source_near_miss_id',
    });
    await queryInterface.addColumn('incidents', 'source_hash', {
      type: Sequelize.STRING(64),
      allowNull: true,
      after: 'source_type',
    });
    await queryInterface.addColumn('incidents', 'source_workbook', {
      type: Sequelize.STRING(255),
      allowNull: true,
      after: 'source_hash',
    });
    await queryInterface.addColumn('incidents', 'source_sheet', {
      type: Sequelize.STRING(255),
      allowNull: true,
      after: 'source_workbook',
    });
    await queryInterface.addColumn('incidents', 'source_row', {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: true,
      after: 'source_sheet',
    });
    await queryInterface.addColumn('incidents', 'imported_at', {
      type: Sequelize.DATE,
      allowNull: true,
      after: 'source_row',
    });

    await queryInterface.addIndex('incidents', ['location_id'], {
      name: 'incidents_location_id_idx',
    });
    await queryInterface.addIndex('incidents', ['source_hash'], {
      name: 'incidents_source_hash_unique',
      unique: true,
    });
    await queryInterface.addIndex('incidents', ['source_type'], {
      name: 'incidents_source_type_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('incidents', 'incidents_source_type_idx');
    await queryInterface.removeIndex('incidents', 'incidents_source_hash_unique');
    await queryInterface.removeIndex('incidents', 'incidents_location_id_idx');
    await queryInterface.removeColumn('incidents', 'imported_at');
    await queryInterface.removeColumn('incidents', 'source_row');
    await queryInterface.removeColumn('incidents', 'source_sheet');
    await queryInterface.removeColumn('incidents', 'source_workbook');
    await queryInterface.removeColumn('incidents', 'source_hash');
    await queryInterface.removeColumn('incidents', 'source_type');
    await queryInterface.removeColumn('incidents', 'location_id');
  },
};
