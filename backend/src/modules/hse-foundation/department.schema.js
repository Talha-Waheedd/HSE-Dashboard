'use strict';

const Joi = require('joi');

const createDepartmentSchema = Joi.object({
  plantId: Joi.string().uuid().required(),
  name: Joi.string().max(150).required(),
  code: Joi.string().max(20).optional(),
  description: Joi.string().optional(),
  managerId: Joi.string().uuid().optional().allow(null),
  isActive: Joi.boolean().default(true).optional(),
});

const updateDepartmentSchema = Joi.object({
  plantId: Joi.string().uuid().optional(),
  name: Joi.string().max(150).optional(),
  code: Joi.string().max(20).optional(),
  description: Joi.string().optional(),
  managerId: Joi.string().uuid().optional().allow(null),
  isActive: Joi.boolean().optional(),
}).min(1);

module.exports = {
  createDepartmentSchema,
  updateDepartmentSchema,
};
