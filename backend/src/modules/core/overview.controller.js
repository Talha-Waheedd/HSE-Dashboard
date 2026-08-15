'use strict';

const overviewService = require('./overview.service');
const { ApiResponse, asyncHandler } = require('../../shared/utils/index');

const getDashboardOverview = asyncHandler(async (req, res) => {
  res.status(200).json(ApiResponse.success(await overviewService.dashboard(req.query), 'Dashboard overview retrieved successfully'));
});

const getAnalyticsOverview = asyncHandler(async (req, res) => {
  res.status(200).json(ApiResponse.success(await overviewService.analytics(req.query), 'Analytics overview retrieved successfully'));
});

module.exports = { getDashboardOverview, getAnalyticsOverview };
