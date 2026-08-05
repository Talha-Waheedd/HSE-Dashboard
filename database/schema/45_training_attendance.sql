-- ==================================================
-- TABLE NAME
--   training_attendance
--
-- Purpose
--   Participant-level attendance, time, percentage, signature, and exception record.
--   Supports employee, contractor, and visitor participation without duplicating masters.
--
-- Relationships
--   training_sessions, employees, contractors, and users.
--
-- Indexes
--   Session/status, participant histories, contractor compliance, attendance percentage, deletion.
--
-- Workflow
--   Registered -> Present/Late/Absent/Excused -> attendance verified.
--
-- Author
--   CBL HSE Database Architecture
--
-- Version
--   1.0.0 | Phase 6 | MySQL 8
-- ==================================================

USE cbl_hse;

CREATE TABLE IF NOT EXISTS training_attendance (
    attendance_id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    training_session_id    BIGINT UNSIGNED NOT NULL,
    employee_id            CHAR(36) NULL,
    contractor_id          CHAR(36) NULL,
    visitor_name           VARCHAR(200) NULL,
    attendance_status      ENUM('present', 'absent', 'late', 'excused') NOT NULL,
    joining_time           DATETIME(3) NULL,
    leaving_time           DATETIME(3) NULL,
    attendance_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    digital_signature_placeholder VARCHAR(255) NULL,
    remarks                TEXT NULL,
    created_by             BIGINT UNSIGNED NOT NULL,
    updated_by             BIGINT UNSIGNED NOT NULL,
    created_at             DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at             DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at             DATETIME(3) NULL,

    PRIMARY KEY (attendance_id),
    UNIQUE KEY uq_training_attendance_employee (training_session_id, employee_id),
    CONSTRAINT chk_training_attendance_person CHECK ((employee_id IS NOT NULL AND contractor_id IS NULL AND visitor_name IS NULL) OR (employee_id IS NULL AND contractor_id IS NOT NULL AND visitor_name IS NULL) OR (employee_id IS NULL AND contractor_id IS NULL AND visitor_name IS NOT NULL)),
    CONSTRAINT chk_training_attendance_percentage CHECK (attendance_percentage BETWEEN 0.00 AND 100.00),
    CONSTRAINT chk_training_attendance_times CHECK (leaving_time IS NULL OR joining_time IS NULL OR leaving_time >= joining_time),
    CONSTRAINT fk_training_attendance_session FOREIGN KEY (training_session_id) REFERENCES training_sessions (training_session_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_training_attendance_employee FOREIGN KEY (employee_id) REFERENCES employees (employee_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_training_attendance_contractor FOREIGN KEY (contractor_id) REFERENCES contractors (contractor_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_training_attendance_created_by FOREIGN KEY (created_by) REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_training_attendance_updated_by FOREIGN KEY (updated_by) REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_training_attendance_session_status (training_session_id, attendance_status),
    INDEX idx_training_attendance_employee (employee_id, training_session_id),
    INDEX idx_training_attendance_contractor (contractor_id, training_session_id),
    INDEX idx_training_attendance_percentage (attendance_percentage),
    INDEX idx_training_attendance_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Training participation and attendance evidence.';

INSERT INTO training_attendance
    (training_session_id, employee_id, contractor_id, visitor_name, attendance_status, joining_time, leaving_time, attendance_percentage, digital_signature_placeholder, remarks, created_by, updated_by)
VALUES
    (1, 'EMP-PROD-003', NULL, NULL, 'present', '2026-08-05 08:55:00.000', '2026-08-05 16:05:00.000', 100.00, 'SIG-ATT-TRN00001-EMP-PROD-003', 'Completed induction and site walk.', 1, 1),
    (1, NULL, 'CON-001', NULL, 'late', '2026-08-05 09:25:00.000', '2026-08-05 16:00:00.000', 90.00, 'SIG-ATT-TRN00001-CON-001', 'Late arrival recorded by HSE.', 1, 1),
    (2, 'EMP-HSE-003', NULL, NULL, 'present', '2026-08-12 09:50:00.000', '2026-08-12 14:10:00.000', 100.00, 'SIG-ATT-TRN00002-EMP-HSE-003', NULL, 2, 2),
    (3, 'EMP-ENG-002', NULL, NULL, 'excused', NULL, NULL, 0.00, NULL, 'Excused due to approved maintenance outage.', 3, 3),
    (4, NULL, NULL, 'Bilal Ahmed', 'present', '2026-08-22 08:55:00.000', '2026-08-22 17:05:00.000', 100.00, 'SIG-ATT-TRN00004-VIS-001', 'Vendor assessor attended practical demonstration.', 1, 1);

SELECT attendance_id, training_session_id, employee_id, contractor_id, visitor_name, attendance_status, attendance_percentage
FROM training_attendance WHERE deleted_at IS NULL ORDER BY training_session_id, attendance_id;
