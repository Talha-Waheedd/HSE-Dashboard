'use strict';

const ApiResponse = require('../../shared/utils/ApiResponse');
const { HTTP_STATUS } = require('../../shared/constants/httpStatus');
const { MESSAGES } = require('../../shared/constants/messages');

/**
 * Validate middleware factory.
 * Runs a Joi schema against a part of the request.
 *
 * @param {import('joi').Schema} schema - Joi schema
 * @param {'body'|'query'|'params'} source - Which part of req to validate
 * @returns Express middleware
 *
 * @example
 * router.post('/login', validate(loginSchema, 'body'), AuthController.login);
 */
const validate = (schema, source = 'body') => (req, res, next) => {
  const { error, value } = schema.validate(req[source], {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
  });

  if (error) {
    const errors = error.details.map((d) => ({
      field: d.path.join('.'),
      message: d.message.replace(/['"]/g, ''),
    }));

    return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json(
      ApiResponse.error(MESSAGES.VALIDATION_ERROR, errors),
    );
  }

  req[source] = value; // Use the sanitized/converted value
  return next();
};

module.exports = { validate };
