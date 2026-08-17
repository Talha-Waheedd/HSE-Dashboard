'use strict';

const trainingService = require('./training.service');
const { ApiResponse, asyncHandler } = require('../../shared/utils/index');
const { Op } = require('sequelize');
const { parsePagination, parseOrder, paginationMeta, addTextSearch, sendCsvExport } = require('../../shared/utils/pagination');
const { TrainingSession } = require('../../database/models');

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
  const pagination = parsePagination(req.query);
  const options = {
    ...pagination,
    where: {},
  };
  
  // Be defensive with shared frontend filters. "All" is a UI placeholder,
  // not a valid database value and must not turn a populated table into zero
  // results if a client sends it.
  if (req.query.plantId && req.query.plantId !== 'All') options.where.plantId = req.query.plantId;
  if (req.query.departmentId && req.query.departmentId !== 'All') options.where.departmentId = req.query.departmentId;
  if (req.query.status && req.query.status !== 'All') options.where.status = req.query.status;
  if (req.query.trainingType && req.query.trainingType !== 'All') options.where.trainingType = req.query.trainingType;
  addTextSearch(options.where, req.query.search, ['title', 'description', 'trainer_name'], TrainingSession);
  options.order = parseOrder(req.query, { date: 'scheduledDate', scheduledDate: 'scheduledDate', createdAt: 'createdAt' }, ['scheduledDate', 'DESC']);
  if (req.query.year && /^\d{4}$/.test(req.query.year)) options.where.scheduledDate = { [Op.between]: [`${req.query.year}-01-01`, `${req.query.year}-12-31`] };
  if (req.query.month && /^\d{1,2}$/.test(req.query.month)) {
    const year = String(req.query.year || new Date().getFullYear()); const month = String(req.query.month).padStart(2, '0');
    options.where.scheduledDate = { [Op.between]: [`${year}-${month}-01`, `${year}-${month}-31`] };
  }

  const sessions = await trainingService.getAllSessions(options);
  res.status(200).json(ApiResponse.success(sessions.rows, 'Training sessions retrieved successfully', paginationMeta({ ...pagination, total: sessions.count })));
});

/**
 * Get training session by ID
 */
const getSessionById = asyncHandler(async (req, res) => {
  const session = await trainingService.getSessionById(req.params.id);
  res.status(200).json(ApiResponse.success(session, 'Training session retrieved successfully'));
});
const exportSessions = asyncHandler(async (req, res) => {
  const where = {};
  if (req.query.plantId) where.plantId = req.query.plantId;
  if (req.query.departmentId) where.departmentId = req.query.departmentId;
  if (req.query.status && req.query.status !== 'All') where.status = req.query.status;
  addTextSearch(where, req.query.search, ['title', 'description', 'trainer_name'], TrainingSession);
  await sendCsvExport(res, TrainingSession, { where, order: parseOrder(req.query, { date: 'scheduledDate', createdAt: 'createdAt' }, ['scheduledDate', 'DESC']) }, `trainings-${new Date().toISOString().slice(0, 10)}.csv`);
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
  exportSessions,
  updateSession,
  deleteSession,
  addAttendee,
  markAttendance,
};
