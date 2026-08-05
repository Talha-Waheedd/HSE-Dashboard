-- ==================================================
-- TABLE NAME
--   Reporting and Analytics Views
--
-- Purpose
--   MySQL 8 reporting layer for executive dashboards, operational drill-down,
--   leading/lagging indicators, trends, risk, CAPA, training, audit, and compliance.
--
-- Relationships
--   Reads existing HSE modules and the reporting tables 98-106. No source tables
--   are altered and no reporting facts are duplicated.
--
-- Indexes
--   Views are designed around indexed source keys, dates, departments, plants,
--   status fields, and the materialized snapshot/risk facts.
--
-- Workflow
--   Dashboard -> view aggregate -> drill down through source primary keys.
--
-- Author
--   CBL HSE Database Architecture
--
-- Version
--   1.0.0 | Reporting and Analytics Extension | MySQL 8
-- ==================================================

USE cbl_hse;

CREATE OR REPLACE VIEW vw_dashboard_summary AS
SELECT 'Hazards' module_name, COUNT(*) metric_value FROM hazards WHERE deleted_at IS NULL
UNION ALL SELECT 'Near Misses', COUNT(*) FROM near_misses WHERE deleted_at IS NULL
UNION ALL SELECT 'Incidents', COUNT(*) FROM incidents WHERE deleted_at IS NULL
UNION ALL SELECT 'Training Sessions', COUNT(*) FROM tm_training_sessions WHERE deleted_at IS NULL
UNION ALL SELECT 'Audits', COUNT(*) FROM am_audits WHERE deleted_at IS NULL
UNION ALL SELECT 'Open Compliance Items', COUNT(*) FROM am_compliance_tracking WHERE deleted_at IS NULL AND status IN ('open','in_progress','overdue');

CREATE OR REPLACE VIEW vw_leading_indicators AS
SELECT 'Hazard Reports' indicator_name, COUNT(*) indicator_value, 'count' unit FROM hazards WHERE deleted_at IS NULL
UNION ALL SELECT 'Near Miss Reports', COUNT(*), 'count' FROM near_misses WHERE deleted_at IS NULL
UNION ALL SELECT 'Training Manhours', COALESCE(SUM(manhours),0), 'hours' FROM tm_training_attendance WHERE deleted_at IS NULL
UNION ALL SELECT 'Completed Audits', COUNT(*), 'count' FROM am_audits WHERE deleted_at IS NULL AND status IN ('approved','closed')
UNION ALL SELECT 'Completed Inspections', COUNT(*), 'count' FROM am_inspections WHERE deleted_at IS NULL AND status = 'completed';

CREATE OR REPLACE VIEW vw_lagging_indicators AS
SELECT 'Total Incidents' indicator_name, COUNT(*) indicator_value, 'count' unit FROM incidents WHERE deleted_at IS NULL
UNION ALL SELECT 'Lost Time Days', COALESCE(SUM(days_lost),0), 'days' FROM injury_details WHERE deleted_at IS NULL
UNION ALL SELECT 'Fatalities', SUM(CASE WHEN severity = 'catastrophic' THEN 1 ELSE 0 END), 'count' FROM incidents WHERE deleted_at IS NULL
UNION ALL SELECT 'Incident Cost', COALESCE(SUM(estimated_cost + production_loss),0), 'currency' FROM incidents WHERE deleted_at IS NULL
UNION ALL SELECT 'Open Major Audit Findings', COUNT(*), 'count' FROM am_audit_findings WHERE deleted_at IS NULL AND category IN ('major_nc','critical_nc') AND status <> 'closed';

CREATE OR REPLACE VIEW vw_hazard_statistics AS
SELECT
    h.department_id,
    h.plant_id,
    h.risk_rating_id,
    COUNT(*) hazard_count,
    SUM(CASE WHEN h.target_completion_date < CURRENT_DATE AND h.actual_completion_date IS NULL THEN 1 ELSE 0 END) overdue_count,
    SUM(CASE WHEN h.actual_completion_date IS NOT NULL THEN 1 ELSE 0 END) closed_count
FROM hazards h
WHERE h.deleted_at IS NULL
GROUP BY h.department_id,h.plant_id,h.risk_rating_id;

CREATE OR REPLACE VIEW vw_incident_statistics AS
SELECT
    YEAR(i.event_datetime) report_year,
    MONTH(i.event_datetime) report_month,
    i.plant_id,
    i.department_id,
    i.severity,
    COUNT(*) incident_count,
    SUM(i.estimated_cost + i.production_loss) total_cost,
    SUM(CASE WHEN i.affected_employee_id IS NOT NULL THEN 1 ELSE 0 END) employee_incidents,
    SUM(CASE WHEN i.affected_contractor_id IS NOT NULL THEN 1 ELSE 0 END) contractor_incidents
FROM incidents i
WHERE i.deleted_at IS NULL
GROUP BY YEAR(i.event_datetime),MONTH(i.event_datetime),i.plant_id,i.department_id,i.severity;

CREATE OR REPLACE VIEW vw_nearmiss_statistics AS
SELECT
    YEAR(n.event_datetime) report_year,
    MONTH(n.event_datetime) report_month,
    n.plant_id,
    n.department_id,
    n.risk_rating_id,
    COUNT(*) near_miss_count,
    SUM(CASE WHEN n.actual_completion_date IS NULL THEN 1 ELSE 0 END) open_count,
    SUM(CASE WHEN n.actual_completion_date IS NOT NULL THEN 1 ELSE 0 END) closed_count
FROM near_misses n
WHERE n.deleted_at IS NULL
GROUP BY YEAR(n.event_datetime),MONTH(n.event_datetime),n.plant_id,n.department_id,n.risk_rating_id;

CREATE OR REPLACE VIEW vw_training_statistics AS
SELECT
    x.report_year,
    x.report_month,
    x.plant_id,
    x.department_id,
    COUNT(*) sessions,
    COALESCE(SUM(x.training_manhours),0) training_manhours,
    COALESCE(SUM(x.training_cost),0) training_cost,
    COALESCE(AVG(x.attendance_percent),0) attendance_percent
FROM (
    SELECT
        YEAR(s.training_date) report_year,
        MONTH(s.training_date) report_month,
        s.training_session_id,
        s.plant_id,
        s.department_id,
        s.duration_minutes * s.actual_attendance / 60 training_manhours,
        s.cost training_cost,
        COALESCE(AVG(a.attendance_percent),0) attendance_percent
    FROM tm_training_sessions s
    LEFT JOIN tm_training_attendance a ON a.training_session_id = s.training_session_id AND a.deleted_at IS NULL
    WHERE s.deleted_at IS NULL
    GROUP BY YEAR(s.training_date),MONTH(s.training_date),s.training_session_id,s.plant_id,s.department_id,s.duration_minutes,s.actual_attendance,s.cost
) x
GROUP BY x.report_year,x.report_month,x.plant_id,x.department_id;

CREATE OR REPLACE VIEW vw_audit_statistics AS
SELECT
    YEAR(a.audit_date) report_year,
    MONTH(a.audit_date) report_month,
    a.plant_id,
    a.department_id,
    COUNT(*) audit_count,
    AVG(a.compliance_percentage) average_compliance,
    SUM(CASE WHEN a.status IN ('approved','closed') THEN 1 ELSE 0 END) completed_audits,
    SUM(CASE WHEN a.status NOT IN ('approved','closed','cancelled') THEN 1 ELSE 0 END) open_audits
FROM am_audits a
WHERE a.deleted_at IS NULL
GROUP BY YEAR(a.audit_date),MONTH(a.audit_date),a.plant_id,a.department_id;

CREATE OR REPLACE VIEW vw_capa_statistics AS
SELECT 'Incident CAPA' source_module,
       COUNT(*) total_actions,
       SUM(CASE WHEN status_id = 27 THEN 1 ELSE 0 END) verified_actions,
       SUM(CASE WHEN target_date < CURRENT_DATE AND status_id <> 27 THEN 1 ELSE 0 END) overdue_actions
FROM incident_corrective_actions WHERE deleted_at IS NULL
UNION ALL
SELECT 'Hazard CAPA',COUNT(*),SUM(CASE WHEN verified_date IS NOT NULL THEN 1 ELSE 0 END),
       SUM(CASE WHEN target_date < CURRENT_DATE AND verified_date IS NULL THEN 1 ELSE 0 END)
FROM hazard_corrective_actions WHERE deleted_at IS NULL;

CREATE OR REPLACE VIEW vw_department_performance AS
SELECT
    d.department_id,
    d.department_name,
    COALESCE(h.hazard_count,0) hazard_count,
    COALESCE(n.near_miss_count,0) near_miss_count,
    COALESCE(i.incident_count,0) incident_count,
    COALESCE(t.training_manhours,0) training_manhours,
    COALESCE(a.average_compliance,0) audit_compliance,
    COALESCE(c.overdue_actions,0) overdue_capa
FROM departments d
LEFT JOIN (SELECT department_id,COUNT(*) hazard_count FROM hazards WHERE deleted_at IS NULL GROUP BY department_id) h ON h.department_id = d.department_id
LEFT JOIN (SELECT department_id,COUNT(*) near_miss_count FROM near_misses WHERE deleted_at IS NULL GROUP BY department_id) n ON n.department_id = d.department_id
LEFT JOIN (SELECT department_id,COUNT(*) incident_count FROM incidents WHERE deleted_at IS NULL GROUP BY department_id) i ON i.department_id = d.department_id
LEFT JOIN (SELECT department_id,SUM(duration_minutes * actual_attendance / 60) training_manhours FROM tm_training_sessions WHERE deleted_at IS NULL GROUP BY department_id) t ON t.department_id = d.department_id
LEFT JOIN (SELECT department_id,AVG(compliance_percentage) average_compliance FROM am_audits WHERE deleted_at IS NULL GROUP BY department_id) a ON a.department_id = d.department_id
LEFT JOIN (SELECT assigned_department_id department_id,SUM(CASE WHEN target_date < CURRENT_DATE AND status_id <> 27 THEN 1 ELSE 0 END) overdue_actions FROM incident_corrective_actions WHERE deleted_at IS NULL GROUP BY assigned_department_id) c ON c.department_id = d.department_id
WHERE d.deleted_at IS NULL;

CREATE OR REPLACE VIEW vw_employee_performance AS
SELECT
    e.employee_id,
    e.emp_code,
    e.full_name,
    e.department_id,
    COALESCE(h.hazard_reports,0) hazard_reports,
    COALESCE(n.near_miss_reports,0) near_miss_reports,
    COALESCE(i.incident_reports,0) incident_reports,
    COALESCE(t.training_sessions,0) training_sessions,
    COALESCE(t.training_manhours,0) training_manhours
FROM employees e
LEFT JOIN (SELECT reported_by employee_id,COUNT(*) hazard_reports FROM hazards WHERE deleted_at IS NULL GROUP BY reported_by) h ON h.employee_id = e.employee_id
LEFT JOIN (SELECT reported_by employee_id,COUNT(*) near_miss_reports FROM near_misses WHERE deleted_at IS NULL GROUP BY reported_by) n ON n.employee_id = e.employee_id
LEFT JOIN (SELECT reported_by employee_id,COUNT(*) incident_reports FROM incidents WHERE deleted_at IS NULL GROUP BY reported_by) i ON i.employee_id = e.employee_id
LEFT JOIN (SELECT employee_id,COUNT(*) training_sessions,SUM(manhours) training_manhours FROM tm_training_attendance WHERE deleted_at IS NULL GROUP BY employee_id) t ON t.employee_id = e.employee_id;

CREATE OR REPLACE VIEW vw_monthly_trends AS
SELECT period_year,period_month,
       SUM(hazards) hazards,SUM(near_misses) near_misses,SUM(incidents) incidents,
       SUM(training_manhours) training_manhours,SUM(audits) audits
FROM (
    SELECT YEAR(date_reported) period_year,MONTH(date_reported) period_month,COUNT(*) hazards,0 near_misses,0 incidents,0 training_manhours,0 audits FROM hazards WHERE deleted_at IS NULL GROUP BY YEAR(date_reported),MONTH(date_reported)
    UNION ALL SELECT YEAR(event_datetime),MONTH(event_datetime),0,COUNT(*),0,0,0 FROM near_misses WHERE deleted_at IS NULL GROUP BY YEAR(event_datetime),MONTH(event_datetime)
    UNION ALL SELECT YEAR(event_datetime),MONTH(event_datetime),0,0,COUNT(*),0,0 FROM incidents WHERE deleted_at IS NULL GROUP BY YEAR(event_datetime),MONTH(event_datetime)
    UNION ALL SELECT YEAR(training_date),MONTH(training_date),0,0,0,SUM(duration_minutes * actual_attendance / 60),0 FROM tm_training_sessions WHERE deleted_at IS NULL GROUP BY YEAR(training_date),MONTH(training_date)
    UNION ALL SELECT YEAR(audit_date),MONTH(audit_date),0,0,0,0,COUNT(*) FROM am_audits WHERE deleted_at IS NULL GROUP BY YEAR(audit_date),MONTH(audit_date)
) x
GROUP BY period_year,period_month;

CREATE OR REPLACE VIEW vw_yearly_trends AS
SELECT period_year,
       SUM(hazards) hazards,SUM(near_misses) near_misses,SUM(incidents) incidents,
       SUM(training_manhours) training_manhours,SUM(audits) audits
FROM (
    SELECT YEAR(date_reported) period_year,COUNT(*) hazards,0 near_misses,0 incidents,0 training_manhours,0 audits FROM hazards WHERE deleted_at IS NULL GROUP BY YEAR(date_reported)
    UNION ALL SELECT YEAR(event_datetime),0,COUNT(*),0,0,0 FROM near_misses WHERE deleted_at IS NULL GROUP BY YEAR(event_datetime)
    UNION ALL SELECT YEAR(event_datetime),0,0,COUNT(*),0,0 FROM incidents WHERE deleted_at IS NULL GROUP BY YEAR(event_datetime)
    UNION ALL SELECT YEAR(training_date),0,0,0,SUM(duration_minutes * actual_attendance / 60),0 FROM tm_training_sessions WHERE deleted_at IS NULL GROUP BY YEAR(training_date)
    UNION ALL SELECT YEAR(audit_date),0,0,0,0,COUNT(*) FROM am_audits WHERE deleted_at IS NULL GROUP BY YEAR(audit_date)
) x
GROUP BY period_year;

CREATE OR REPLACE VIEW vw_risk_heatmap AS
SELECT probability,severity,risk_rating_id,COUNT(*) exposure_count,
       COUNT(DISTINCT department_id) department_count,COUNT(DISTINCT hazard_id) hazard_count
FROM ra_risk_matrix_data
WHERE deleted_at IS NULL
GROUP BY probability,severity,risk_rating_id;

CREATE OR REPLACE VIEW vw_top_departments AS
SELECT d.department_id,d.department_name,COUNT(*) total_hse_events
FROM departments d
JOIN (
    SELECT department_id FROM hazards WHERE deleted_at IS NULL
    UNION ALL SELECT department_id FROM near_misses WHERE deleted_at IS NULL
    UNION ALL SELECT department_id FROM incidents WHERE deleted_at IS NULL
) e ON e.department_id = d.department_id
WHERE d.deleted_at IS NULL
GROUP BY d.department_id,d.department_name
ORDER BY total_hse_events DESC;

CREATE OR REPLACE VIEW vw_top_locations AS
SELECT l.location_id,l.location_name,COUNT(*) total_hse_events
FROM locations l
JOIN (
    SELECT location_id FROM hazards WHERE deleted_at IS NULL AND location_id IS NOT NULL
    UNION ALL SELECT location_id FROM near_misses WHERE deleted_at IS NULL AND location_id IS NOT NULL
    UNION ALL SELECT location_id FROM incidents WHERE deleted_at IS NULL AND location_id IS NOT NULL
) e ON e.location_id = l.location_id
GROUP BY l.location_id,l.location_name
ORDER BY total_hse_events DESC;

CREATE OR REPLACE VIEW vw_overdue_items AS
SELECT 'Hazard' source_module,hazard_id source_id,hazard_number reference_number,target_completion_date due_date,department_id,plant_id
FROM hazards WHERE deleted_at IS NULL AND target_completion_date < CURRENT_DATE AND actual_completion_date IS NULL
UNION ALL
SELECT 'Incident CAPA',action_id,CONCAT('INC-CAPA-',action_id),target_date,assigned_department_id,NULL
FROM incident_corrective_actions WHERE deleted_at IS NULL AND target_date < CURRENT_DATE AND status_id <> 27
UNION ALL
SELECT 'Compliance',compliance_tracking_id,CONCAT('COMP-',compliance_tracking_id),due_date,department_id,NULL
FROM am_compliance_tracking WHERE deleted_at IS NULL AND due_date < CURRENT_DATE AND status NOT IN ('completed','compliant','not_applicable');

CREATE OR REPLACE VIEW vw_compliance_dashboard AS
SELECT r.requirement_id,r.requirement_code,r.name,r.mandatory,
       COUNT(t.compliance_tracking_id) tracking_records,
       SUM(CASE WHEN t.status IN ('completed','compliant') THEN 1 ELSE 0 END) compliant_records,
       SUM(CASE WHEN t.status = 'overdue' OR (t.due_date < CURRENT_DATE AND t.completion_date IS NULL) THEN 1 ELSE 0 END) overdue_records
FROM am_compliance_requirements r
LEFT JOIN am_compliance_tracking t ON t.requirement_id = r.requirement_id AND t.deleted_at IS NULL
WHERE r.deleted_at IS NULL
GROUP BY r.requirement_id,r.requirement_code,r.name,r.mandatory;

CREATE OR REPLACE VIEW vw_executive_dashboard AS
SELECT 'Total Hazards' metric_name,COUNT(*) metric_value FROM hazards WHERE deleted_at IS NULL
UNION ALL SELECT 'Total Near Misses',COUNT(*) FROM near_misses WHERE deleted_at IS NULL
UNION ALL SELECT 'Total Incidents',COUNT(*) FROM incidents WHERE deleted_at IS NULL
UNION ALL SELECT 'Training Manhours',COALESCE(SUM(manhours),0) FROM tm_training_attendance WHERE deleted_at IS NULL
UNION ALL SELECT 'Average Audit Compliance',COALESCE(AVG(compliance_percentage),0) FROM am_audits WHERE deleted_at IS NULL AND compliance_percentage IS NOT NULL
UNION ALL SELECT 'Overdue Items',COUNT(*) FROM vw_overdue_items;

CREATE OR REPLACE VIEW vw_management_dashboard AS
SELECT
    s.snapshot_date,
    s.module_name,
    s.metric_name,
    s.metric_value,
    k.target_value,
    CASE WHEN k.target_value IS NULL THEN 'No Target'
         WHEN s.metric_value >= k.target_value THEN 'On Target'
         WHEN s.metric_value >= COALESCE(k.warning_threshold,0) THEN 'Warning'
         ELSE 'Critical' END performance_status
FROM ra_analytics_snapshots s
LEFT JOIN ra_kpi_definitions k ON k.kpi_name = s.metric_name AND k.deleted_at IS NULL
WHERE s.deleted_at IS NULL;
