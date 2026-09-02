'use strict';

const { Op } = require('sequelize');
const service = require('./location.service');
const { ApiResponse, asyncHandler } = require('../../shared/utils/index');
const { parsePagination, parseOrder, paginationMeta } = require('../../shared/utils/pagination');

const list = asyncHandler(async (req, res) => {
  const pagination = parsePagination(req.query, { defaultLimit: 25 });
  const where = req.query.isActive === undefined ? {} : { isActive: req.query.isActive === 'true' };
  const query = String(req.query.q || '').trim().slice(0, 100);
  if (query) where[Op.or] = [{ name: { [Op.like]: `%${query}%` } }, { code: { [Op.like]: `%${query}%` } }];
  const result = await service.list({ ...pagination, where, order: parseOrder(req.query, { name: 'name', createdAt: 'createdAt' }, ['name', 'ASC']) });
  res.json(ApiResponse.success(result.rows, 'Locations retrieved successfully', paginationMeta({ ...pagination, total: result.count })));
});
const get = asyncHandler(async (req, res) => res.json(ApiResponse.success(await service.get(req.params.id), 'Location retrieved successfully')));
const create = asyncHandler(async (req, res) => res.status(201).json(ApiResponse.success(await service.create(req.body, req.user.id), 'Location created successfully')));
const update = asyncHandler(async (req, res) => res.json(ApiResponse.success(await service.update(req.params.id, req.body, req.user.id), 'Location updated successfully')));
const remove = asyncHandler(async (req, res) => {
  const location = await service.remove(req.params.id, req.user.id);
  res.json(ApiResponse.success(location, 'Location deactivated successfully'));
});
module.exports = {
  list, get, create, update, remove,
};
