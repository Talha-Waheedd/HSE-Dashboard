'use strict';

const Joi = require('joi');
const TrainingType = require('../../shared/enums/TrainingType');
const TrainingStatus = require('../../shared/enums/TrainingStatus');

const createTrainingSchema = Joi.object({
  plantId: Joi.string().uuid().required(),
  departmentId: Joi.string().uuid().optional().allow(null),
  title: Joi.string().max(255).required(),
  description: Joi.string().optional(),
  trainingType: Joi.string().valid(...Object.values(TrainingType)).required(),
  scheduledDate: Joi.date().iso().required(),
  scheduledTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/).optional(),
  durationMinutes: Joi.number().integer().min(1).optional(),
  venue: Joi.string().max(255).optional(),
  maxAttendees: Joi.number().integer().min(1).optional(),
  notes: Joi.string().optional(),
  status: Joi.string().valid(TrainingStatus.SCHEDULED, TrainingStatus.IN_PROGRESS).default(TrainingStatus.SCHEDULED).optional(),
});

const updateTrainingSchema = Joi.object({
  plantId: Joi.string().uuid().optional(),
  departmentId: Joi.string().uuid().optional().allow(null),
  title: Joi.string().max(255).optional(),
  description: Joi.string().optional(),
  trainingType: Joi.string().valid(...Object.values(TrainingType)).optional(),
  scheduledDate: Joi.date().iso().optional(),
  scheduledTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/).optional(),
  durationMinutes: Joi.number().integer().min(1).optional(),
  venue: Joi.string().max(255).optional(),
  maxAttendees: Joi.number().integer().min(1).optional(),
  notes: Joi.string().optional(),
  status: Joi.string().valid(...Object.values(TrainingStatus)).optional(),
}).min(1);

const addAttendeeSchema = Joi.object({
  userId: Joi.string().uuid().required(),
});

const markAttendanceSchema = Joi.object({
  attended: Joi.boolean().required(),
  signatureUrl: Joi.string().uri().max(500).optional(),
  remarks: Joi.string().optional(),
});

module.exports = {
  createTrainingSchema,
  updateTrainingSchema,
  addAttendeeSchema,
  markAttendanceSchema,
};
