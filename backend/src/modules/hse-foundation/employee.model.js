'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../../database/connection');

/**
 * Employee — HSE-specific profile that extends the users table.
 * A 1:1 relationship via userId preserves the existing auth system completely.
 */
const Employee = sequelize.define('Employee', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    comment: 'FK → users.id (1:1)',
  },
  employeeId: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: 'Human-readable ID, e.g. EMP-001',
  },
  departmentId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'FK → departments.id',
  },
  plantId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'FK → plants.id',
  },
  designation: {
    type: DataTypes.STRING(150),
    allowNull: true,
    comment: 'e.g. Production Operator',
  },
  gender: {
    type: DataTypes.ENUM('Male', 'Female', 'Other'),
    allowNull: true,
  },
  jobTitle: {
    type: DataTypes.STRING(150),
    allowNull: true,
  },
  joiningDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  employmentType: {
    type: DataTypes.ENUM('permanent', 'contract', 'intern'),
    defaultValue: 'permanent',
  },
  emergencyContactName: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  emergencyContactPhone: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  bloodGroup: {
    type: DataTypes.STRING(10),
    allowNull: true,
    comment: 'e.g. A+, O-',
  },
}, {
  tableName: 'employees',
  paranoid: false,
  indexes: [
    { fields: ['user_id'], unique: true, name: 'employees_user_id_unique' },
    { fields: ['employee_id'], unique: true, name: 'employees_employee_id_unique' },
    { fields: ['department_id'], name: 'employees_department_id_idx' },
    { fields: ['plant_id'], name: 'employees_plant_id_idx' },
  ],
});

module.exports = Employee;
