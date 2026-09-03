'use strict';

const Joi = require('joi');
const AuditStatus = require('../../shared/enums/AuditStatus');
const SeverityLevel = require('../../shared/enums/SeverityLevel');

const auditFindingSchema = Joi.object({
  id: Joi.string().uuid().optional(),
  standardReference: Joi.string().max(255).allow('', null).optional(),
  description: Joi.string().required(),
  standardLimitRequirement: Joi.string().allow('', null).optional(),
  score: Joi.number().integer().min(1).max(4).allow(null).optional(),
  severityLevel: Joi.string().valid(...Object.values(SeverityLevel)).allow(null).optional(),
  recommendation: Joi.string().allow('', null).optional(),
  targetDate: Joi.date().iso().allow(null, '').optional(),
  responsibility: Joi.string().allow('', null).optional(),
  responsibleDepartmentId: Joi.string().uuid().allow(null, '').optional(),
  status: Joi.string().valid('open', 'closed').default('open').optional(),
  sortOrder: Joi.number().integer().min(0).optional(),
});

const createAuditSchema = Joi.object({
  plantId: Joi.string().uuid().required(),
  departmentId: Joi.string().uuid().optional().allow(null),
  title: Joi.string().max(255).required(),
  auditType: Joi.string().valid('internal', 'external', 'regulatory').default('internal').optional(),
  scheduledDate: Joi.date().iso().required(),
  scope: Joi.string().optional(),
  status: Joi.string().valid(...Object.values(AuditStatus)).default(AuditStatus.PLANNED).optional(),
  completedDate: Joi.date().iso().optional(),
  summary: Joi.string().optional(),
  areaOwner: Joi.string().allow('', null).optional(),
  auditObjective: Joi.string().allow('', null).optional(),
  riskRating: Joi.string().valid('Low', 'Medium', 'High').allow(null).optional(),
  auditors: Joi.string().allow('', null).optional(),
  frequency: Joi.string().allow('', null).optional(),
  personsInterviewed: Joi.string().allow('', null).optional(),
  source: Joi.string().valid('audit-management', 'critical-audit-plan').default('audit-management').optional(),
  findings: Joi.array().items(auditFindingSchema).optional(),
});

const updateAuditSchema = Joi.object({
  plantId: Joi.string().uuid().optional(),
  departmentId: Joi.string().uuid().optional().allow(null),
  title: Joi.string().max(255).optional(),
  auditType: Joi.string().valid('internal', 'external', 'regulatory').optional(),
  scheduledDate: Joi.date().iso().optional(),
  scope: Joi.string().optional(),
  summary: Joi.string().optional(),
  areaOwner: Joi.string().allow('', null).optional(),
  auditObjective: Joi.string().allow('', null).optional(),
  riskRating: Joi.string().valid('Low', 'Medium', 'High').allow(null).optional(),
  auditors: Joi.string().allow('', null).optional(),
  frequency: Joi.string().allow('', null).optional(),
  personsInterviewed: Joi.string().allow('', null).optional(),
  score: Joi.number().precision(2).min(0).max(100).optional(),
  status: Joi.string().valid(...Object.values(AuditStatus)).optional(),
  completedDate: Joi.date().iso().optional(),
  source: Joi.string().valid('audit-management', 'critical-audit-plan').optional(),
  findings: Joi.array().items(auditFindingSchema).optional(),
}).min(1);

const updateAuditStatusSchema = Joi.object({
  status: Joi.string().valid(...Object.values(AuditStatus)).required(),
});

module.exports = {
  createAuditSchema,
  updateAuditSchema,
  updateAuditStatusSchema,
};
