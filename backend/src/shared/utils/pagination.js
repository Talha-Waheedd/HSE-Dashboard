'use strict';

const { Op } = require('sequelize');

const parsePagination = (query = {}, defaults = {}) => {
  const rawPage = query.page ?? 1;
  const rawLimit = query.limit ?? query.pageSize ?? defaults.defaultLimit ?? 10;
  const page = Number(rawPage);
  const limit = Number(rawLimit);
  if (!Number.isInteger(page) || page < 1) {
    const error = new Error('page must be a positive integer'); error.statusCode = 400; throw error;
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > (defaults.maxLimit || 100)) {
    const error = new Error(`limit must be an integer between 1 and ${defaults.maxLimit || 100}`); error.statusCode = 400; throw error;
  }
  return { page, limit, offset: (page - 1) * limit };
};

const parseOrder = (query = {}, allowed = {}, fallback = ['createdAt', 'DESC']) => {
  const key = String(query.sortBy || query.sort || '').trim();
  const direction = String(query.sortOrder || query.order || '').toUpperCase();
  const field = allowed[key] || fallback[0];
  return [[field, direction === 'ASC' ? 'ASC' : fallback[1] || 'DESC'], ['id', 'DESC']];
};

const paginationMeta = ({ page, limit, total }) => ({
  currentPage: page,
  pageSize: limit,
  totalRecords: Number(total) || 0,
  totalPages: Math.max(1, Math.ceil((Number(total) || 0) / limit)),
});

// Backward-compatible adapter used by the users/notifications modules.
const buildPagination = (query = {}, defaultLimit = 20) => {
  const requested = query.limit ?? query.pageSize ?? defaultLimit;
  const limit = Math.min(Math.max(Number(requested) || defaultLimit, 1), 100);
  const page = Math.max(Number(query.page) || 1, 1);
  const offset = (page - 1) * limit;
  return { page, limit, offset, meta: { currentPage: page, pageSize: limit } };
};

const addTextSearch = (where, query, fields, Model) => {
  const search = String(query || '').trim().slice(0, 255);
  if (!search || !fields.length) return;
  const escaped = Model.sequelize.escape(`%${search}%`);
  where[Op.and] = [...(where[Op.and] || []), {
    [Op.or]: fields.map((field) => Model.sequelize.literal(`CAST(\`${field}\` AS CHAR) LIKE ${escaped}`)),
  }];
};

module.exports = { parsePagination, parseOrder, paginationMeta, addTextSearch, buildPagination };

module.exports.toCsv = (rows) => {
  const values = rows.map((row) => (typeof row.toJSON === 'function' ? row.toJSON() : row));
  const keys = [...new Set(values.flatMap((row) => Object.keys(row)))];
  const quote = (value) => `"${String(value == null ? '' : typeof value === 'object' ? JSON.stringify(value) : value).replace(/"/g, '""')}"`;
  return [keys.map(quote).join(','), ...values.map((row) => keys.map((key) => quote(row[key])).join(','))].join('\n');
};

module.exports.sendCsvExport = async (res, Model, options, filename) => {
  res.set({ 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${filename}"` });
  res.write('\uFEFF');
  let offset = 0;
  let keys = null;
  while (true) {
    const batch = await Model.findAll({ ...options, raw: true, limit: 500, offset });
    if (!batch.length) break;
    if (!keys) {
      keys = [...new Set(batch.flatMap((row) => Object.keys(row)))];
      const quote = (value) => `"${String(value == null ? '' : value).replace(/"/g, '""')}"`;
      res.write(`${keys.map(quote).join(',')}\n`);
    }
    const quote = (value) => `"${String(value == null ? '' : typeof value === 'object' ? JSON.stringify(value) : value).replace(/"/g, '""')}"`;
    for (const row of batch) res.write(`${keys.map((key) => quote(row[key])).join(',')}\n`);
    offset += batch.length;
    if (batch.length < 500) break;
  }
  res.end();
};
