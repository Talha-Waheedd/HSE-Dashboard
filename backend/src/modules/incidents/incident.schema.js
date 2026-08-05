'use strict';

const Joi = require('joi');
const IncidentType = require('../../shared/enums/IncidentType');
const IncidentStatus = require('../../shared/enums/IncidentStatus');
const SeverityLevel = require('../../shared/enums/SeverityLevel');

const injurySchema = Joi.object({
  bodyPart: Joi.string().max(100).optional(),
  injuryType: Joi.string().max(100).optional(),
  description: Joi.string().optional(),
});

const createIncidentSchema = Joi.object({
  plantId: Joi.string().uuid().required(),
  departmentId: Joi.string().uuid().optional().allow(null),
  incidentType: Joi.string().required(),
  severityLevel: Joi.string().required(),
  title: Joi.string().max(255).required(),
  description: Joi.string().required(),
  location: Joi.string().max(255).optional(),
  incidentDate: Joi.date().iso().required(),
  incidentTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/).optional(),
  injuredPersonId: Joi.string().uuid().optional().allow(null),
  injuredPersonName: Joi.string().max(150).optional(),
  lostDays: Joi.number().integer().min(0).optional(),
  restrictedDays: Joi.number().integer().min(0).optional(),
  firstAidGiven: Joi.boolean().default(false).optional(),
  immediateAction: Joi.string().optional(),
  status: Joi.string().optional(),
  injuries: Joi.array().items(injurySchema).optional(),
});

const updateIncidentSchema = Joi.object({
  plantId: Joi.string().uuid().optional(),
  departmentId: Joi.string().uuid().optional().allow(null),
  incidentType: Joi.string().optional(),
  severityLevel: Joi.string().optional(),
  title: Joi.string().max(255).optional(),
  description: Joi.string().optional(),
  location: Joi.string().max(255).optional(),
  incidentDate: Joi.date().iso().optional(),
  incidentTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/).optional(),
  injuredPersonId: Joi.string().uuid().optional().allow(null),
  injuredPersonName: Joi.string().max(150).optional(),
  lostDays: Joi.number().integer().min(0).optional(),
  restrictedDays: Joi.number().integer().min(0).optional(),
  firstAidGiven: Joi.boolean().optional(),
  immediateAction: Joi.string().optional(),
  investigatedBy: Joi.string().uuid().optional().allow(null),
  investigationFindings: Joi.string().optional(),
  rootCause: Joi.string().optional(),
}).min(1);

const updateIncidentStatusSchema = Joi.object({
  status: Joi.string().required(),
});

module.exports = {
  createIncidentSchema,
  updateIncidentSchema,
  updateIncidentStatusSchema,
};
