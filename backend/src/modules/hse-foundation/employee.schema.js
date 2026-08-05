'use strict';

const Joi = require('joi');

const createEmployeeSchema = Joi.object({
  userId: Joi.string().uuid().required(),
  employeeId: Joi.string().max(50).required(),
  departmentId: Joi.string().uuid().optional().allow(null),
  plantId: Joi.string().uuid().optional().allow(null),
  designation: Joi.string().max(150).optional(),
  jobTitle: Joi.string().max(150).optional(),
  joiningDate: Joi.date().iso().optional(),
  employmentType: Joi.string().valid('permanent', 'contract', 'intern').default('permanent').optional(),
  emergencyContactName: Joi.string().max(100).optional(),
  emergencyContactPhone: Joi.string().max(20).optional(),
  bloodGroup: Joi.string().max(10).optional(),
});

const updateEmployeeSchema = Joi.object({
  employeeId: Joi.string().max(50).optional(),
  departmentId: Joi.string().uuid().optional().allow(null),
  plantId: Joi.string().uuid().optional().allow(null),
  designation: Joi.string().max(150).optional(),
  jobTitle: Joi.string().max(150).optional(),
  joiningDate: Joi.date().iso().optional(),
  employmentType: Joi.string().valid('permanent', 'contract', 'intern').optional(),
  emergencyContactName: Joi.string().max(100).optional(),
  emergencyContactPhone: Joi.string().max(20).optional(),
  bloodGroup: Joi.string().max(10).optional(),
}).min(1);

module.exports = {
  createEmployeeSchema,
  updateEmployeeSchema,
};
