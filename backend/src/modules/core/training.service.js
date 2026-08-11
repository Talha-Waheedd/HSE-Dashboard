'use strict';

const trainingRepository = require('../../repositories/training.repository');
const plantRepository = require('../../repositories/plant.repository');
const TrainingStatus = require('../../shared/enums/TrainingStatus');
const { ApiError } = require('../../shared/utils/index');
const { MESSAGES } = require('../../shared/constants');
const { sequelize } = require('../../database/connection');
const { Department } = require('../../database/models');

class TrainingService {
  /**
   * Create a new training session
   */
  async createSession(data, userId) {
    const plant = await plantRepository.findById(data.plantId);
    if (!plant) {
      throw ApiError.notFound(MESSAGES.PLANT_NOT_FOUND);
    }

    data.trainerId = userId; // In this design, the creator is the trainer (could be decoupled later)
    data.createdBy = userId;
    
    if (![TrainingStatus.SCHEDULED, TrainingStatus.IN_PROGRESS].includes(data.status)) {
      data.status = TrainingStatus.SCHEDULED;
    }

    return trainingRepository.create(data);
  }

  /**
   * Get all training sessions
   */
  async getAllSessions(options = {}) {
    return trainingRepository.findAndCountAll({ ...options, include: [{ model: Department, as: 'department', attributes: ['id', 'name', 'code'] }], distinct: true, order: [['scheduledDate', 'DESC'], ['createdAt', 'DESC']] });
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
