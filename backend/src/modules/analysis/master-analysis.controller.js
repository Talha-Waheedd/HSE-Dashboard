'use strict';

const service = require('./master-analysis.service');
const { ApiResponse, asyncHandler } = require('../../shared/utils');

const list = asyncHandler(async (req, res) => {
  const result = await service.list(req.query);
  res.status(200).json(ApiResponse.success(result.records, 'Master analysis records retrieved successfully', { ...result.meta, summary: result.summary }));
});
const get = asyncHandler(async (req, res) => res.status(200).json(ApiResponse.success(await service.get(req.params.key), 'Master analysis record retrieved successfully')));
const save = asyncHandler(async (req, res) => res.status(200).json(ApiResponse.success(await service.save(req.params.key, req.body, req.user?.id), 'Master analysis saved successfully')));

module.exports = { list, get, save };
