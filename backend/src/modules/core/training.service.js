'use strict';

const trainingRepository = require('../../repositories/training.repository');
const plantRepository = require('../../repositories/plant.repository');
const TrainingStatus = require('../../shared/enums/TrainingStatus');
const { ApiError } = require('../../shared/utils/index');
const { MESSAGES } = require('../../shared/constants');
const { sequelize } = require('../../database/connection');
const { Department } = require('../../database/models');

const dateOnly = (value) => {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  const match = String(value).match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
};

const todayDateOnly = () => {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');
};

/**
 * A manually registered training is evidence of an event on its stated date:
 * today/past records are completed, while future records remain scheduled.
 * Explicit workflow states that cannot be inferred from a date are preserved.
 */
const statusForTrainingDate = (scheduledDate, requestedStatus) => {
  const preservedStatuses = [
    TrainingStatus.DRAFT,
    TrainingStatus.CANCELLED,
    TrainingStatus.IN_PROGRESS,
  ];
  if (preservedStatuses.includes(requestedStatus)) {
    return requestedStatus;
  }
  const scheduledDateOnly = dateOnly(scheduledDate);
  if (!scheduledDateOnly) return requestedStatus || TrainingStatus.SCHEDULED;
  return scheduledDateOnly <= todayDateOnly()
    ? TrainingStatus.COMPLETED
    : TrainingStatus.SCHEDULED;
};

class TrainingService {
  assertRegisteredTrainingIsComplete(data) {
    if (!String(data.title || '').trim()) throw ApiError.badRequest('title is required before a training draft can be registered.');
    if (!data.trainingType) throw ApiError.badRequest('trainingType is required before a training draft can be registered.');
    if (!data.scheduledDate) throw ApiError.badRequest('scheduledDate is required before a training draft can be registered.');
    if (!Number.isInteger(Number(data.durationMinutes)) || Number(data.durationMinutes) < 1) throw ApiError.badRequest('durationMinutes must be a positive integer before a training draft can be registered.');
    if (!Number.isInteger(Number(data.participantCount)) || Number(data.participantCount) < 1) throw ApiError.badRequest('participantCount must be a positive integer before a training draft can be registered.');
  }

  /**
   * Create a new training session
   */
  async createSession(data, userId) {
    return sequelize.transaction(async (transaction) => {
      const plant = await plantRepository.findById(data.plantId, { transaction });
      if (!plant) throw ApiError.notFound(MESSAGES.PLANT_NOT_FOUND);
      if (data.departmentId) {
        const department = await Department.findOne({ where: { id: data.departmentId, isActive: true }, attributes: ['id'], transaction });
        if (!department) throw ApiError.badRequest('departmentId must reference an active department.');
      }
      if (!Object.values(TrainingStatus).includes(data.status)) data.status = TrainingStatus.SCHEDULED;
      data.status = statusForTrainingDate(data.scheduledDate, data.status);
      if (data.status !== TrainingStatus.DRAFT) this.assertRegisteredTrainingIsComplete(data);
      const participants = Number(data.participantCount);
      const durationMinutes = Number(data.durationMinutes);
      const hasManhourInputs = Number.isFinite(participants) && participants > 0 && Number.isFinite(durationMinutes) && durationMinutes > 0;
      data.manhours = hasManhourInputs ? Number((participants * durationMinutes / 60).toFixed(2)) : null;
      data.trainerId = userId; // In this design, the creator is the trainer (could be decoupled later)
      data.createdBy = userId;
      return trainingRepository.create(data, { transaction });
    });
  }

  /**
   * Get all training sessions
   */
  async getAllSessions(options = {}) {
    const order = options.order || [['scheduledDate', 'DESC'], ['createdAt', 'DESC'], ['id', 'DESC']];
    return trainingRepository.findAndCountAll({ ...options, include: [{ model: Department, as: 'department', attributes: ['id', 'name', 'code'] }], distinct: true, order });
  }

  async getSummary(where = {}) {
    const { literal } = require('sequelize');
    const row = await trainingRepository.model.findOne({
      where, raw: true,
      attributes: [
        [literal("COALESCE(SUM(CASE WHEN status <> 'draft' THEN 1 ELSE 0 END), 0)"), 'totalRecords'],
        [literal("COALESCE(SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END), 0)"), 'draftRecords'],
        [literal("COALESCE(SUM(CASE WHEN status IN ('scheduled','in_progress') THEN 1 ELSE 0 END), 0)"), 'pendingRecords'],
        [literal("COALESCE(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END), 0)"), 'completedRecords'],
        [literal("COALESCE(SUM(CASE WHEN status <> 'draft' THEN COALESCE(manhours, participant_count * duration_minutes / 60, 0) ELSE 0 END), 0)"), 'totalManhours'],
      ],
    });
    const value = (key) => Number(row?.[key] || 0);
    return { totalRecords: value('totalRecords'), draftRecords: value('draftRecords'), totalManhours: value('totalManhours'), pendingRecords: value('pendingRecords'), completedRecords: value('completedRecords'), attendanceRate: null };
  }

  /**
   * Get session by ID
   */
  async getSessionById(id) {
    const session = await trainingRepository.getDetails(id);
    if (!session) {
      throw ApiError.notFound(MESSAGES.TRAINING_NOT_FOUND);
    }
    return session;
  }

  /**
   * Update session
   */
  async updateSession(id, updateData, userId) {
    const session = await this.getSessionById(id);

    if (updateData.plantId && updateData.plantId !== session.plantId) {
      const plant = await plantRepository.findById(updateData.plantId);
      if (!plant) throw ApiError.notFound(MESSAGES.PLANT_NOT_FOUND);
    }

    if (updateData.departmentId) {
      const department = await Department.findOne({ where: { id: updateData.departmentId, isActive: true }, attributes: ['id'] });
      if (!department) throw ApiError.badRequest('departmentId must reference an active department.');
    }

    const mergedData = {
      ...session.toJSON(),
      ...updateData,
    };
    const nextStatus = statusForTrainingDate(
      mergedData.scheduledDate,
      updateData.status ?? session.status,
    );
    updateData.status = nextStatus;
    if (nextStatus !== TrainingStatus.DRAFT) this.assertRegisteredTrainingIsComplete(mergedData);
    const participants = mergedData.participantCount;
    const durationMinutes = mergedData.durationMinutes;
    if (Number.isFinite(Number(participants)) && Number(participants) > 0 && Number.isFinite(Number(durationMinutes)) && Number(durationMinutes) > 0) {
      updateData.manhours = Number((Number(participants) * Number(durationMinutes) / 60).toFixed(2));
    } else {
      updateData.manhours = null;
    }

    updateData.updatedBy = userId;
    return trainingRepository.updateById(id, updateData);
  }

  /**
   * Delete session
   */
  async deleteSession(id) {
    await this.getSessionById(id);
    return trainingRepository.deleteById(id);
  }

  /**
   * Add attendee to session
   */
  async addAttendee(sessionId, userId) {
    const session = await this.getSessionById(sessionId);
    
    // Check capacity
    if (session.maxAttendees) {
      const attendees = await trainingRepository.getAttendees(sessionId);
      if (attendees.length >= session.maxAttendees) {
        throw ApiError.badRequest('Training session is at full capacity');
      }
    }

    try {
      return await trainingRepository.addAttendee({ sessionId, userId });
    } catch (error) {
      // Handle unique constraint violation gracefully
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw ApiError.conflict('User is already registered for this session');
      }
      throw error;
    }
  }

  /**
   * Mark attendance
   */
  async markAttendance(sessionId, userId, attendanceData, markedBy) {
    await this.getSessionById(sessionId);
    
    const data = {
      ...attendanceData,
      markedBy,
    };
    
    const count = await trainingRepository.updateAttendance(sessionId, userId, data);
    if (count === 0) {
      throw ApiError.notFound('Attendee not found in this session');
    }
    
    return { success: true };
  }
}

module.exports = new TrainingService();
module.exports.statusForTrainingDate = statusForTrainingDate;
