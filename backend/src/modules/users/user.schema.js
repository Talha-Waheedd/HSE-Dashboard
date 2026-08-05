'use strict';

const Joi = require('joi');

const updateUserSchema = Joi.object({
  firstName: Joi.string().min(1).max(100).optional(),
  lastName: Joi.string().min(1).max(100).optional(),
  phone: Joi.string().max(20).optional().allow(null, ''),
  email: Joi.string().email().lowercase().trim().optional(),
  status: Joi.boolean().optional(),
  roleId: Joi.string().uuid().optional(),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .required(),
});

module.exports = { updateUserSchema, changePasswordSchema };
