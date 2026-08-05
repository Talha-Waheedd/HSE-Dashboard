'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../../database/connection');

const auditFields = {
  createdBy: { type: DataTypes.BIGINT.UNSIGNED, field: 'created_by', allowNull: false },
  updatedBy: { type: DataTypes.BIGINT.UNSIGNED, field: 'updated_by', allowNull: false },
  createdAt: { type: DataTypes.DATE(3), field: 'created_at', allowNull: false },
  updatedAt: { type: DataTypes.DATE(3), field: 'updated_at', allowNull: false },
  deletedAt: { type: DataTypes.DATE(3), field: 'deleted_at', allowNull: true },
};

const baseOptions = (tableName, indexes = []) => ({
  tableName,
  freezeTableName: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
  paranoid: true,
  indexes,
  defaultScope: { where: { deleted_at: null } },
  scopes: { withDeleted: { paranoid: false }, onlyDeleted: { where: { deleted_at: { [require('sequelize').Op.not]: null } }, paranoid: false } },
});

const DashboardWidget = sequelize.define('ReportingDashboardWidget', {
  widgetId: { type: DataTypes.BIGINT.UNSIGNED, field: 'widget_id', primaryKey: true, autoIncrement: true },
  widgetName: { type: DataTypes.STRING(150), field: 'widget_name', allowNull: false },
  widgetCode: { type: DataTypes.STRING(80), field: 'widget_code', allowNull: false, unique: true },
  widgetType: { type: DataTypes.ENUM('KPI', 'Chart', 'Table', 'Gauge', 'Heatmap'), field: 'widget_type', allowNull: false },
  moduleName: { type: DataTypes.STRING(80), field: 'module_name', allowNull: false },
  icon: DataTypes.STRING(80),
  color: DataTypes.STRING(7),
  displayOrder: { type: DataTypes.INTEGER.UNSIGNED, field: 'display_order', allowNull: false },
  active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  ...auditFields,
}, baseOptions('ra_dashboard_widgets', [{ fields: ['module_name', 'active', 'display_order'] }]));

const DashboardLayout = sequelize.define('ReportingDashboardLayout', {
  layoutId: { type: DataTypes.BIGINT.UNSIGNED, field: 'layout_id', primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.BIGINT.UNSIGNED, field: 'user_id', allowNull: false },
  dashboardName: { type: DataTypes.STRING(120), field: 'dashboard_name', allowNull: false },
  widgetId: { type: DataTypes.BIGINT.UNSIGNED, field: 'widget_id', allowNull: false },
  positionX: { type: DataTypes.INTEGER.UNSIGNED, field: 'position_x', allowNull: false },
  positionY: { type: DataTypes.INTEGER.UNSIGNED, field: 'position_y', allowNull: false },
  width: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  height: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  visible: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  ...auditFields,
}, baseOptions('ra_dashboard_layouts', [{ fields: ['user_id', 'dashboard_name', 'visible'] }, { fields: ['widget_id'] }]));

const SavedReport = sequelize.define('SavedReport', {
  reportId: { type: DataTypes.BIGINT.UNSIGNED, field: 'report_id', primaryKey: true, autoIncrement: true },
  reportName: { type: DataTypes.STRING(180), field: 'report_name', allowNull: false },
  reportType: { type: DataTypes.STRING(40), field: 'report_type', allowNull: false },
  ownerUserId: { type: DataTypes.BIGINT.UNSIGNED, field: 'owner_user_id', allowNull: false },
  departmentId: { type: DataTypes.STRING(36), field: 'department_id' },
  filtersJson: { type: DataTypes.JSON, field: 'filters_json' },
  chartType: { type: DataTypes.STRING(20), field: 'chart_type', allowNull: false },
  exportFormat: { type: DataTypes.STRING(10), field: 'export_format', allowNull: false },
  visibility: { type: DataTypes.STRING(20), allowNull: false },
  ...auditFields,
}, baseOptions('ra_saved_reports', [{ fields: ['report_name'] }, { fields: ['owner_user_id', 'visibility'] }, { fields: ['report_type'] }]));

const ReportSchedule = sequelize.define('ReportSchedule', {
  scheduleId: { type: DataTypes.BIGINT.UNSIGNED, field: 'schedule_id', primaryKey: true, autoIncrement: true },
  reportId: { type: DataTypes.BIGINT.UNSIGNED, field: 'report_id', allowNull: false },
  frequency: { type: DataTypes.STRING(20), allowNull: false },
  nextRun: { type: DataTypes.DATE(3), field: 'next_run', allowNull: false },
  lastRun: { type: DataTypes.DATE(3), field: 'last_run' },
  active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  ...auditFields,
}, baseOptions('ra_report_schedules', [{ fields: ['active', 'next_run'] }, { fields: ['report_id', 'frequency'] }]));

const ReportExport = sequelize.define('ReportExport', {
  exportId: { type: DataTypes.BIGINT.UNSIGNED, field: 'export_id', primaryKey: true, autoIncrement: true },
  reportId: { type: DataTypes.BIGINT.UNSIGNED, field: 'report_id', allowNull: false },
  exportedBy: { type: DataTypes.BIGINT.UNSIGNED, field: 'exported_by', allowNull: false },
  exportType: { type: DataTypes.STRING(10), field: 'export_type', allowNull: false },
  filePath: { type: DataTypes.STRING(1000), field: 'file_path', allowNull: false },
  generatedAt: { type: DataTypes.DATE(3), field: 'generated_at', allowNull: false },
  downloadCount: { type: DataTypes.INTEGER.UNSIGNED, field: 'download_count', allowNull: false, defaultValue: 0 },
  ...auditFields,
}, baseOptions('ra_report_exports', [{ fields: ['report_id', 'generated_at'] }, { fields: ['export_type', 'generated_at'] }]));

const KpiDefinition = sequelize.define('KpiDefinition', {
  kpiId: { type: DataTypes.BIGINT.UNSIGNED, field: 'kpi_id', primaryKey: true, autoIncrement: true },
  kpiName: { type: DataTypes.STRING(180), field: 'kpi_name', allowNull: false, unique: true },
  formula: { type: DataTypes.TEXT, allowNull: false },
  moduleName: { type: DataTypes.STRING(80), field: 'module_name', allowNull: false },
  frequency: { type: DataTypes.STRING(20), allowNull: false },
  targetValue: { type: DataTypes.DECIMAL(18, 4), field: 'target_value' },
  unit: { type: DataTypes.STRING(40), allowNull: false },
  description: DataTypes.TEXT,
  active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  ...auditFields,
}, baseOptions('ra_kpi_definitions', [{ fields: ['module_name', 'frequency', 'active'] }]));

const KpiTarget = sequelize.define('KpiTarget', {
  kpiTargetId: { type: DataTypes.BIGINT.UNSIGNED, field: 'kpi_target_id', primaryKey: true, autoIncrement: true },
  kpiId: { type: DataTypes.BIGINT.UNSIGNED, field: 'kpi_id', allowNull: false },
  departmentId: { type: DataTypes.STRING(36), field: 'department_id' },
  plantId: { type: DataTypes.STRING(36), field: 'plant_id' },
  targetYear: { type: DataTypes.INTEGER, field: 'target_year', allowNull: false },
  targetMonth: { type: DataTypes.INTEGER.UNSIGNED, field: 'target_month', allowNull: false },
  targetValue: { type: DataTypes.DECIMAL(18, 4), field: 'target_value', allowNull: false },
  warningThreshold: { type: DataTypes.DECIMAL(18, 4), field: 'warning_threshold' },
  criticalThreshold: { type: DataTypes.DECIMAL(18, 4), field: 'critical_threshold' },
  ...auditFields,
}, baseOptions('ra_kpi_targets', [{ fields: ['kpi_id', 'target_year', 'target_month'] }, { fields: ['department_id', 'target_year', 'target_month'] }]));

const AnalyticsSnapshot = sequelize.define('AnalyticsSnapshot', {
  snapshotId: { type: DataTypes.BIGINT.UNSIGNED, field: 'snapshot_id', primaryKey: true, autoIncrement: true },
  snapshotDate: { type: DataTypes.DATEONLY, field: 'snapshot_date', allowNull: false },
  moduleName: { type: DataTypes.STRING(80), field: 'module_name', allowNull: false },
  departmentId: { type: DataTypes.STRING(36), field: 'department_id' },
  metricName: { type: DataTypes.STRING(160), field: 'metric_name', allowNull: false },
  metricValue: { type: DataTypes.DECIMAL(20, 4), field: 'metric_value', allowNull: false },
  generatedAt: { type: DataTypes.DATE(3), field: 'generated_at', allowNull: false },
  ...auditFields,
}, baseOptions('ra_analytics_snapshots', [{ fields: ['snapshot_date', 'module_name'] }, { fields: ['metric_name', 'snapshot_date'] }]));

const RiskMatrixData = sequelize.define('RiskMatrixData', {
  riskMatrixId: { type: DataTypes.BIGINT.UNSIGNED, field: 'risk_matrix_id', primaryKey: true, autoIncrement: true },
  hazardId: { type: DataTypes.BIGINT.UNSIGNED, field: 'hazard_id', allowNull: false },
  probability: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  severity: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  riskRatingId: { type: DataTypes.BIGINT.UNSIGNED, field: 'risk_rating_id', allowNull: false },
  departmentId: { type: DataTypes.STRING(36), field: 'department_id' },
  locationId: { type: DataTypes.STRING(36), field: 'location_id' },
  assessmentDate: { type: DataTypes.DATEONLY, field: 'assessment_date', allowNull: false },
  ...auditFields,
}, baseOptions('ra_risk_matrix_data', [{ fields: ['probability', 'severity'] }, { fields: ['department_id', 'assessment_date'] }]));

DashboardLayout.belongsTo(DashboardWidget, { foreignKey: 'widgetId', as: 'widget' });
DashboardWidget.hasMany(DashboardLayout, { foreignKey: 'widgetId', as: 'layouts' });
ReportSchedule.belongsTo(SavedReport, { foreignKey: 'reportId', as: 'report' });
SavedReport.hasMany(ReportSchedule, { foreignKey: 'reportId', as: 'schedules' });
ReportExport.belongsTo(SavedReport, { foreignKey: 'reportId', as: 'report' });
SavedReport.hasMany(ReportExport, { foreignKey: 'reportId', as: 'exports' });
KpiTarget.belongsTo(KpiDefinition, { foreignKey: 'kpiId', as: 'kpi' });
KpiDefinition.hasMany(KpiTarget, { foreignKey: 'kpiId', as: 'targets' });

module.exports = {
  DashboardWidget,
  DashboardLayout,
  SavedReport,
  ReportSchedule,
  ReportExport,
  KpiDefinition,
  KpiTarget,
  AnalyticsSnapshot,
  RiskMatrixData,
};

