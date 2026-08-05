'use strict';

const dashboardService = require('./dashboard.service');
const { ApiResponse, asyncHandler } = require('../../shared/utils/index');

/**
 * Get HSE dashboard statistics
 */
const getHseStats = asyncHandler(async (req, res) => {
  const stats = await dashboardService.getHseStats(req.query.plantId);
  res.status(200).json(ApiResponse.success(stats, 'Dashboard statistics retrieved successfully'));
});

module.exports = {
  getHseStats,
};
