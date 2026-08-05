-- ==================================================
-- TABLE NAME
--   Training Management dashboard views
--
-- Purpose
--   Read-only reporting layer for session calendar, hours, history, certificates,
--   compliance, attendance, costs, trends, departments, types, and providers.
--
-- Relationships
--   Reads tm_training_* tables and existing plants, departments, employees, users.
--
-- Indexes
--   Views rely on indexed source tables; no physical table indexes are created here.
--
-- Workflow
--   Views are refreshed automatically by MySQL query execution.
--
-- Author
--   CBL HSE Database Architecture
--
-- Version
--   1.0.0 | Training Management Extension | MySQL 8
-- ==================================================

USE cbl_hse;

CREATE OR REPLACE VIEW vw_training_summary AS
SELECT s.training_session_id, s.training_number, s.training_date, tt.training_type_name, tp.topic_name, p.company AS provider_company, s.status, s.duration_minutes, s.cost, s.actual_attendance, s.maximum_capacity, ROUND((s.actual_attendance / NULLIF(s.maximum_capacity,0)) * 100, 2) AS capacity_utilization_percent
FROM tm_training_sessions s JOIN tm_training_types tt ON tt.training_type_id=s.training_type_id JOIN tm_training_topics tp ON tp.training_topic_id=s.training_topic_id JOIN tm_training_providers p ON p.training_provider_id=s.training_provider_id WHERE s.deleted_at IS NULL;

CREATE OR REPLACE VIEW vw_department_training_hours AS
SELECT e.department_id, d.department_name, SUM(a.manhours) AS total_training_hours, COUNT(DISTINCT a.employee_id) AS employee_count
FROM tm_training_attendance a JOIN employees e ON e.employee_id=a.employee_id JOIN departments d ON d.department_id=e.department_id WHERE a.deleted_at IS NULL AND a.attendance_status IN ('present','late') GROUP BY e.department_id, d.department_name;

CREATE OR REPLACE VIEW vw_employee_training_history AS
SELECT h.employee_training_history_id, h.employee_id, e.full_name, e.department_id, h.training_session_id, s.training_number, tp.topic_name, tt.training_type_name, h.completion_date, h.expiry_date, h.certificate_number, h.status
FROM tm_employee_training_history h JOIN employees e ON e.employee_id=h.employee_id JOIN tm_training_sessions s ON s.training_session_id=h.training_session_id JOIN tm_training_topics tp ON tp.training_topic_id=s.training_topic_id JOIN tm_training_types tt ON tt.training_type_id=s.training_type_id WHERE h.deleted_at IS NULL;

CREATE OR REPLACE VIEW vw_certificate_expiry AS
SELECT h.employee_id, e.full_name, h.training_session_id, h.certificate_number, h.expiry_date, DATEDIFF(h.expiry_date, CURRENT_DATE) AS days_to_expiry, h.status
FROM tm_employee_training_history h JOIN employees e ON e.employee_id=h.employee_id WHERE h.deleted_at IS NULL AND h.expiry_date IS NOT NULL;

CREATE OR REPLACE VIEW vw_training_completion_rate AS
SELECT s.training_session_id, s.training_number, s.training_date, COUNT(a.attendance_id) AS participant_rows, SUM(a.attendance_status IN ('present','late')) AS completed_attendance, ROUND(SUM(a.attendance_status IN ('present','late')) / NULLIF(COUNT(a.attendance_id),0) * 100, 2) AS completion_percent
FROM tm_training_sessions s LEFT JOIN tm_training_attendance a ON a.training_session_id=s.training_session_id AND a.deleted_at IS NULL WHERE s.deleted_at IS NULL GROUP BY s.training_session_id, s.training_number, s.training_date;

CREATE OR REPLACE VIEW vw_overdue_training AS
SELECT h.employee_id, e.full_name, h.training_session_id, s.training_number, tp.topic_name, h.expiry_date, DATEDIFF(CURRENT_DATE, h.expiry_date) AS overdue_days
FROM tm_employee_training_history h JOIN employees e ON e.employee_id=h.employee_id JOIN tm_training_sessions s ON s.training_session_id=h.training_session_id JOIN tm_training_topics tp ON tp.training_topic_id=s.training_topic_id WHERE h.deleted_at IS NULL AND h.expiry_date < CURRENT_DATE AND h.status IN ('completed','expired');

CREATE OR REPLACE VIEW vw_training_attendance AS
SELECT a.attendance_id, a.training_session_id, s.training_number, a.employee_id, e.full_name, e.department_id, a.attendance_status, a.sign_in_time, a.sign_out_time, a.manhours, a.attendance_percent, a.evaluation_score, a.certificate_issued, a.certificate_expiry
FROM tm_training_attendance a JOIN employees e ON e.employee_id=a.employee_id JOIN tm_training_sessions s ON s.training_session_id=a.training_session_id WHERE a.deleted_at IS NULL;

CREATE OR REPLACE VIEW vw_training_cost_summary AS
SELECT YEAR(training_date) AS training_year, MONTH(training_date) AS training_month, COUNT(*) AS session_count, SUM(cost) AS total_cost, AVG(cost) AS average_cost
FROM tm_training_sessions WHERE deleted_at IS NULL GROUP BY YEAR(training_date), MONTH(training_date);

CREATE OR REPLACE VIEW vw_monthly_training_hours AS
SELECT YEAR(s.training_date) AS training_year, MONTH(s.training_date) AS training_month, SUM(a.manhours) AS total_training_hours
FROM tm_training_attendance a JOIN tm_training_sessions s ON s.training_session_id=a.training_session_id WHERE a.deleted_at IS NULL AND a.attendance_status IN ('present','late') GROUP BY YEAR(s.training_date), MONTH(s.training_date);

CREATE OR REPLACE VIEW vw_training_by_department AS
SELECT e.department_id, d.department_name, COUNT(DISTINCT a.training_session_id) AS sessions_attended, SUM(a.manhours) AS training_hours, AVG(a.evaluation_score) AS average_evaluation_score
FROM tm_training_attendance a JOIN employees e ON e.employee_id=a.employee_id JOIN departments d ON d.department_id=e.department_id WHERE a.deleted_at IS NULL GROUP BY e.department_id, d.department_name;

CREATE OR REPLACE VIEW vw_training_by_type AS
SELECT tt.training_type_id, tt.training_type_name, COUNT(DISTINCT s.training_session_id) AS sessions, SUM(s.duration_minutes) / 60 AS scheduled_hours, SUM(s.cost) AS total_cost
FROM tm_training_sessions s JOIN tm_training_types tt ON tt.training_type_id=s.training_type_id WHERE s.deleted_at IS NULL GROUP BY tt.training_type_id, tt.training_type_name;

CREATE OR REPLACE VIEW vw_training_provider_performance AS
SELECT p.training_provider_id, p.company, p.trainer_name, COUNT(DISTINCT s.training_session_id) AS sessions_delivered, AVG(a.evaluation_score) AS average_evaluation_score, AVG(a.attendance_percent) AS average_attendance_percent
FROM tm_training_providers p JOIN tm_training_sessions s ON s.training_provider_id=p.training_provider_id LEFT JOIN tm_training_attendance a ON a.training_session_id=s.training_session_id AND a.deleted_at IS NULL WHERE p.deleted_at IS NULL GROUP BY p.training_provider_id, p.company, p.trainer_name;
