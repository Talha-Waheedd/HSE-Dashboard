-- ==================================================
-- TABLE NAME
--   tm_training_attendance
--
-- Purpose
--   Many-to-many participant ledger. One row represents one employee, contractor,
--   or visitor attending one Training Management session.
--
-- Relationships
--   tm_training_sessions, employees, contractors, users.
--
-- Indexes
--   Session/attendance, employee/session, certificate expiry, status, deletion.
--
-- Workflow
--   Registered -> Present/Absent/Late/Excused -> certificate issued where required.
--
-- Author
--   CBL HSE Database Architecture
--
-- Version
--   1.0.0 | Training Management Extension | MySQL 8
-- ==================================================

USE cbl_hse;

CREATE TABLE IF NOT EXISTS tm_training_attendance (
    attendance_id       BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    training_session_id BIGINT UNSIGNED NOT NULL,
    employee_id         CHAR(36) NOT NULL,
    attendance_status   ENUM('present', 'absent', 'late', 'excused') NOT NULL,
    sign_in_time        DATETIME(3) NULL,
    sign_out_time       DATETIME(3) NULL,
    evaluation_score    DECIMAL(5,2) NULL,
    feedback            TEXT NULL,
    certificate_issued  BOOLEAN NOT NULL DEFAULT FALSE,
    certificate_number  VARCHAR(120) NULL,
    certificate_expiry  DATE NULL,
    status              ENUM('active', 'cancelled') NOT NULL DEFAULT 'active',
    manhours            DECIMAL(8,2) GENERATED ALWAYS AS (CASE WHEN sign_in_time IS NOT NULL AND sign_out_time IS NOT NULL THEN TIMESTAMPDIFF(MINUTE, sign_in_time, sign_out_time) / 60 ELSE 0 END) STORED,
    attendance_percent  DECIMAL(5,2) GENERATED ALWAYS AS (CASE WHEN attendance_status IN ('present','late') THEN 100.00 ELSE 0.00 END) STORED,
    created_by          BIGINT UNSIGNED NOT NULL,
    updated_by          BIGINT UNSIGNED NOT NULL,
    created_at          DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at          DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at          DATETIME(3) NULL,
    PRIMARY KEY (attendance_id),
    UNIQUE KEY uq_tm_attendance_session_employee (training_session_id, employee_id),
    CONSTRAINT chk_tm_attendance_times CHECK (sign_out_time IS NULL OR sign_in_time IS NULL OR sign_out_time >= sign_in_time),
    CONSTRAINT chk_tm_attendance_certificate CHECK (certificate_issued = FALSE OR certificate_number IS NOT NULL),
    CONSTRAINT chk_tm_attendance_score CHECK (evaluation_score IS NULL OR evaluation_score BETWEEN 0 AND 100),
    CONSTRAINT fk_tm_attendance_session FOREIGN KEY (training_session_id) REFERENCES tm_training_sessions (training_session_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_tm_attendance_employee FOREIGN KEY (employee_id) REFERENCES employees (employee_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_tm_attendance_created_by FOREIGN KEY (created_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_tm_attendance_updated_by FOREIGN KEY (updated_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_tm_attendance_session_status (training_session_id, attendance_status),
    INDEX idx_tm_attendance_employee_session (employee_id, training_session_id),
    INDEX idx_tm_attendance_certificate_expiry (certificate_expiry),
    INDEX idx_tm_attendance_status (status, attendance_status),
    INDEX idx_tm_attendance_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Training Management participant attendance, calculated manhours, and certificate data.';

INSERT INTO tm_training_attendance (training_session_id, employee_id, attendance_status, sign_in_time, sign_out_time, evaluation_score, feedback, certificate_issued, certificate_number, certificate_expiry, created_by, updated_by)
SELECT s.training_session_id, e.employee_id,
       CASE WHEN MOD(CRC32(e.employee_id) + s.training_session_id, 17) = 0 THEN 'absent' WHEN MOD(CRC32(e.employee_id) + s.training_session_id, 11) = 0 THEN 'late' ELSE 'present' END,
       CASE WHEN MOD(CRC32(e.employee_id) + s.training_session_id, 17) = 0 THEN NULL ELSE TIMESTAMP(s.training_date, s.start_time) END,
       CASE WHEN MOD(CRC32(e.employee_id) + s.training_session_id, 17) = 0 THEN NULL ELSE TIMESTAMP(s.training_date, s.end_time) END,
       CASE WHEN MOD(CRC32(e.employee_id) + s.training_session_id, 17) = 0 THEN NULL ELSE 70 + MOD(CRC32(e.employee_id) + s.training_session_id, 31) END,
       'Generated enterprise attendance record for the session cohort.',
       CASE WHEN s.certificate_required = TRUE AND MOD(CRC32(e.employee_id) + s.training_session_id, 17) <> 0 THEN TRUE ELSE FALSE END,
       CASE WHEN s.certificate_required = TRUE AND MOD(CRC32(e.employee_id) + s.training_session_id, 17) <> 0 THEN CONCAT('TM-CERT-', s.training_session_id, '-', e.employee_id) ELSE NULL END,
       CASE WHEN s.certificate_required = TRUE AND MOD(CRC32(e.employee_id) + s.training_session_id, 17) <> 0 THEN s.certificate_expiry ELSE NULL END,
       1, 1
FROM tm_training_sessions s
JOIN employees e ON e.employee_id IN ('EMP-HSE-001','EMP-HSE-002','EMP-HSE-003','EMP-PROD-001','EMP-PROD-002','EMP-PROD-003','EMP-ENG-001','EMP-ENG-002','EMP-ADMIN-001','EMP-QC-001')
WHERE s.training_session_id BETWEEN 1 AND 15;

SELECT COUNT(*) AS attendance_record_count FROM tm_training_attendance WHERE deleted_at IS NULL;
