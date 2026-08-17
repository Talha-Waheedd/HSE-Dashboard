'use strict';

const Joi = require('joi');
const HazardCategory = require('../../shared/enums/HazardCategory');
const SeverityLevel = require('../../shared/enums/SeverityLevel');
const HazardStatus = require('../../shared/enums/HazardStatus');

const createHazardSchema = Joi.object({
  plantId: Joi.string().uuid().required(),
  departmentId: Joi.string().uuid().optional().allow(null),
  category: Joi.string().valid(...Object.values(HazardCategory), 'other').required(),
  severityLevel: Joi.string().valid(...Object.values(SeverityLevel)).required(),
  title: Joi.string().max(255).required(),
  description: Joi.string().custom((value, helpers) => value.trim() && value.trim().split(/\s+/).length <= 500 ? value : helpers.error('string.maxWords')).messages({ 'string.maxWords': 'Hazard Details cannot exceed 500 words.' }).required(),
  location: Joi.string().max(255).optional(),
  status: Joi.string().valid(HazardStatus.DRAFT, HazardStatus.SUBMITTED).default(HazardStatus.DRAFT).optional(),
  reportedAt: Joi.date().iso().max('now').optional(),
  metadata: Joi.object({
    corrective_action: Joi.string().custom((value, helpers) => value.trim().split(/\s+/).length <= 500 ? value : helpers.error('string.maxWords')).messages({ 'string.maxWords': 'Corrective Action cannot exceed 500 words.' }).optional(),
    remarks: Joi.string().custom((value, helpers) => value.trim().split(/\s+/).length <= 500 ? value : helpers.error('string.maxWords')).messages({ 'string.maxWords': 'Remarks cannot exceed 500 words.' }).optional(),
  }).unknown(true).optional(),
});

const updateHazardSchema = Joi.object({
  plantId: Joi.string().uuid().optional(),
  departmentId: Joi.string().uuid().optional().allow(null),
  category: Joi.string().optional(),
  severityLevel: Joi.string().valid(...Object.values(SeverityLevel)).optional(),
  title: Joi.string().max(255).optional(),
  description: Joi.string().custom((value, helpers) => value.trim().split(/\s+/).length <= 500 ? value : helpers.error('string.maxWords')).messages({ 'string.maxWords': 'Hazard Details cannot exceed 500 words.' }).optional(),
  location: Joi.string().max(255).optional(),
  assignedTo: Joi.string().uuid().optional().allow(null),
  reportedAt: Joi.date().iso().max('now').optional(),
  metadata: Joi.object({
    corrective_action: Joi.string().custom((value, helpers) => value.trim().split(/\s+/).length <= 500 ? value : helpers.error('string.maxWords')).messages({ 'string.maxWords': 'Corrective Action cannot exceed 500 words.' }).optional(),
    remarks: Joi.string().custom((value, helpers) => value.trim().split(/\s+/).length <= 500 ? value : helpers.error('string.maxWords')).messages({ 'string.maxWords': 'Remarks cannot exceed 500 words.' }).optional(),
  }).unknown(true).optional(),
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
