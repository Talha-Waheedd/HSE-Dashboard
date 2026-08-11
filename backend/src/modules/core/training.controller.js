'use strict';

const trainingService = require('./training.service');
const { ApiResponse, asyncHandler } = require('../../shared/utils/index');
const { Op } = require('sequelize');

/**
 * Create a new training session
 */
const createSession = asyncHandler(async (req, res) => {
  const session = await trainingService.createSession(req.body, req.user.id);
  res.status(201).json(ApiResponse.success(session, 'Training session created successfully', 201));
});

/**
 * Get all training sessions
 */
const getAllSessions = asyncHandler(async (req, res) => {
  const options = {
    limit: Math.min(parseInt(req.query.limit, 10) || 1000, 5000),
    offset: Math.max(parseInt(req.query.offset, 10) || 0, 0),
    where: {},
  };
  
  if (req.query.plantId) options.where.plantId = req.query.plantId;
  if (req.query.departmentId) options.where.departmentId = req.query.departmentId;
  if (req.query.status) options.where.status = req.query.status;
  if (req.query.trainingType) options.where.trainingType = req.query.trainingType;
  if (req.query.year && /^\d{4}$/.test(req.query.year)) options.where.scheduledDate = { [Op.between]: [`${req.query.year}-01-01`, `${req.query.year}-12-31`] };
  if (req.query.month && /^\d{1,2}$/.test(req.query.month)) {
    const year = String(req.query.year || new Date().getFullYear()); const month = String(req.query.month).padStart(2, '0');
    options.where.scheduledDate = { [Op.between]: [`${year}-${month}-01`, `${year}-${month}-31`] };
  }

  const sessions = await trainingService.getAllSessions(options);
  res.status(200).json(ApiResponse.success(sessions.rows, 'Training sessions retrieved successfully', { total: sessions.count, limit: options.limit, offset: options.offset }));
});

/**
 * Get training session by ID
 */
const getSessionById = asyncHandler(async (req, res) => {
  const session = await trainingService.getSessionById(req.params.id);
  res.status(200).json(ApiResponse.success(session, 'Training session retrieved successfully'));
});

/**
 * Update training session
 */
const updateSession = asyncHandler(async (req, res) => {
  const count = await trainingService.updateSession(req.params.id, req.body, req.user.id);
  res.status(200).json(ApiResponse.success({ updated: count }, 'Training session updated successfully'));
});

/**
 * Delete training session
 */
const deleteSession = asyncHandler(async (req, res) => {
  await trainingService.deleteSession(req.params.id);
  res.status(200).json(ApiResponse.success(null, 'Training session deleted successfully'));
});

/**
 * Add attendee to session
 */
const addAttendee = asyncHandler(async (req, res) => {
  const attendee = await trainingService.addAttendee(req.params.id, req.body.userId);
  res.status(201).json(ApiResponse.success(attendee, 'Attendee added successfully', 201));
});

/**
 * Mark attendance for user
 */
const markAttendance = asyncHandler(async (req, res) => {
  const result = await trainingService.markAttendance(req.params.id, req.params.userId, req.body, req.user.id);
  res.status(200).json(ApiResponse.success(result, 'Attendance marked successfully'));
});

module.exports = {
  createSession,
  getAllSessions,
  getSessionById,
  updateSession,
  deleteSession,
  addAttendee,
  markAttendance,
};
