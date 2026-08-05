-- ==================================================
-- TABLE NAME
--   training_need_assessment
--
-- Purpose
--   Enterprise Training Needs Analysis register for competency gaps, requested
--   courses, priority, approval, target month, and progress dashboards.
--
-- Relationships
--   employees, departments, training_types, and users as requesters/approvers.
--
-- Indexes
--   Employee/target month, department/priority, status/target month, training type,
--   request/approval users, and soft deletion.
--
-- Workflow
--   Draft -> Submitted -> Pending Approval -> Approved/Rejected -> Completed.
--
-- Author
--   CBL HSE Database Architecture
--
-- Version
--   1.0.0 | Phase 6 | MySQL 8
-- ==================================================

USE cbl_hse;

CREATE TABLE IF NOT EXISTS training_need_assessment (
    tna_id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    employee_id         CHAR(36) NOT NULL,
    department_id       CHAR(36) NOT NULL,
    designation         VARCHAR(150) NOT NULL COMMENT 'Designation snapshot at assessment time.',
    training_type_id    BIGINT UNSIGNED NOT NULL,
    reason              TEXT NOT NULL,
    competency_gap      TEXT NOT NULL,
    priority            ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'medium',
    requested_by        BIGINT UNSIGNED NOT NULL,
    approved_by         BIGINT UNSIGNED NULL,
    requested_at        DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    approved_at         DATETIME(3) NULL,
    target_month        DATE NOT NULL COMMENT 'First day of the target month.',
    status              ENUM('draft', 'submitted', 'pending_approval', 'approved', 'rejected', 'completed') NOT NULL DEFAULT 'draft',
    remarks             TEXT NULL,
    created_by          BIGINT UNSIGNED NOT NULL,
    updated_by          BIGINT UNSIGNED NOT NULL,
    created_at          DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at          DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at          DATETIME(3) NULL,

    PRIMARY KEY (tna_id),
    CONSTRAINT chk_tna_target_month CHECK (DAY(target_month) = 1),
    CONSTRAINT chk_tna_approval CHECK (status NOT IN ('approved', 'rejected', 'completed') OR approved_by IS NOT NULL),
    CONSTRAINT fk_tna_employee FOREIGN KEY (employee_id) REFERENCES employees (employee_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_tna_department FOREIGN KEY (department_id) REFERENCES departments (department_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_tna_training_type FOREIGN KEY (training_type_id) REFERENCES training_types (training_type_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_tna_requested_by FOREIGN KEY (requested_by) REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_tna_approved_by FOREIGN KEY (approved_by) REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_tna_created_by FOREIGN KEY (created_by) REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_tna_updated_by FOREIGN KEY (updated_by) REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_tna_employee_month (employee_id, target_month),
    INDEX idx_tna_department_priority (department_id, priority),
    INDEX idx_tna_status_month (status, target_month),
    INDEX idx_tna_training_type (training_type_id, status),
    INDEX idx_tna_approval (approved_by, approved_at),
    INDEX idx_tna_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Enterprise training needs assessment and approval workflow.';

INSERT INTO training_need_assessment
    (employee_id, department_id, designation, training_type_id, reason, competency_gap, priority, requested_by, approved_by, requested_at, approved_at, target_month, status, remarks, created_by, updated_by)
VALUES
    ('EMP-PROD-003', 'DEP-PROD-001', 'Production Operator', 11, 'Operator will be assigned to the upgraded packing line.', 'Insufficient knowledge of new guarding and interlock checks.', 'high', 4, 1, '2026-07-01 09:00:00.000', '2026-07-03 10:00:00.000', '2026-08-01', 'approved', 'Include practical assessment.', 4, 1),
    ('EMP-ENG-002', 'DEP-ENG-001', 'Mechanical Engineer', 8, 'Electrical and mechanical isolation duties are expanding.', 'LOTO authorization is not current for the new MCC configuration.', 'critical', 7, 1, '2026-07-02 11:00:00.000', '2026-07-03 09:00:00.000', '2026-08-01', 'completed', 'Mapped to TRN-2026-00003.', 7, 1),
    ('EMP-PROD-002', 'DEP-PROD-001', 'Production Supervisor', 18, 'Supervisor development plan requires visible safety leadership.', 'Needs structured coaching and observation skills.', 'medium', 4, NULL, '2026-08-01 09:00:00.000', NULL, '2026-09-01', 'pending_approval', NULL, 4, 4),
    ('EMP-HSE-003', 'DEP-HSE-001', 'HSE Officer', 13, 'Annual management-system awareness refresh is due.', 'Needs documented ISO 45001 internal audit interface training.', 'medium', 2, 1, '2026-07-15 10:00:00.000', '2026-07-16 10:00:00.000', '2026-09-01', 'approved', NULL, 2, 1),
    ('EMP-ENG-001', 'DEP-ENG-001', 'Engineering Manager', 14, 'Quality system integration objective for engineering work orders.', 'Needs ISO 9001 process and risk-based-thinking awareness.', 'low', 7, NULL, '2026-08-02 14:00:00.000', NULL, '2026-10-01', 'submitted', NULL, 7, 7);

SELECT tna_id, employee_id, department_id, training_type_id, priority, target_month, status
FROM training_need_assessment WHERE deleted_at IS NULL ORDER BY target_month, priority;
