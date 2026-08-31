'use strict';

const hseActionItemService = require('./hse-action-item.service');
const { ApiResponse, asyncHandler, NotFoundError } = require('../../shared/utils/index');

const getHseActionItems = asyncHandler(async (req, res) => {
  const result = await hseActionItemService.findAll(req.query);
  res.status(200).json({
    success: true,
    message: 'Action items retrieved successfully',
    data: result.data,
    meta: result.meta,
  });
});

const getHseActionItemById = asyncHandler(async (req, res) => {
  const item = await hseActionItemService.findById(req.params.id);
  if (!item) {
    throw new NotFoundError('Action item not found');
  }
  res.status(200).json(ApiResponse.success(item, 'Action item retrieved successfully'));
});

const createHseActionItem = asyncHandler(async (req, res) => {
  const item = await hseActionItemService.create(req.body);
  res.status(201).json(ApiResponse.success(item, 'Action item created successfully'));
});

const updateHseActionItem = asyncHandler(async (req, res) => {
  const item = await hseActionItemService.update(req.params.id, req.body);
  if (!item) {
    throw new NotFoundError('Action item not found');
  }
  res.status(200).json(ApiResponse.success(item, 'Action item updated successfully'));
});

const deleteHseActionItem = asyncHandler(async (req, res) => {
  const success = await hseActionItemService.delete(req.params.id);
  if (!success) {
    throw new NotFoundError('Action item not found');
  }
  res.status(200).json(ApiResponse.success(null, 'Action item deleted successfully'));
});

module.exports = {
  getHseActionItems,
  getHseActionItemById,
  createHseActionItem,
  updateHseActionItem,
  deleteHseActionItem,
};
