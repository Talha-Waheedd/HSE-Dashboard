'use strict';

const plantService = require('./plant.service');
const { ApiResponse, asyncHandler } = require('../../shared/utils/index');
const { parsePagination, parseOrder, paginationMeta } = require('../../shared/utils/pagination');

/**
 * Create a new plant
 */
const createPlant = asyncHandler(async (req, res) => {
  const plant = await plantService.createPlant(req.body, req.user.id);
  res.status(201).json(ApiResponse.success(plant, 'Plant created successfully', 201));
});

/**
 * Get all plants
 */
const getAllPlants = asyncHandler(async (req, res) => {
  const pagination = parsePagination(req.query);
  const options = {
    ...pagination,
    where: req.query.isActive ? { isActive: req.query.isActive === 'true' } : {},
  };
  options.order = parseOrder(req.query, { name: 'name', createdAt: 'createdAt' }, ['name', 'ASC']);
  const result = await plantService.getAllPlants(options);
  res.status(200).json(ApiResponse.success(result.rows, 'Plants retrieved successfully', paginationMeta({ ...pagination, total: result.count })));
});

/**
 * Get active plants
 */
const getActivePlants = asyncHandler(async (req, res) => {
  const plants = await plantService.getActivePlants();
  res.status(200).json(ApiResponse.success(plants, 'Active plants retrieved successfully'));
});

/**
 * Get plant by ID
 */
const getPlantById = asyncHandler(async (req, res) => {
  const plant = await plantService.getPlantById(req.params.id);
  res.status(200).json(ApiResponse.success(plant, 'Plant retrieved successfully'));
});

/**
 * Update plant
 */
const updatePlant = asyncHandler(async (req, res) => {
  const count = await plantService.updatePlant(req.params.id, req.body, req.user.id);
  res.status(200).json(ApiResponse.success({ updated: count }, 'Plant updated successfully'));
});

/**
 * Delete plant
 */
const deletePlant = asyncHandler(async (req, res) => {
  await plantService.deletePlant(req.params.id);
  res.status(200).json(ApiResponse.success(null, 'Plant deleted successfully'));
});

module.exports = {
  createPlant,
  getAllPlants,
  getActivePlants,
  getPlantById,
  updatePlant,
  deletePlant,
};
