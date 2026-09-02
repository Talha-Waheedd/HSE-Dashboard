'use strict';

const Joi = require('joi');

const permissionIds = Joi.array().items(Joi.string().uuid()).unique().max(200);

const createRoleSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100)
    .required(),
  displayName: Joi.string().trim().min(2).max(150)
    .optional(),
  description: Joi.string().trim().max(2000).allow('', null)
    .optional(),
  permissionIds: permissionIds.default([]),
});

const updateRoleSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100)
    .optional(),
  displayName: Joi.string().trim().min(2).max(150)
    .optional(),
  description: Joi.string().trim().max(2000).allow('', null)
    .optional(),
}).min(1);

const updateRolePermissionsSchema = Joi.object({
  permissionIds: permissionIds.required(),
});

module.exports = { createRoleSchema, updateRoleSchema, updateRolePermissionsSchema };
