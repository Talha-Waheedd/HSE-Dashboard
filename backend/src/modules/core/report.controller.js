'use strict';

const reportService = require('./report.service');
const { ApiResponse, asyncHandler, ApiError } = require('../../shared/utils/index');

/**
 * Generate performance report
 */
const getPerformanceReport = asyncHandler(async (req, res) => {
  const { startDate, endDate, plantId } = req.query;

  if (!startDate || !endDate) {
    throw ApiError.badRequest('startDate and endDate are required');
  }

  const report = await reportService.generatePerformanceReport(startDate, endDate, plantId);
  res.status(200).json(ApiResponse.success(report, 'Performance report generated successfully'));
});

module.exports = {
  getPerformanceReport,
};
