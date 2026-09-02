'use strict';

const Joi = require('joi');

const password = Joi.string()
  .min(8)
  .max(128)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
  .messages({ 'string.pattern.base': 'Password must contain uppercase, lowercase, number and special character' });

const createUserSchema = Joi.object({
  firstName: Joi.string().trim().min(1).max(100)
    .required(),
  lastName: Joi.string().trim().min(1).max(100)
    .required(),
  email: Joi.string().email().lowercase().trim()
    .required(),
  password: password.allow('', null).optional(),
  phone: Joi.string().max(20).allow('', null).optional(),
  status: Joi.boolean().default(true),
  roleId: Joi.string().uuid().allow(null, '').optional(),
  employeeId: Joi.string().trim().max(50).allow('', null)
    .optional(),
  departmentId: Joi.string().uuid().allow(null, '').optional(),
  plantId: Joi.string().uuid().allow(null, '').optional(),
  designation: Joi.string().trim().max(150).allow('', null)
    .optional(),
}).with('departmentId', 'employeeId');

const updateUserSchema = Joi.object({
  firstName: Joi.string().min(1).max(100).optional(),
  lastName: Joi.string().min(1).max(100).optional(),
  phone: Joi.string().max(20).optional().allow(null, ''),
  email: Joi.string().email().lowercase().trim()
    .optional(),
  status: Joi.boolean().optional(),
  roleId: Joi.string().uuid().optional(),
  password: password.optional(),
  employeeId: Joi.string().trim().max(50).optional(),
  departmentId: Joi.string().uuid().allow(null, '').optional(),
  plantId: Joi.string().uuid().allow(null, '').optional(),
  designation: Joi.string().trim().max(150).allow('', null)
    .optional(),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .required(),
});

module.exports = { createUserSchema, updateUserSchema, changePasswordSchema };
