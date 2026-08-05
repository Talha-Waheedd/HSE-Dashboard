'use strict';

const Joi = require('joi');

const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(20),
  sort: Joi.string().optional(),
  search: Joi.string().max(255).optional().allow(''),
  filter: Joi.object().unknown(true).optional(),
}).unknown(true); // Allow domain-specific filters to pass through

const uuidParamSchema = Joi.object({
  id: Joi.string().uuid().required(),
});

module.exports = { paginationSchema, uuidParamSchema };
