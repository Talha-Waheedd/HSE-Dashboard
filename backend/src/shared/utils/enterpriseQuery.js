'use strict';

const { Op } = require('sequelize');

const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;

const normalizeIdentifier = (value, fallback) => {
  if (typeof value !== 'string' || !IDENTIFIER.test(value)) return fallback;
  return value;
};

const parsePositiveInteger = (value, fallback, maximum = 1000) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, maximum);
};

/**
 * Shared query contract for enterprise list endpoints.
 * Field names must be supplied through allowlists; user input is never used
 * directly as a SQL identifier.
 */
const buildEnterpriseQuery = (query = {}, options = {}) => {
  const {
    searchFields = [],
    filterFields = [],
    sortFields = ['created_at'],
    defaultSort = 'created_at',
  } = options;

  const page = parsePositiveInteger(query.page, 1, 1000000);
  const limit = parsePositiveInteger(query.limit || query.pageSize, 20, 100);
  const where = {};
  const search = typeof query.search === 'string' ? query.search.trim() : '';

  if (search && searchFields.length) {
    where[Op.or] = searchFields
      .filter((field) => IDENTIFIER.test(field))
      .map((field) => ({ [field]: { [Op.like]: `%${search}%` } }));
  }

  filterFields.forEach((field) => {
    const value = query[field];
    if (value !== undefined && value !== null && value !== '') {
      where[field] = Array.isArray(value) ? { [Op.in]: value } : value;
    }
  });

  if (query.from || query.to) {
    const dateField = normalizeIdentifier(options.dateField, 'created_at');
    where[dateField] = {};
    if (query.from) where[dateField][Op.gte] = query.from;
    if (query.to) where[dateField][Op.lte] = query.to;
  }

  const requestedSort = typeof query.sort === 'string' ? query.sort : defaultSort;
  const requestedOrder = String(query.order || '').toLowerCase() === 'desc' ? 'DESC' : 'ASC';
  const sort = sortFields.includes(requestedSort) ? requestedSort : defaultSort;

  return {
    where,
    order: [[sort, requestedOrder]],
    limit,
    offset: (page - 1) * limit,
    page,
    meta: { page, limit },
  };
};

module.exports = { buildEnterpriseQuery };

