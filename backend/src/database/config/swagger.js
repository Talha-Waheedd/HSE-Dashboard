'use strict';

const swaggerJsdoc = require('swagger-jsdoc');
const config = require('./index');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: `${config.appName} API`,
      version: '1.0.0',
      description: 'Production-ready REST API documentation',
      contact: {
        name: 'API Support',
        email: 'support@cblapp.com',
      },
      license: { name: 'MIT' },
    },
    servers: [
      { url: `${config.appUrl}/api/v1`, description: 'Current Environment' },
      { url: 'http://localhost:5000/api/v1', description: 'Local Development' },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer', example: 1 },
            pageSize: { type: 'integer', example: 20 },
            total: { type: 'integer', example: 100 },
            totalPages: { type: 'integer', example: 5 },
          },
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: { type: 'object' },
            meta: { $ref: '#/components/schemas/Pagination' },
          },
        },
        ApiError: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            errors: { type: 'array', items: { type: 'object' } },
          },
        },
      },
    },
    security: [{ BearerAuth: [] }],
  },
  apis: ['./src/api/v1/routes/*.js', './src/api/v1/controllers/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
