'use strict';

const asyncHandler = require('../../shared/utils/asyncHandler');
const ApiResponse = require('../../shared/utils/ApiResponse');
const service = require('./reporting.service');

const resource = (name) => ({
  list: asyncHandler(async (req, res) => {
    const result = await service.list(name, req.query);
    res.json(ApiResponse.paginated(result.rows, `${name} retrieved successfully`, result.meta));
  }),
  get: asyncHandler(async (req, res) => {
    const row = await service.getById(name, req.params.id);
    res.json(ApiResponse.success(row, `${name} retrieved successfully`));
  }),
  create: asyncHandler(async (req, res) => {
    const row = await service.create(name, req.body, req.user.id);
    res.status(201).json(ApiResponse.success(row, `${name} created successfully`));
  }),
  update: asyncHandler(async (req, res) => {
    const row = await service.update(name, req.params.id, req.body, req.user.id);
    res.json(ApiResponse.success(row, `${name} updated successfully`));
  }),
  remove: asyncHandler(async (req, res) => {
    const row = await service.remove(name, req.params.id, req.user.id);
    res.json(ApiResponse.success(row, `${name} deleted successfully`));
  }),
});

const listKpis = asyncHandler(async (req, res) => {
  const result = await service.list('kpis', req.query);
  res.json(ApiResponse.paginated(result.rows, 'KPIs retrieved successfully', result.meta));
});

const listSnapshots = asyncHandler(async (req, res) => {
  const result = await service.list('snapshots', req.query);
  res.json(ApiResponse.paginated(result.rows, 'Analytics snapshots retrieved successfully', result.meta));
});

const listRiskMatrix = asyncHandler(async (req, res) => {
  const result = await service.list('riskMatrix', req.query);
  res.json(ApiResponse.paginated(result.rows, 'Risk matrix data retrieved successfully', result.meta));
});

module.exports = { widgets: resource('widgets'), layouts: resource('layouts'), reports: resource('reports'), schedules: resource('schedules'), exports: resource('exports'), kpis: { list: listKpis }, snapshots: { list: listSnapshots }, riskMatrix: { list: listRiskMatrix } };
