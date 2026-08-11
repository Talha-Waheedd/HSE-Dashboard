'use strict';
const service = require('./location.service');
const { ApiResponse, asyncHandler } = require('../../shared/utils/index');
const list = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 1000, 5000); const offset = parseInt(req.query.offset, 10) || 0;
  const result = await service.list({ limit, offset, where: req.query.isActive === undefined ? {} : { isActive: req.query.isActive === 'true' }, order: [['name', 'ASC']] });
  res.json(ApiResponse.success(result.rows, 'Locations retrieved successfully', { page: Math.floor(offset / limit) + 1, limit, total: result.count, totalPages: Math.ceil(result.count / limit) }));
});
const get = asyncHandler(async (req, res) => res.json(ApiResponse.success(await service.get(req.params.id), 'Location retrieved successfully')));
const create = asyncHandler(async (req, res) => res.status(201).json(ApiResponse.success(await service.create(req.body, req.user.id), 'Location created successfully')));
const update = asyncHandler(async (req, res) => res.json(ApiResponse.success(await service.update(req.params.id, req.body, req.user.id), 'Location updated successfully')));
const remove = asyncHandler(async (req, res) => { await service.remove(req.params.id); res.json(ApiResponse.success(null, 'Location archived successfully')); });
module.exports = { list, get, create, update, remove };
