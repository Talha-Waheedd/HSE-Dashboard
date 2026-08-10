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

const actionSchema = Joi.object({
  action: Joi.string().trim().min(1).max(2000).required(),
  // New action assignments. The fields remain optional at the API boundary so
  // older incidents can still be edited without data loss.
  responsible_person: Joi.string().trim().max(255).allow('').optional(),
  responsible_department: Joi.string().trim().max(255).allow('').optional(),
  // Backward-compatible alias used by incidents created before the rename.
  responsibility: Joi.string().trim().max(255).allow('').optional(),
  timeline: Joi.date().iso().allow('', null).optional(),
  severity: Joi.string().valid('Low', 'Medium', 'High', 'low', 'medium', 'high').required(),
  status: Joi.string().valid('Open', 'Planned', 'Closed', 'open', 'planned', 'closed').required(),
});

const createIncidentSchema = Joi.object({
  plantId: Joi.string().uuid().required(),
  departmentId: Joi.string().uuid().optional().allow(null),
  incidentType: Joi.string().valid(...Object.values(IncidentType), 'general').required(),
  severityLevel: Joi.string().valid(...Object.values(SeverityLevel)).required(),
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
  status: Joi.string().valid(...Object.values(IncidentStatus)).optional(),
  injuries: Joi.array().items(injurySchema).optional(),
  actions: Joi.array().items(actionSchema).max(100).optional(),
  metadata: Joi.object().optional(),
});

const updateIncidentSchema = Joi.object({
  plantId: Joi.string().uuid().optional(),
  departmentId: Joi.string().uuid().optional().allow(null),
  incidentType: Joi.string().valid(...Object.values(IncidentType), 'general').optional(),
  severityLevel: Joi.string().valid(...Object.values(SeverityLevel)).optional(),
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
  actions: Joi.array().items(actionSchema).max(100).optional(),
  metadata: Joi.object().optional(),
}).min(1);

const updateIncidentStatusSchema = Joi.object({
  status: Joi.string().required(),
});

module.exports = {
  createIncidentSchema,
  updateIncidentSchema,
  updateIncidentStatusSchema,
};
