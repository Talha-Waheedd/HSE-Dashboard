'use strict';

const EnterpriseBaseRepository = require('../../repositories/enterprise-base.repository');
const {
  DashboardWidget,
  DashboardLayout,
  SavedReport,
  ReportSchedule,
  ReportExport,
  KpiDefinition,
  KpiTarget,
  AnalyticsSnapshot,
  RiskMatrixData,
} = require('./reporting.models');

class WidgetRepository extends EnterpriseBaseRepository {
  constructor() { super(DashboardWidget, { searchFields: ['widget_name', 'widget_code', 'module_name'], filterFields: ['widget_type', 'module_name', 'active'], sortFields: ['display_order', 'widget_name', 'created_at'] }); }
}
class LayoutRepository extends EnterpriseBaseRepository {
  constructor() { super(DashboardLayout, { searchFields: ['dashboard_name'], filterFields: ['user_id', 'dashboard_name', 'visible'], sortFields: ['position_y', 'position_x', 'created_at'] }); }
}
class ReportRepository extends EnterpriseBaseRepository {
  constructor() { super(SavedReport, { searchFields: ['report_name', 'report_type'], filterFields: ['owner_user_id', 'department_id', 'visibility'], sortFields: ['report_name', 'created_at', 'updated_at'] }); }
}
class ScheduleRepository extends EnterpriseBaseRepository {
  constructor() { super(ReportSchedule, { filterFields: ['report_id', 'frequency', 'active'], sortFields: ['next_run', 'created_at'] }); }
}
class ExportRepository extends EnterpriseBaseRepository {
  constructor() { super(ReportExport, { filterFields: ['report_id', 'exported_by', 'export_type'], dateField: 'generated_at', sortFields: ['generated_at', 'download_count'] }); }
}
class KpiRepository extends EnterpriseBaseRepository {
  constructor() { super(KpiDefinition, { searchFields: ['kpi_name', 'module_name', 'description'], filterFields: ['module_name', 'frequency', 'active'], sortFields: ['kpi_name', 'module_name', 'created_at'] }); }
}
class TargetRepository extends EnterpriseBaseRepository {
  constructor() { super(KpiTarget, { filterFields: ['kpi_id', 'department_id', 'plant_id', 'target_year', 'target_month'], sortFields: ['target_year', 'target_month', 'created_at'] }); }
}
class SnapshotRepository extends EnterpriseBaseRepository {
  constructor() { super(AnalyticsSnapshot, { searchFields: ['metric_name', 'module_name'], filterFields: ['module_name', 'department_id'], dateField: 'snapshot_date', sortFields: ['snapshot_date', 'metric_name'] }); }
}
class RiskMatrixRepository extends EnterpriseBaseRepository {
  constructor() { super(RiskMatrixData, { filterFields: ['hazard_id', 'department_id', 'risk_rating_id', 'probability', 'severity'], dateField: 'assessment_date', sortFields: ['assessment_date', 'probability', 'severity'] }); }
}

module.exports = {
  widgets: new WidgetRepository(),
  layouts: new LayoutRepository(),
  reports: new ReportRepository(),
  schedules: new ScheduleRepository(),
  exports: new ExportRepository(),
  kpis: new KpiRepository(),
  targets: new TargetRepository(),
  snapshots: new SnapshotRepository(),
  riskMatrix: new RiskMatrixRepository(),
};

