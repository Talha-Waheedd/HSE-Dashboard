'use strict';

const Joi = require('joi');
const AuditStatus = require('../../shared/enums/AuditStatus');
const SeverityLevel = require('../../shared/enums/SeverityLevel');

const auditFindingSchema = Joi.object({
  description: Joi.string().required(),
  severityLevel: Joi.string().valid(...Object.values(SeverityLevel)).required(),
  recommendation: Joi.string().optional(),
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
  score: Joi.number().precision(2).min(0).max(100).optional(),
  status: Joi.string().valid(...Object.values(AuditStatus)).optional(),
  completedDate: Joi.date().iso().optional(),
  source: Joi.string().valid('audit-management', 'critical-audit-plan').optional(),
}).min(1);

const updateAuditStatusSchema = Joi.object({
  status: Joi.string().valid(...Object.values(AuditStatus)).required(),
});

module.exports = {
  createAuditSchema,
  updateAuditSchema,
  updateAuditStatusSchema,
};
