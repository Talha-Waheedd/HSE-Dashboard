-- ==================================================
-- TABLE NAME
--   tm_training_need_assessment
--
-- Purpose
--   Training Needs Analysis register for competency gaps, requested training,
--   priority, approval, ownership, and target completion.
--
-- Relationships
--   employees, departments, tm_training_types, and users.
--
-- Indexes
--   Employee/target, department/status, required training, priority, approval, deletion.
--
-- Workflow
--   Draft -> Submitted -> Pending Approval -> Approved/Rejected -> Completed.
--
-- Author
--   CBL HSE Database Architecture
--
-- Version
--   1.0.0 | Training Management Extension | MySQL 8
-- ==================================================

USE cbl_hse;

CREATE TABLE IF NOT EXISTS tm_training_need_assessment (
    tna_id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    department_id       CHAR(36) NOT NULL,
    employee_id         CHAR(36) NOT NULL,
    competency_gap      TEXT NOT NULL,
    required_training_id BIGINT UNSIGNED NOT NULL,
    priority            ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'medium',
    reason              TEXT NOT NULL,
    requested_by        BIGINT UNSIGNED NOT NULL,
    approved_by         BIGINT UNSIGNED NULL,
    status              ENUM('draft', 'submitted', 'pending_approval', 'approved', 'rejected', 'completed') NOT NULL DEFAULT 'draft',
    remarks             TEXT NULL,
    target_completion   DATE NOT NULL,
    requested_at        DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    approved_at         DATETIME(3) NULL,
    created_by          BIGINT UNSIGNED NOT NULL,
    updated_by          BIGINT UNSIGNED NOT NULL,
    created_at          DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at          DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at          DATETIME(3) NULL,
    PRIMARY KEY (tna_id),
    CONSTRAINT chk_tm_tna_approval CHECK (status NOT IN ('approved', 'completed') OR approved_by IS NOT NULL),
    CONSTRAINT fk_tm_tna_department FOREIGN KEY (department_id) REFERENCES departments (department_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_tm_tna_employee FOREIGN KEY (employee_id) REFERENCES employees (employee_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_tm_tna_required_training FOREIGN KEY (required_training_id) REFERENCES tm_training_types (training_type_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_tm_tna_requested_by FOREIGN KEY (requested_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_tm_tna_approved_by FOREIGN KEY (approved_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_tm_tna_created_by FOREIGN KEY (created_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_tm_tna_updated_by FOREIGN KEY (updated_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_tm_tna_employee_target (employee_id, target_completion),
    INDEX idx_tm_tna_department_status (department_id, status),
    INDEX idx_tm_tna_required_training (required_training_id, status),
    INDEX idx_tm_tna_priority (priority, target_completion),
    INDEX idx_tm_tna_approval (approved_by, approved_at),
    INDEX idx_tm_tna_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Training Management TNA and approval workflow.';

INSERT INTO tm_training_need_assessment (department_id, employee_id, competency_gap, required_training_id, priority, reason, requested_by, approved_by, status, remarks, target_completion, requested_at, approved_at, created_by, updated_by)
SELECT e.department_id, e.employee_id,
       CONCAT('Competency gap identified for role-specific training item ', t.training_type_id),
       t.training_type_id,
       CASE WHEN t.training_type_id IN (3,12,15) THEN 'high' ELSE 'medium' END,
       'Annual competency review identified a training requirement.',
       CASE WHEN MOD(n.seq, 2) = 0 THEN 1 ELSE 2 END,
       CASE WHEN MOD(n.seq, 3) = 0 THEN 1 ELSE NULL END,
       CASE WHEN MOD(n.seq, 3) = 0 THEN 'approved' WHEN MOD(n.seq, 2) = 0 THEN 'pending_approval' ELSE 'submitted' END,
       'Generated enterprise TNA record for annual planning.',
       DATE_ADD('2026-09-01', INTERVAL MOD(n.seq, 6) MONTH),
       '2026-07-01 09:00:00.000',
       CASE WHEN MOD(n.seq, 3) = 0 THEN '2026-07-03 10:00:00.000' ELSE NULL END,
       1, 1
FROM employees e
CROSS JOIN (SELECT 1 seq UNION ALL SELECT 2 UNION ALL SELECT 3) n
JOIN tm_training_types t ON t.training_type_id = n.seq
WHERE e.employee_id IN ('EMP-HSE-001','EMP-HSE-002','EMP-HSE-003','EMP-PROD-001','EMP-PROD-002','EMP-PROD-003','EMP-ENG-001','EMP-ENG-002','EMP-ADMIN-001','EMP-QC-001');

SELECT COUNT(*) AS tna_record_count FROM tm_training_need_assessment WHERE deleted_at IS NULL;
