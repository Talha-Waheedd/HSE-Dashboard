'use strict';

const Joi = require('joi');

const yesNoValue = Joi.alternatives().try(
  Joi.boolean(),
  Joi.string().valid('Yes', 'No', 'YES', 'NO', 'Y', 'N', 'true', 'false'),
).allow('', null);

const remarksValue = Joi.string().custom((value, helpers) => {
  if (value.trim().split(/\s+/).filter(Boolean).length > 500) return helpers.error('string.maxWords');
  return value;
}).messages({ 'string.maxWords': 'Remarks cannot exceed 500 words.' });

const metadataSchema = Joi.object({
  // Keep the existing UI field names while allowing legacy imported aliases.
  investigation_required: yesNoValue.optional(),
  further_investigation_required: yesNoValue.optional(),
  further_investigation: yesNoValue.optional(),
  reported_in_hazard: yesNoValue.optional(),
  responsible_department_id: Joi.string().uuid().allow('', null).optional(),
  responsible_department: Joi.string().max(150).allow('', null).optional(),
  resp: Joi.string().max(150).allow('', null).optional(),
  remarks: remarksValue.allow('', null).optional(),
}).unknown(true);

const nearMissStatus = Joi.string().valid('draft', 'submitted', 'under_review', 'closed').optional();

const createNearMissSchema = Joi.object({
  plantId: Joi.string().uuid().required(),
  departmentId: Joi.string().uuid().optional().allow(null),
  responsibleDepartmentId: Joi.string().uuid().optional().allow(null),
  title: Joi.string().max(255).required(),
  description: Joi.string().required(),
  location: Joi.string().max(255).optional(),
  severityLevel: Joi.string().required(),
  status: nearMissStatus,
  immediateAction: Joi.string().optional(),
  furtherInvestigationRequired: Joi.boolean().optional().allow(null),
  reportedInHazard: Joi.boolean().optional().allow(null),
  remarks: remarksValue.optional().allow('', null),
  reportedAt: Joi.date().iso().optional(),
  metadata: metadataSchema.optional(),
});

const updateNearMissSchema = Joi.object({
  plantId: Joi.string().uuid().optional(),
  departmentId: Joi.string().uuid().optional().allow(null),
  responsibleDepartmentId: Joi.string().uuid().optional().allow(null),
  title: Joi.string().max(255).optional(),
  description: Joi.string().optional(),
  location: Joi.string().max(255).optional(),
  severityLevel: Joi.string().optional(),
  status: nearMissStatus,
  immediateAction: Joi.string().optional(),
  furtherInvestigationRequired: Joi.boolean().optional().allow(null),
  reportedInHazard: Joi.boolean().optional().allow(null),
  remarks: remarksValue.optional().allow('', null),
  rootCause: Joi.string().optional(),
  assignedTo: Joi.string().uuid().optional().allow(null),
  reportedAt: Joi.date().iso().optional(),
  metadata: metadataSchema.optional(),
}).min(1);

const updateNearMissStatusSchema = Joi.object({
  status: Joi.string().valid('draft', 'submitted', 'under_review', 'closed').required(),
});

module.exports = {
  createNearMissSchema,
  updateNearMissSchema,
  updateNearMissStatusSchema,
};
