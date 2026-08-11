'use strict';
const Joi = require('joi');
const createLocationSchema = Joi.object({
  name: Joi.string().trim().max(255).required(),
  code: Joi.string().trim().max(80).allow(null, '').optional(),
  plantId: Joi.string().uuid().allow(null, '').optional(),
  isActive: Joi.boolean().optional(),
});
const updateLocationSchema = Joi.object({
  name: Joi.string().trim().max(255).optional(),
  code: Joi.string().trim().max(80).allow(null, '').optional(),
  plantId: Joi.string().uuid().allow(null, '').optional(),
  isActive: Joi.boolean().optional(),
}).min(1);
module.exports = { createLocationSchema, updateLocationSchema };
