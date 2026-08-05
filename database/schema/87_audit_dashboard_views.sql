-- ==================================================
-- TABLE NAME
--   Audit and Inspection dashboard views
--
-- Purpose
--   Read-only KPI and trend layer for audit scores, findings, inspection results,
--   department compliance, risk, upcoming work, and recurring obligations.
--
-- Relationships
--   Reads am_audits, am_audit_findings, am_inspections, am_inspection_results,
--   am_compliance_requirements, am_compliance_tracking, and existing master tables.
--
-- Indexes
--   Views use indexes on source tables; no physical tables are created.
--
-- Workflow
--   Views are evaluated at query time and reflect current soft-delete/status data.
--
-- Author
--   CBL HSE Database Architecture
--
-- Version
--   1.0.0 | Audit and Inspection Extension | MySQL 8
-- ==================================================

USE cbl_hse;

CREATE OR REPLACE VIEW vw_audit_summary AS
SELECT a.audit_id,a.audit_number,a.audit_date,a.planned_date,t.name AS audit_type,a.status,a.overall_score,a.compliance_percentage,COUNT(f.finding_id) AS finding_count
FROM am_audits a JOIN am_audit_types t ON t.audit_type_id=a.audit_type_id LEFT JOIN am_audit_findings f ON f.audit_id=a.audit_id AND f.deleted_at IS NULL
WHERE a.deleted_at IS NULL GROUP BY a.audit_id,a.audit_number,a.audit_date,a.planned_date,t.name,a.status,a.overall_score,a.compliance_percentage;

CREATE OR REPLACE VIEW vw_open_findings AS
SELECT f.finding_id,f.finding_number,f.audit_id,f.category,f.severity,f.description,f.due_date,f.status,f.responsible_person_id
FROM am_audit_findings f WHERE f.deleted_at IS NULL AND f.status NOT IN ('closed','rejected');

CREATE OR REPLACE VIEW vw_closed_findings AS
SELECT f.finding_id,f.finding_number,f.audit_id,f.category,f.severity,f.description,f.due_date,f.status,f.updated_at
FROM am_audit_findings f WHERE f.deleted_at IS NULL AND f.status='closed';

CREATE OR REPLACE VIEW vw_department_audit_score AS
SELECT a.department_id,d.department_name,COUNT(*) AS audit_count,AVG(a.overall_score) AS average_score,AVG(a.compliance_percentage) AS average_compliance
FROM am_audits a LEFT JOIN departments d ON d.department_id=a.department_id
WHERE a.deleted_at IS NULL AND a.overall_score IS NOT NULL GROUP BY a.department_id,d.department_name;

CREATE OR REPLACE VIEW vw_monthly_audits AS
SELECT YEAR(audit_date) AS audit_year,MONTH(audit_date) AS audit_month,COUNT(*) AS audit_count,AVG(compliance_percentage) AS average_compliance
FROM am_audits WHERE deleted_at IS NULL GROUP BY YEAR(audit_date),MONTH(audit_date);

CREATE OR REPLACE VIEW vw_upcoming_inspections AS
SELECT i.inspection_id,i.inspection_number,t.name AS inspection_type,i.inspection_date,i.next_due_date,i.status,i.department_id
FROM am_inspections i JOIN am_inspection_types t ON t.inspection_type_id=i.inspection_type_id
WHERE i.deleted_at IS NULL AND i.status='planned' ORDER BY i.inspection_date;

CREATE OR REPLACE VIEW vw_failed_inspections AS
SELECT i.inspection_id,i.inspection_number,t.name AS inspection_type,i.inspection_date,i.score,i.status,COUNT(r.inspection_result_id) AS failed_items
FROM am_inspections i JOIN am_inspection_types t ON t.inspection_type_id=i.inspection_type_id LEFT JOIN am_inspection_results r ON r.inspection_id=i.inspection_id AND r.result='fail' AND r.deleted_at IS NULL
WHERE i.deleted_at IS NULL AND (i.overall_result='fail' OR r.inspection_result_id IS NOT NULL)
GROUP BY i.inspection_id,i.inspection_number,t.name,i.inspection_date,i.score,i.status;

CREATE OR REPLACE VIEW vw_compliance_status AS
SELECT r.requirement_id,r.requirement_code,r.name,r.frequency,r.mandatory,r.active,COUNT(c.compliance_tracking_id) AS tracking_records,SUM(c.status IN ('completed','compliant')) AS completed_records,SUM(c.status='overdue') AS overdue_records
FROM am_compliance_requirements r LEFT JOIN am_compliance_tracking c ON c.requirement_id=r.requirement_id AND c.deleted_at IS NULL
WHERE r.deleted_at IS NULL GROUP BY r.requirement_id,r.requirement_code,r.name,r.frequency,r.mandatory,r.active;

CREATE OR REPLACE VIEW vw_overdue_compliance AS
SELECT c.compliance_tracking_id,c.requirement_id,r.requirement_code,r.name,c.department_id,c.responsible_person_id,c.due_date,c.status,DATEDIFF(CURRENT_DATE,c.due_date) AS overdue_days
FROM am_compliance_tracking c JOIN am_compliance_requirements r ON r.requirement_id=c.requirement_id
WHERE c.deleted_at IS NULL AND c.status NOT IN ('completed','compliant','not_applicable') AND c.due_date < CURRENT_DATE;

CREATE OR REPLACE VIEW vw_audit_trends AS
SELECT YEAR(audit_date) AS audit_year,MONTH(audit_date) AS audit_month,COUNT(*) AS audits_completed,AVG(overall_score) AS average_score,AVG(compliance_percentage) AS average_compliance
FROM am_audits WHERE deleted_at IS NULL AND status IN ('approved','closed') GROUP BY YEAR(audit_date),MONTH(audit_date);

CREATE OR REPLACE VIEW vw_top_risk_findings AS
SELECT f.risk_rating_id,rr.rating_name,f.severity,COUNT(*) AS finding_count
FROM am_audit_findings f LEFT JOIN risk_ratings rr ON rr.risk_rating_id=f.risk_rating_id
WHERE f.deleted_at IS NULL GROUP BY f.risk_rating_id,rr.rating_name,f.severity ORDER BY finding_count DESC;

CREATE OR REPLACE VIEW vw_inspection_summary AS
SELECT i.inspection_id,i.inspection_number,i.inspection_date,t.name AS inspection_type,i.status,i.overall_result,i.score,COUNT(r.inspection_result_id) AS checklist_results,SUM(r.result='fail') AS failed_results
FROM am_inspections i JOIN am_inspection_types t ON t.inspection_type_id=i.inspection_type_id LEFT JOIN am_inspection_results r ON r.inspection_id=i.inspection_id AND r.deleted_at IS NULL
WHERE i.deleted_at IS NULL GROUP BY i.inspection_id,i.inspection_number,i.inspection_date,t.name,i.status,i.overall_result,i.score;

CREATE OR REPLACE VIEW vw_checklist_failure_rate AS
SELECT c.inspection_type_id,t.name AS inspection_type,COUNT(r.inspection_result_id) AS result_count,SUM(r.result='fail') AS failures,ROUND(SUM(r.result='fail')/NULLIF(COUNT(r.inspection_result_id),0)*100,2) AS failure_rate
FROM am_inspection_results r JOIN am_inspection_checklists c ON c.checklist_item_id=r.checklist_item_id JOIN am_inspection_types t ON t.inspection_type_id=c.inspection_type_id
WHERE r.deleted_at IS NULL GROUP BY c.inspection_type_id,t.name;

CREATE OR REPLACE VIEW vw_department_compliance AS
SELECT c.department_id,d.department_name,COUNT(*) AS obligation_count,SUM(c.status IN ('completed','compliant')) AS compliant_count,ROUND(SUM(c.status IN ('completed','compliant'))/NULLIF(COUNT(*),0)*100,2) AS compliance_percentage
FROM am_compliance_tracking c LEFT JOIN departments d ON d.department_id=c.department_id
WHERE c.deleted_at IS NULL GROUP BY c.department_id,d.department_name;

CREATE OR REPLACE VIEW vw_audit_scorecard AS
SELECT a.audit_type_id,t.name AS audit_type,COUNT(*) AS audit_count,AVG(a.overall_score) AS average_score,MIN(a.overall_score) AS minimum_score,MAX(a.overall_score) AS maximum_score,AVG(a.compliance_percentage) AS average_compliance
FROM am_audits a JOIN am_audit_types t ON t.audit_type_id=a.audit_type_id
WHERE a.deleted_at IS NULL AND a.status IN ('approved','closed') GROUP BY a.audit_type_id,t.name;
