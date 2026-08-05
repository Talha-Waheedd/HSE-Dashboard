-- ==================================================
-- TABLE NAME
--   tm_employee_training_history
--
-- Purpose
--   Permanent employee training completion history, separated from the live
--   attendance ledger so compliance reporting remains stable after corrections.
--
-- Relationships
--   employees, tm_training_sessions, users.
--
-- Indexes
--   Employee/completion, session, expiry, certificate, and soft deletion.
--
-- Workflow
--   Created from a completed attendance record and retained as the employee history.
--
-- Author
--   CBL HSE Database Architecture
--
-- Version
--   1.0.0 | Training Management Extension | MySQL 8
-- ==================================================

USE cbl_hse;

CREATE TABLE IF NOT EXISTS tm_employee_training_history (
    employee_training_history_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    employee_id                  CHAR(36) NOT NULL,
    training_session_id         BIGINT UNSIGNED NOT NULL,
    completion_date              DATE NOT NULL,
    expiry_date                  DATE NULL,
    certificate_number           VARCHAR(120) NULL,
    certificate_file             VARCHAR(1000) NULL,
    status                       ENUM('completed', 'expired', 'revoked', 'cancelled') NOT NULL DEFAULT 'completed',
    created_by                   BIGINT UNSIGNED NOT NULL,
    updated_by                   BIGINT UNSIGNED NOT NULL,
    created_at                   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at                   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at                   DATETIME(3) NULL,
    PRIMARY KEY (employee_training_history_id),
    UNIQUE KEY uq_tm_employee_history_session (employee_id, training_session_id),
    CONSTRAINT chk_tm_history_expiry CHECK (expiry_date IS NULL OR expiry_date >= completion_date),
    CONSTRAINT fk_tm_history_employee FOREIGN KEY (employee_id) REFERENCES employees (employee_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_tm_history_session FOREIGN KEY (training_session_id) REFERENCES tm_training_sessions (training_session_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_tm_history_created_by FOREIGN KEY (created_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_tm_history_updated_by FOREIGN KEY (updated_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_tm_history_employee_completion (employee_id, completion_date),
    INDEX idx_tm_history_session (training_session_id),
    INDEX idx_tm_history_expiry (expiry_date, status),
    INDEX idx_tm_history_certificate (certificate_number),
    INDEX idx_tm_history_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Permanent employee training completion history.';

INSERT INTO tm_employee_training_history (employee_id, training_session_id, completion_date, expiry_date, certificate_number, certificate_file, status, created_by, updated_by)
SELECT a.employee_id, a.training_session_id, s.training_date, a.certificate_expiry, a.certificate_number,
       CASE WHEN a.certificate_number IS NULL THEN NULL ELSE CONCAT('hse/training/certificates/', a.certificate_number, '.pdf') END,
       CASE WHEN a.certificate_expiry IS NOT NULL AND a.certificate_expiry < CURRENT_DATE THEN 'expired' ELSE 'completed' END, 1, 1
FROM tm_training_attendance a JOIN tm_training_sessions s ON s.training_session_id = a.training_session_id
WHERE s.status = 'completed' AND a.attendance_status IN ('present', 'late');

SELECT COUNT(*) AS completed_history_count FROM tm_employee_training_history WHERE deleted_at IS NULL;
