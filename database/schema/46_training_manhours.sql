-- ==================================================
-- TABLE NAME
--   training_manhours
--
-- Purpose
--   Employee-wise training hours and manhours for monthly, yearly, department,
--   training-type, and cost-effectiveness dashboards.
--
-- Relationships
--   employees, training_sessions, departments, users as verifiers/auditors.
--
-- Indexes
--   Employee/month/year, department/month/year, session, approval, and date analytics.
--
-- Workflow
--   Calculated -> Submitted -> Approved or Rejected -> Verified.
--
-- Author
--   CBL HSE Database Architecture
--
-- Version
--   1.0.0 | Phase 6 | MySQL 8
-- ==================================================

USE cbl_hse;

CREATE TABLE IF NOT EXISTS training_manhours (
    training_manhour_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    employee_id         CHAR(36) NOT NULL,
    training_session_id BIGINT UNSIGNED NOT NULL,
    department_id       CHAR(36) NOT NULL,
    training_hours      DECIMAL(8,2) NOT NULL,
    manhours            DECIMAL(10,2) NOT NULL,
    month_number        TINYINT UNSIGNED NOT NULL,
    year_number         SMALLINT UNSIGNED NOT NULL,
    calculated_hours    DECIMAL(10,2) NOT NULL,
    approval_status     ENUM('calculated', 'submitted', 'approved', 'rejected', 'verified') NOT NULL DEFAULT 'calculated',
    verified_by         CHAR(36) NULL,
    verified_at         DATETIME(3) NULL,
    remarks             TEXT NULL,
    created_by          BIGINT UNSIGNED NOT NULL,
    updated_by          BIGINT UNSIGNED NOT NULL,
    created_at          DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at          DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at          DATETIME(3) NULL,

    PRIMARY KEY (training_manhour_id),
    UNIQUE KEY uq_training_manhour_employee_session (employee_id, training_session_id),
    CONSTRAINT chk_training_manhour_values CHECK (training_hours > 0 AND manhours >= 0 AND calculated_hours >= 0 AND month_number BETWEEN 1 AND 12 AND year_number >= 2000),
    CONSTRAINT chk_training_manhour_verification CHECK (approval_status <> 'verified' OR (verified_by IS NOT NULL AND verified_at IS NOT NULL)),
    CONSTRAINT fk_training_manhour_employee FOREIGN KEY (employee_id) REFERENCES employees (employee_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_training_manhour_session FOREIGN KEY (training_session_id) REFERENCES training_sessions (training_session_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_training_manhour_department FOREIGN KEY (department_id) REFERENCES departments (department_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_training_manhour_verifier FOREIGN KEY (verified_by) REFERENCES employees (employee_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_training_manhour_created_by FOREIGN KEY (created_by) REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_training_manhour_updated_by FOREIGN KEY (updated_by) REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_training_manhour_employee_period (employee_id, year_number, month_number),
    INDEX idx_training_manhour_department_period (department_id, year_number, month_number),
    INDEX idx_training_manhour_session (training_session_id),
    INDEX idx_training_manhour_approval (approval_status, verified_at),
    INDEX idx_training_manhour_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Approved training hours and employee manhours for compliance reporting.';

INSERT INTO training_manhours
    (employee_id, training_session_id, department_id, training_hours, manhours, month_number, year_number, calculated_hours, approval_status, verified_by, verified_at, remarks, created_by, updated_by)
VALUES
    ('EMP-PROD-003', 1, 'DEP-PROD-001', 7.00, 7.00, 8, 2026, 7.00, 'verified', 'EMP-HSE-001', '2026-08-06 10:00:00.000', 'Induction hours included in August compliance report.', 1, 1),
    ('EMP-HSE-003', 2, 'DEP-HSE-001', 4.00, 4.00, 8, 2026, 4.00, 'approved', NULL, NULL, 'Fire refresher attendance approved by HSE Manager.', 2, 2),
    ('EMP-ENG-002', 3, 'DEP-ENG-001', 16.00, 16.00, 8, 2026, 16.00, 'submitted', NULL, NULL, 'Awaiting maintenance manager confirmation.', 3, 3),
    ('EMP-PROD-002', 5, 'DEP-PROD-001', 4.00, 4.00, 7, 2026, 4.00, 'verified', 'EMP-HSE-001', '2026-07-15 09:00:00.000', 'Food safety refresher included in July report.', 1, 1),
    ('EMP-ENG-001', 4, 'DEP-ENG-001', 8.00, 8.00, 8, 2026, 8.00, 'calculated', NULL, NULL, 'External practical session pending attendance reconciliation.', 1, 1);

SELECT training_manhour_id, employee_id, department_id, month_number, year_number, calculated_hours, approval_status
FROM training_manhours WHERE deleted_at IS NULL ORDER BY year_number, month_number, training_manhour_id;
