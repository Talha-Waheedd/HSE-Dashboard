'use strict';

const Joi = require('joi');
const CorrectiveActionStatus = require('../../shared/enums/CorrectiveActionStatus');
const CorrectiveActionSource = require('../../shared/enums/CorrectiveActionSource');

const createCorrectiveActionSchema = Joi.object({
  plantId: Joi.string().uuid().required(),
  sourceType: Joi.string().valid(...Object.values(CorrectiveActionSource)).required(),
  sourceId: Joi.string().uuid().required(),
  sourceItemId: Joi.string().uuid().allow(null).optional(),
  sourceItemKey: Joi.string().max(80).optional(),
  sourceReference: Joi.string().max(100).allow('', null).optional(),
  incidentCategory: Joi.string().max(50).allow('', null).optional(),
  title: Joi.string().max(255).required(),
  description: Joi.string().required(),
  responsibleDepartmentId: Joi.string().uuid().allow(null).optional(),
  responsibility: Joi.string().allow('', null).optional(),
  assignedTo: Joi.string().uuid().allow(null).optional(),
  dueDate: Joi.date().iso().allow(null).optional(),
  priority: Joi.string().valid('low', 'medium', 'high', 'critical').allow(null).optional(),
  status: Joi.string().valid(CorrectiveActionStatus.OPEN, CorrectiveActionStatus.IN_PROGRESS).default(CorrectiveActionStatus.OPEN).optional(),
});

const updateCorrectiveActionSchema = Joi.object({
  plantId: Joi.string().uuid().optional(),
  title: Joi.string().max(255).optional(),
  description: Joi.string().optional(),
  responsibleDepartmentId: Joi.string().uuid().allow(null).optional(),
  responsibility: Joi.string().allow('', null).optional(),
  assignedTo: Joi.string().uuid().allow(null).optional(),
  dueDate: Joi.date().iso().allow(null).optional(),
  priority: Joi.string().valid('low', 'medium', 'high', 'critical').allow(null).optional(),
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
