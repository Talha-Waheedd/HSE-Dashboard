-- ==================================================
-- TABLE NAME
--   am_compliance_tracking
--
-- Purpose
--   Recurring compliance obligation tracking for requirements, departments,
--   owners, due dates, evidence, completion, and status history.
--
-- Relationships
--   am_compliance_requirements, departments, employees, users.
--
-- Indexes
--   Requirement/period, department/status, owner/due date, overdue queue, deletion.
--
-- Workflow
--   Open -> In Progress -> Completed/Compliant or Overdue.
--
-- Author
--   CBL HSE Database Architecture
--
-- Version
--   1.0.0 | Audit and Inspection Extension | MySQL 8
-- ==================================================

USE cbl_hse;

CREATE TABLE IF NOT EXISTS am_compliance_tracking (
    compliance_tracking_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    requirement_id         BIGINT UNSIGNED NOT NULL,
    department_id          CHAR(36) NOT NULL,
    responsible_person_id  CHAR(36) NOT NULL,
    due_date               DATE NOT NULL,
    completion_date        DATE NULL,
    status                 ENUM('open','in_progress','completed','compliant','overdue','not_applicable') NOT NULL DEFAULT 'open',
    evidence               VARCHAR(1000) NULL,
    remarks                TEXT NULL,
    recurrence_period      DATE NOT NULL COMMENT 'First day of the compliance period.',
    created_by             BIGINT UNSIGNED NOT NULL,
    updated_by             BIGINT UNSIGNED NOT NULL,
    created_at             DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at             DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at             DATETIME(3) NULL,
    PRIMARY KEY (compliance_tracking_id),
    UNIQUE KEY uq_am_compliance_requirement_period (requirement_id, department_id, recurrence_period),
    CONSTRAINT chk_am_compliance_dates CHECK (completion_date IS NULL OR completion_date >= recurrence_period),
    CONSTRAINT fk_am_compliance_requirement FOREIGN KEY (requirement_id) REFERENCES am_compliance_requirements (requirement_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_am_compliance_department FOREIGN KEY (department_id) REFERENCES departments (department_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_am_compliance_owner FOREIGN KEY (responsible_person_id) REFERENCES employees (employee_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_am_compliance_created_by FOREIGN KEY (created_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_am_compliance_updated_by FOREIGN KEY (updated_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_am_compliance_requirement_period (requirement_id, recurrence_period),
    INDEX idx_am_compliance_department_status (department_id, status),
    INDEX idx_am_compliance_owner_due (responsible_person_id, due_date),
    INDEX idx_am_compliance_overdue (status, due_date),
    INDEX idx_am_compliance_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Recurring compliance obligation tracking.';

INSERT INTO am_compliance_tracking (requirement_id,department_id,responsible_person_id,due_date,completion_date,status,evidence,remarks,recurrence_period,created_by,updated_by)
SELECT r.requirement_id,
       CASE WHEN MOD(r.requirement_id,2)=0 THEN 'DEP-PROD-001' ELSE r.responsible_department_id END,
       CASE WHEN MOD(r.requirement_id,3)=0 THEN 'EMP-HSE-002' WHEN MOD(r.requirement_id,3)=1 THEN 'EMP-HSE-001' ELSE 'EMP-ENG-001' END,
       DATE_ADD('2026-08-01',INTERVAL MOD(r.requirement_id,45) DAY),
       CASE WHEN MOD(r.requirement_id,4)=0 THEN DATE_ADD('2026-08-01',INTERVAL MOD(r.requirement_id,20) DAY) ELSE NULL END,
       CASE WHEN MOD(r.requirement_id,4)=0 THEN 'completed' WHEN MOD(r.requirement_id,5)=0 THEN 'overdue' WHEN MOD(r.requirement_id,3)=0 THEN 'in_progress' ELSE 'open' END,
       CASE WHEN MOD(r.requirement_id,4)=0 THEN CONCAT('hse/compliance/evidence/REQ-',r.requirement_id,'.pdf') ELSE NULL END,
       'Recurring compliance tracking record for dashboard testing.',
       DATE_ADD('2026-08-01',INTERVAL (x.n-1) MONTH),1,1
FROM am_compliance_requirements r CROSS JOIN (SELECT 1 n UNION ALL SELECT 2) x;

SELECT COUNT(*) AS compliance_tracking_count FROM am_compliance_tracking WHERE deleted_at IS NULL;
