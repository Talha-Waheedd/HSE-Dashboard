'use strict';

/**
 * BaseRepository — Generic CRUD abstraction.
 * All feature repositories extend this class and only override what they need.
 * Services interact with repositories via this interface.
 */
class BaseRepository {
  /**
   * @param {import('sequelize').Model} model - Sequelize model class
   */
  constructor(model) {
    this.model = model;
  }

  /**
   * Find a single record by primary key.
   * @param {string} id
   * @param {object} options - Sequelize find options (include, attributes, etc.)
   */
  async findById(id, options = {}) {
    return this.model.findByPk(id, options);
  }

  /**
   * Find a single record matching conditions.
   */
  async findOne(where, options = {}) {
    return this.model.findOne({ where, ...options });
  }

  /**
   * Find all records matching conditions with pagination.
   * @returns {{ rows: Array, count: number }}
   */
  async findAndCountAll(options = {}) {
    return this.model.findAndCountAll(options);
  }

  /**
   * Find all records matching conditions.
   */
  async findAll(options = {}) {
    return this.model.findAll(options);
  }

  /**
   * Find all records matching a where clause (convenience wrapper).
   * Used by PlantRepository, DepartmentRepository, CorrectiveActionRepository, AttachmentRepository.
   * @param {object} where - Sequelize where clause
   * @param {object} options - Additional find options (order, include, etc.)
   */
  async findMany(where, options = {}) {
    return this.model.findAll({ where, ...options });
  }

  /**
   * Create a new record.
   * @param {object} data
   * @param {object} options - Pass `{ transaction }` for transactional creates
   */
  async create(data, options = {}) {
    return this.model.create(data, options);
  }

  /**
   * Bulk create records.
   */
  async bulkCreate(data, options = {}) {
    return this.model.bulkCreate(data, options);
  }

  /**
   * Update records matching where clause.
   * @returns {[number]} Number of affected rows
   */
  async update(data, where, options = {}) {
    return this.model.update(data, { where, ...options });
  }

  /**
   * Soft-delete a record (sets deletedAt if paranoid: true).
   */
  async delete(where, options = {}) {
    return this.model.destroy({ where, ...options });
  }

  /**
   * Update a single record by its primary key.
   * Convenience wrapper for the HSE service calling convention: updateById(id, data).
   * @param {string|number} id - Primary key value
   * @param {object} data - Fields to update
   * @param {object} options - Additional options (e.g., { transaction })
   * @returns {[number]} Number of affected rows
   */
  async updateById(id, data, options = {}) {
    return this.model.update(data, { where: { id }, ...options });
  }

  /**
   * Soft-delete a single record by its primary key.
   * Convenience wrapper for the HSE service calling convention: deleteById(id).
   * @param {string|number} id - Primary key value
   * @param {object} options - Additional options
   */
  async deleteById(id, options = {}) {
    return this.model.destroy({ where: { id }, ...options });
  }

  /**
   * Hard-delete a record (ignores paranoid).
   */
  async hardDelete(where) {
    return this.model.destroy({ where, force: true });
  }

  /**
   * Count records matching conditions.
   */
  async count(where = {}) {
    return this.model.count({ where });
  }

  /**
   * Check if a record exists.
   */
  async exists(where) {
    const count = await this.count(where);
    return count > 0;
  }
}

module.exports = BaseRepository;
