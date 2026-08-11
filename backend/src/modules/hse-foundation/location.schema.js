'use strict';
const Joi = require('joi');
const createLocationSchema = Joi.object({
  name: Joi.string().trim().max(255).required(),
  plantId: Joi.string().uuid().allow(null, '').optional(),
  isActive: Joi.boolean().optional(),
});
const updateLocationSchema = Joi.object({
  name: Joi.string().trim().max(255).optional(),
  plantId: Joi.string().uuid().allow(null, '').optional(),
  isActive: Joi.boolean().optional(),
}).min(1);
module.exports = { createLocationSchema, updateLocationSchema };
