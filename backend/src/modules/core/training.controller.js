'use strict';

const trainingService = require('./training.service');
const { ApiResponse, asyncHandler } = require('../../shared/utils/index');
const { Op } = require('sequelize');
const { parsePagination, parseOrder, paginationMeta, addTextSearch, sendCsvExport } = require('../../shared/utils/pagination');
const { TrainingSession, Department } = require('../../database/models');

const isDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));
const buildTrainingWhere = async (query = {}) => {
  const where = {};
  const departmentValue = query.departmentId || query.department;
  if (query.plantId && query.plantId !== 'All') where.plantId = query.plantId;
  if (query.status && query.status !== 'All') where.status = query.status;
  if (query.trainingType && query.trainingType !== 'All') where.trainingType = query.trainingType;
  if (departmentValue && departmentValue !== 'All') {
    const department = await Department.findOne({
      where: { [Op.or]: [{ id: departmentValue }, { code: departmentValue }, { name: departmentValue }] },
      attributes: ['id'],
    });
    where.departmentId = department ? department.id : '__no_matching_department__';
  }
  addTextSearch(where, query.search, ['title', 'description', 'trainer_name'], TrainingSession);
  const year = /^\d{4}$/.test(String(query.year || '')) ? Number(query.year) : null;
  const month = /^(?:[1-9]|1[0-2])$/.test(String(query.month || '')) ? Number(query.month) : null;
  let start = isDate(query.fromDate) ? query.fromDate : (year ? `${year}-01-01` : null);
  let end = isDate(query.toDate) ? query.toDate : (year ? `${year + 1}-01-01` : null);
  if (month) {
    const monthYear = year || new Date().getFullYear();
    start = `${monthYear}-${String(month).padStart(2, '0')}-01`;
    end = new Date(Date.UTC(monthYear, month, 1)).toISOString().slice(0, 10);
  } else if (end && isDate(query.toDate)) {
    const next = new Date(`${end}T00:00:00Z`);
    next.setUTCDate(next.getUTCDate() + 1);
    end = next.toISOString().slice(0, 10);
  }
  if (start || end) {
    where.scheduledDate = {};
    if (start) where.scheduledDate[Op.gte] = start;
    if (end) where.scheduledDate[Op.lt] = end;
  }
  return where;
};

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
  const options = { ...pagination, where: await buildTrainingWhere(req.query) };
  options.order = parseOrder(req.query, { date: 'scheduledDate', scheduledDate: 'scheduledDate', createdAt: 'createdAt' }, ['scheduledDate', 'DESC']);

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
  const where = await buildTrainingWhere(req.query);
  await sendCsvExport(res, TrainingSession, { where, order: parseOrder(req.query, { date: 'scheduledDate', createdAt: 'createdAt' }, ['scheduledDate', 'DESC']) }, `trainings-${new Date().toISOString().slice(0, 10)}.csv`);
});

const getSummary = asyncHandler(async (req, res) => {
  const summary = await trainingService.getSummary(await buildTrainingWhere(req.query));
  res.status(200).json(ApiResponse.success(summary, 'Training summary retrieved successfully'));
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
  getSummary,
  exportSessions,
  updateSession,
  deleteSession,
  addAttendee,
  markAttendance,
};
