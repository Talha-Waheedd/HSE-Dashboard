'use strict';

/**
 * Builds pagination metadata and Sequelize limit/offset values.
 *
 * @param {object} query - Express req.query
 * @param {number} [query.page=1]
 * @param {number} [query.limit=20]
 * @param {number} total - Total number of records matching the filter
 * @returns {{ limit: number, offset: number, meta: object }}
 */
const buildPagination = (query, total = 0) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit || query.pageSize, 10) || 20));
  const offset = query.offset !== undefined
    ? Math.max(0, parseInt(query.offset, 10) || 0)
    : (page - 1) * limit;
  const totalPages = Math.ceil(total / limit);

  return {
    limit,
    offset,
    meta: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

module.exports = { buildPagination };
