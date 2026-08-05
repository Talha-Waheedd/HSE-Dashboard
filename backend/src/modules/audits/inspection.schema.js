'use strict';

const Joi = require('joi');
const InspectionStatus = require('../../shared/enums/InspectionStatus');
const SeverityLevel = require('../../shared/enums/SeverityLevel');

const inspectionItemSchema = Joi.object({
  checklistItem: Joi.string().max(500).required(),
  result: Joi.string().valid('pass', 'fail', 'na').optional(),
  remarks: Joi.string().optional(),
  severityLevel: Joi.string().valid(...Object.values(SeverityLevel)).optional(),
});

const createInspectionSchema = Joi.object({
  plantId: Joi.string().uuid().required(),
  departmentId: Joi.string().uuid().optional().allow(null),
  title: Joi.string().max(255).required(),
  inspectionType: Joi.string().valid('routine', 'special', 'regulatory').default('routine').optional(),
  scheduledDate: Joi.date().iso().required(),
  area: Joi.string().max(255).optional(),
  status: Joi.string().valid(InspectionStatus.SCHEDULED, InspectionStatus.IN_PROGRESS).default(InspectionStatus.SCHEDULED).optional(),
  items: Joi.array().items(inspectionItemSchema).optional(),
});

const updateInspectionSchema = Joi.object({
  plantId: Joi.string().uuid().optional(),
  departmentId: Joi.string().uuid().optional().allow(null),
  title: Joi.string().max(255).optional(),
  inspectionType: Joi.string().valid('routine', 'special', 'regulatory').optional(),
  scheduledDate: Joi.date().iso().optional(),
  area: Joi.string().max(255).optional(),
  summary: Joi.string().optional(),
  overallResult: Joi.string().valid('pass', 'fail', 'conditional').optional(),
}).min(1);

const updateInspectionStatusSchema = Joi.object({
  status: Joi.string().valid(...Object.values(InspectionStatus)).required(),
});

module.exports = {
  createInspectionSchema,
  updateInspectionSchema,
  updateInspectionStatusSchema,
};
