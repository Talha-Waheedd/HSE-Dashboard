'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../../database/connection');
const SeverityLevel = require('../../shared/enums/SeverityLevel');

/**
 * InspectionItem — Individual checklist items within an inspection.
 * Many items can exist per inspection.
 */
const InspectionItem = sequelize.define('InspectionItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  inspectionId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'FK → inspections.id',
  },
  checklistItem: {
    type: DataTypes.STRING(500),
    allowNull: false,
    comment: 'The inspection question/item text',
  },
  result: {
    type: DataTypes.ENUM('pass', 'fail', 'na'),
    allowNull: true,
    comment: 'na = not applicable',
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  severityLevel: {
    type: DataTypes.ENUM(...Object.values(SeverityLevel)),
    allowNull: true,
    comment: 'Severity if result is fail',
  },
}, {
  tableName: 'inspection_items',
  paranoid: false,
  indexes: [
    { fields: ['inspection_id'], name: 'inspection_items_inspection_id_idx' },
    { fields: ['result'], name: 'inspection_items_result_idx' },
  ],
});

module.exports = InspectionItem;
