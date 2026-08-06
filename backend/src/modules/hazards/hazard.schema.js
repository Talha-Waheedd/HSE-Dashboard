'use strict';

const Joi = require('joi');
const HazardCategory = require('../../shared/enums/HazardCategory');
const SeverityLevel = require('../../shared/enums/SeverityLevel');
const HazardStatus = require('../../shared/enums/HazardStatus');

const createHazardSchema = Joi.object({
  plantId: Joi.string().uuid().required(),
  departmentId: Joi.string().uuid().optional().allow(null),
  category: Joi.string().required(),
  severityLevel: Joi.string().required(),
  title: Joi.string().max(255).required(),
  description: Joi.string().required(),
  location: Joi.string().max(255).optional(),
  status: Joi.string().valid(HazardStatus.DRAFT, HazardStatus.SUBMITTED).default(HazardStatus.DRAFT).optional(),
  reportedAt: Joi.date().iso().optional(),
  metadata: Joi.object().optional(),
});

const updateHazardSchema = Joi.object({
  plantId: Joi.string().uuid().optional(),
  departmentId: Joi.string().uuid().optional().allow(null),
  category: Joi.string().optional(),
  severityLevel: Joi.string().optional(),
  title: Joi.string().max(255).optional(),
  description: Joi.string().optional(),
  location: Joi.string().max(255).optional(),
  assignedTo: Joi.string().uuid().optional().allow(null),
  reportedAt: Joi.date().iso().optional(),
  metadata: Joi.object().optional(),
}).min(1);

const updateHazardStatusSchema = Joi.object({
  status: Joi.string().valid(...Object.values(HazardStatus)).required(),
  actionTaken: Joi.string().optional().when('status', {
    is: HazardStatus.RESOLVED,
    then: Joi.required(),
  }),
});

module.exports = {
  createHazardSchema,
  updateHazardSchema,
  updateHazardStatusSchema,
};
