const Joi = require('joi');

const dashboardAnalyticsParamsSchema = Joi.object({
  dataset: Joi.string().valid('incidents', 'hazards', 'near-misses', 'training', 'capa', 'audits', 'fire').required(),
});

const dashboardAnalyticsQuerySchema = Joi.object({
  groupBy: Joi.string().pattern(/^[A-Za-z]+$/).max(40).optional(),
  metric: Joi.string().valid('count', 'sessions', 'manhours', 'participants').optional(),
  year: Joi.alternatives().try(
    Joi.number().integer().min(1900).max(2200),
    Joi.string().valid('All'),
  ).optional(),
  fromDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
  toDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
  department: Joi.string().max(150).optional(),
  location: Joi.string().max(255).optional(),
  status: Joi.string().max(80).optional(),
  severity: Joi.string().max(80).optional(),
  plantId: Joi.string().uuid().optional(),
  limit: Joi.number().integer().min(1).max(20)
    .optional(),
});

module.exports = { dashboardAnalyticsParamsSchema, dashboardAnalyticsQuerySchema };
