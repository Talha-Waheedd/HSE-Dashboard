'use strict';

const Joi = require('joi');
const CorrectiveActionStatus = require('../../shared/enums/CorrectiveActionStatus');
const CorrectiveActionSource = require('../../shared/enums/CorrectiveActionSource');

const createCorrectiveActionSchema = Joi.object({
  plantId: Joi.string().uuid().required(),
  sourceType: Joi.string().valid(...Object.values(CorrectiveActionSource)).required(),
  sourceId: Joi.string().uuid().required(),
  title: Joi.string().max(255).required(),
  description: Joi.string().required(),
  assignedTo: Joi.string().uuid().required(),
  dueDate: Joi.date().iso().required(),
  priority: Joi.string().valid('low', 'medium', 'high', 'critical').default('medium').optional(),
  status: Joi.string().valid(CorrectiveActionStatus.OPEN, CorrectiveActionStatus.IN_PROGRESS).default(CorrectiveActionStatus.OPEN).optional(),
});

const updateCorrectiveActionSchema = Joi.object({
  plantId: Joi.string().uuid().optional(),
  title: Joi.string().max(255).optional(),
  description: Joi.string().optional(),
  assignedTo: Joi.string().uuid().optional(),
  dueDate: Joi.date().iso().optional(),
  priority: Joi.string().valid('low', 'medium', 'high', 'critical').optional(),
}).min(1);

const updateCorrectiveActionStatusSchema = Joi.object({
  status: Joi.string().valid(...Object.values(CorrectiveActionStatus)).required(),
  verificationNotes: Joi.string().optional().when('status', {
    is: CorrectiveActionStatus.VERIFIED,
    then: Joi.required(),
  }),
});

module.exports = {
  createCorrectiveActionSchema,
  updateCorrectiveActionSchema,
  updateCorrectiveActionStatusSchema,
};
