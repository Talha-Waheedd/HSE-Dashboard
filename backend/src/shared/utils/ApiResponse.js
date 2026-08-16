'use strict';

/**
 * Standardized API response wrapper.
 * All controllers must use this class to ensure consistent response shape.
 */
class ApiResponse {
  /**
   * @param {boolean} success
   * @param {string} message
   * @param {any} data
   * @param {object|null} meta - Pagination or extra metadata
   */
  constructor(success, message, data = null, meta = null) {
    this.success = success;
    this.message = message;
    if (data !== null) this.data = data;
    if (meta !== null) this.meta = meta;
  }

  /**
   * Build a success response
   * @param {any} data
   * @param {string} message
   * @param {object|null} meta
   */
  static success(data = null, message = 'Success', meta = null) {
    // Older controllers passed the HTTP status (201) as the third argument.
    // HTTP status is already set on the Express response and must never leak
    // into the API metadata contract.
    const normalizedMeta = typeof meta === 'number' ? null : meta;
    return new ApiResponse(true, message, data, normalizedMeta);
  }

  /**
   * Build an error response
   * @param {string} message
   * @param {Array} errors - Validation errors or details
   */
  static error(message, errors = null) {
    const response = new ApiResponse(false, message);
    if (errors) response.errors = errors;
    return response;
  }

  /**
   * Build a paginated success response
   * @param {Array} data
   * @param {string} message
   * @param {object} pagination - { page, pageSize, total, totalPages }
   */
  static paginated(data, message = 'Success', pagination = null) {
    return new ApiResponse(true, message, data, pagination || {
      page: 1,
      limit: data?.length || 0,
      total: data?.length || 0,
    });
  }
}

module.exports = ApiResponse;
