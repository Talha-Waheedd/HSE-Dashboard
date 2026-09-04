'use strict';

const dashboardService = require('./dashboard.service');
const dashboardPreferenceService = require('./dashboard-preference.service');
const { ApiResponse, asyncHandler } = require('../../shared/utils/index');

/**
 * Get HSE dashboard statistics
 */
const getHseStats = asyncHandler(async (req, res) => {
  const stats = await dashboardService.getHseStats(req.query);
  res.status(200).json(ApiResponse.success(stats, 'Dashboard statistics retrieved successfully'));
});

const getIndicatorPreferences = asyncHandler(async (req, res) => {
  const preferences = await dashboardPreferenceService.getForUser(req.user.id);
  res.status(200).json(ApiResponse.success(preferences, 'Dashboard indicator preferences retrieved successfully'));
});

const updateIndicatorPreferences = asyncHandler(async (req, res) => {
  const preferences = await dashboardPreferenceService.updateForUser(req.user.id, req.body);
  res.status(200).json(ApiResponse.success(preferences, 'Dashboard indicator preferences updated successfully'));
});

module.exports = {
  getHseStats,
  getIndicatorPreferences,
  updateIndicatorPreferences,
};
