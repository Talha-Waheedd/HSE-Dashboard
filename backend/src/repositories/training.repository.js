'use strict';

const BaseRepository = require('./base.repository');
const { TrainingSession, TrainingAttendee, User, Department, Plant } = require('../database/models');

class TrainingRepository extends BaseRepository {
  constructor() {
    super(TrainingSession);
  }

  /**
   * Get training session details with relations and attendees
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async getDetails(id) {
    return this.findById(id, {
      include: [
        { model: User, as: 'trainer', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Department, as: 'department', attributes: ['id', 'name'] },
        { model: Plant, as: 'plant', attributes: ['id', 'name', 'code'] },
        {
          model: TrainingAttendee,
          as: 'attendees',
          include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] }],
        },
      ],
    });
  }

  /**
   * Get attendees for a specific session
   * @param {string} sessionId
   * @returns {Promise<Array>}
   */
  async getAttendees(sessionId) {
    return TrainingAttendee.findAll({
      where: { sessionId },
      include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] }],
    });
  }

  /**
   * Add attendee to a session
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async addAttendee(data) {
    return TrainingAttendee.create(data);
  }

  /**
   * Mark attendance for a user in a session
   * @param {string} sessionId
   * @param {string} userId
   * @param {Object} data - { attended: boolean, signatureUrl: string, remarks: string, markedBy: string }
   * @returns {Promise<number>} - Array with affected rows count
   */
  async updateAttendance(sessionId, userId, data) {
    return TrainingAttendee.update(
      { ...data, markedAt: new Date() },
      { where: { sessionId, userId } }
    );
  }
}

module.exports = new TrainingRepository();
