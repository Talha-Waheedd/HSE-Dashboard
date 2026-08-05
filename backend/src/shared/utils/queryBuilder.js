'use strict';

const { Op } = require('sequelize');

/**
 * Converts query string parameters into Sequelize where/order clauses.
 *
 * Supports:
 *  - ?search=john          → searches searchFields (LIKE %john%)
 *  - ?sort=-createdAt      → ORDER BY created_at DESC (prefix - = DESC)
 *  - ?sort=firstName       → ORDER BY first_name ASC
 *  - ?filter[status]=active → WHERE status = 'active'
 *
 * @param {object} query - req.query
 * @param {string[]} searchFields - Model fields to apply LIKE search on
 * @returns {{ where: object, order: Array }}
 */
const buildQuery = (query, searchFields = []) => {
  const where = {};
  const order = [];

  // ─── Search ────────────────────────────────────────────────────────────────
  if (query.search && searchFields.length > 0) {
    where[Op.or] = searchFields.map((field) => ({
      [field]: { [Op.like]: `%${query.search}%` },
    }));
  }

  // ─── Filters ───────────────────────────────────────────────────────────────
  if (query.filter && typeof query.filter === 'object') {
    Object.entries(query.filter).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        where[key] = value;
      }
    });
  }

  // ─── Sorting ───────────────────────────────────────────────────────────────
  if (query.sort) {
    const sortFields = query.sort.split(',');
    sortFields.forEach((field) => {
      const trimmed = field.trim();
      if (trimmed.startsWith('-')) {
        order.push([trimmed.slice(1), 'DESC']);
      } else {
        order.push([trimmed, 'ASC']);
      }
    });
  } else {
    order.push(['createdAt', 'DESC']); // Default sort
  }

  return { where, order };
};

module.exports = { buildQuery };
