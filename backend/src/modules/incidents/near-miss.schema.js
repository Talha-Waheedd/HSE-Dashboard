'use strict';

const Joi = require('joi');
const SeverityLevel = require('../../shared/enums/SeverityLevel');

const createNearMissSchema = Joi.object({
  plantId: Joi.string().uuid().required(),
  departmentId: Joi.string().uuid().optional().allow(null),
  title: Joi.string().max(255).required(),
  description: Joi.string().required(),
  location: Joi.string().max(255).optional(),
  severityLevel: Joi.string().valid(...Object.values(SeverityLevel)).required(),
  status: Joi.string().valid('draft', 'submitted').default('draft').optional(),
  immediateAction: Joi.string().optional(),
  reportedAt: Joi.date().iso().optional(),
});

const updateNearMissSchema = Joi.object({
  plantId: Joi.string().uuid().optional(),
  departmentId: Joi.string().uuid().optional().allow(null),
  title: Joi.string().max(255).optional(),
  description: Joi.string().optional(),
  location: Joi.string().max(255).optional(),
  severityLevel: Joi.string().valid(...Object.values(SeverityLevel)).optional(),
  immediateAction: Joi.string().optional(),
  rootCause: Joi.string().optional(),
  assignedTo: Joi.string().uuid().optional().allow(null),
  reportedAt: Joi.date().iso().optional(),
}).min(1);

const updateNearMissStatusSchema = Joi.object({
  status: Joi.string().valid('draft', 'submitted', 'under_review', 'closed').required(),
});

module.exports = {
  createNearMissSchema,
  updateNearMissSchema,
  updateNearMissStatusSchema,
};
