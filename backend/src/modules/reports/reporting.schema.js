'use strict';

const Joi = require('joi');

const id = Joi.alternatives().try(Joi.number().integer().positive(), Joi.string().trim().min(1));
const listSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().trim().max(120).allow(''),
  sort: Joi.string().trim().max(50),
  order: Joi.string().valid('asc', 'desc').default('desc'),
  from: Joi.date().iso(),
  to: Joi.date().iso().min(Joi.ref('from')),
  module_name: Joi.string().max(80),
  active: Joi.boolean(),
}).unknown(true);

const widgetSchema = Joi.object({
  widgetName: Joi.string().trim().max(150).required(),
  widgetCode: Joi.string().trim().max(80).required(),
  widgetType: Joi.string().valid('KPI', 'Chart', 'Table', 'Gauge', 'Heatmap').required(),
  moduleName: Joi.string().trim().max(80).required(),
  icon: Joi.string().max(80).allow(null, ''),
  color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).allow(null, ''),
  displayOrder: Joi.number().integer().min(0).default(0),
  active: Joi.boolean().default(true),
});

const layoutSchema = Joi.object({
  userId: id.required(),
  dashboardName: Joi.string().trim().max(120).required(),
  widgetId: id.required(),
  positionX: Joi.number().integer().min(0).required(),
  positionY: Joi.number().integer().min(0).required(),
  width: Joi.number().integer().min(1).max(12).required(),
  height: Joi.number().integer().min(1).max(20).required(),
  visible: Joi.boolean().default(true),
});

const reportSchema = Joi.object({
  reportName: Joi.string().trim().max(180).required(),
  reportType: Joi.string().valid('executive', 'hazard', 'near_miss', 'incident', 'training', 'audit', 'capa', 'compliance', 'employee', 'department', 'custom').required(),
  departmentId: Joi.string().max(36).allow(null, ''),
  filtersJson: Joi.object().default({}),
  chartType: Joi.string().valid('table', 'line', 'bar', 'pie', 'area', 'gauge', 'heatmap', 'scatter').default('table'),
  exportFormat: Joi.string().valid('PDF', 'Excel', 'CSV', 'JSON').default('PDF'),
  visibility: Joi.string().valid('private', 'department', 'plant', 'enterprise').default('private'),
});

const kpiTargetSchema = Joi.object({
  kpiId: id.required(),
  departmentId: Joi.string().max(36).allow(null, ''),
  plantId: Joi.string().max(36).allow(null, ''),
  targetYear: Joi.number().integer().min(2000).max(2200).required(),
  targetMonth: Joi.number().integer().min(1).max(12).required(),
  targetValue: Joi.number().required(),
  warningThreshold: Joi.number().min(0).allow(null),
  criticalThreshold: Joi.number().min(0).allow(null),
});

module.exports = { listSchema, widgetSchema, layoutSchema, reportSchema, kpiTargetSchema };

