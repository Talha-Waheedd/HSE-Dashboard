'use strict';

const BaseRepository = require('./base.repository');
const { Attachment, User } = require('../database/models');

class AttachmentRepository extends BaseRepository {
  constructor() {
    super(Attachment);
  }

  /**
   * Get attachments for a specific source record (polymorphic)
   * @param {string} sourceType
   * @param {string} sourceId
   * @returns {Promise<Array>}
   */
  async getBySource(sourceType, sourceId) {
    return this.findMany({ sourceType, sourceId }, {
      include: [
        { model: User, as: 'uploader', attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
      order: [['createdAt', 'DESC']],
    });
  }
}

module.exports = new AttachmentRepository();
