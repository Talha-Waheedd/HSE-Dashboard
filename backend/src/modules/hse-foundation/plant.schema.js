'use strict';

const Joi = require('joi');

const createPlantSchema = Joi.object({
  name: Joi.string().max(200).required(),
  code: Joi.string().max(20).required(),
  location: Joi.string().max(200).optional(),
  address: Joi.string().optional(),
  country: Joi.string().max(100).default('Pakistan').optional(),
  contactName: Joi.string().max(100).optional(),
  contactEmail: Joi.string().email().max(255).optional(),
  contactPhone: Joi.string().max(20).optional(),
  isActive: Joi.boolean().default(true).optional(),
});

const updatePlantSchema = Joi.object({
  name: Joi.string().max(200).optional(),
  code: Joi.string().max(20).optional(),
  location: Joi.string().max(200).optional(),
  address: Joi.string().optional(),
  country: Joi.string().max(100).optional(),
  contactName: Joi.string().max(100).optional(),
  contactEmail: Joi.string().email().max(255).optional(),
  contactPhone: Joi.string().max(20).optional(),
  isActive: Joi.boolean().optional(),
}).min(1); // Ensure at least one field is provided for update

module.exports = {
  createPlantSchema,
  updatePlantSchema,
};
