-- ==================================================
-- TABLE NAME
--   near_miss_corrective_actions
--
-- Purpose
--   Tracks multiple independent corrective or preventive actions for each near
--   miss. Completing one action never closes the parent near miss.
--
-- Relationships
--   near_misses, employees, corrective-action statuses, users, and evidence.
--
-- Indexes
--   Near miss/status, assignee/target date, overdue work, verification queue.
--
-- Workflow
--   Open -> In Progress -> Completed -> Verified. Each action closes independently.
--
-- Author
--   CBL HSE Database Architecture
--
-- Version
--   1.0.0 | Phase 4 | MySQL 8
-- ==================================================

USE cbl_hse;

CREATE TABLE IF NOT EXISTS near_miss_corrective_actions (
    action_id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    near_miss_id          BIGINT UNSIGNED NOT NULL,
    action_description    TEXT NOT NULL,
    assigned_to            CHAR(36) NOT NULL COMMENT 'FK -> employees.employee_id.',
    priority              ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'medium',
    target_date           DATE NOT NULL,
    completion_date       DATE NULL,
    completion_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    remarks               TEXT NULL,
    status_id             BIGINT UNSIGNED NOT NULL DEFAULT 24 COMMENT 'FK -> statuses.status_id; corrective_actions module.',
    verification_required BOOLEAN NOT NULL DEFAULT TRUE,
    verified_by           CHAR(36) NULL COMMENT 'FK -> employees.employee_id.',
    verified_at           DATETIME(3) NULL,
    evidence              TEXT NULL COMMENT 'Cloud path, attachment references, or evidence summary.',
    created_by            BIGINT UNSIGNED NOT NULL,
    updated_by            BIGINT UNSIGNED NOT NULL,
    created_at            DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at            DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at            DATETIME(3) NULL,

    PRIMARY KEY (action_id),
    CONSTRAINT chk_nm_action_completion CHECK (completion_percentage BETWEEN 0.00 AND 100.00),
    CONSTRAINT chk_nm_action_dates CHECK (completion_date IS NULL OR completion_date >= created_at),
    CONSTRAINT chk_nm_action_verification CHECK (
        (verification_required = FALSE)
        OR (status_id <> 27 OR verified_by IS NOT NULL)
    ),
    CONSTRAINT fk_nm_action_near_miss FOREIGN KEY (near_miss_id) REFERENCES near_misses (near_miss_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_nm_action_assignee FOREIGN KEY (assigned_to) REFERENCES employees (employee_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_nm_action_verifier FOREIGN KEY (verified_by) REFERENCES employees (employee_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_nm_action_status FOREIGN KEY (status_id) REFERENCES statuses (status_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_nm_action_created_by FOREIGN KEY (created_by) REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_nm_action_updated_by FOREIGN KEY (updated_by) REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_nm_action_case_status (near_miss_id, status_id),
    INDEX idx_nm_action_assignee_target (assigned_to, target_date),
    INDEX idx_nm_action_status_target (status_id, target_date),
    INDEX idx_nm_action_verification (verification_required, verified_by),
    INDEX idx_nm_action_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Independent corrective and preventive actions for near misses.';

INSERT INTO near_miss_corrective_actions
    (near_miss_id, action_description, assigned_to, priority, target_date, completion_date, completion_percentage,
     remarks, status_id, verification_required, verified_by, verified_at, evidence, created_by, updated_by)
VALUES
    (1, 'Repaint the pedestrian crossing and install a fixed barrier at the bagging line.', 'EMP-PROD-001', 'high', '2026-08-05', NULL, 60.00, 'Barrier quotation approved; installation scheduled.', 25, TRUE, NULL, NULL, 'hse/near-misses/NM-2026-0001/actions/barrier-quotation.pdf', 2, 2),
    (1, 'Add pedestrian-route verification to every shift handover checklist.', 'EMP-PROD-002', 'medium', '2026-08-03', '2026-08-02', 100.00, 'Checklist revision issued to all production shifts.', 27, TRUE, 'EMP-HSE-002', '2026-08-03 10:00:00.000', 'hse/near-misses/NM-2026-0001/actions/shift-checklist-v2.xlsx', 2, 2),
    (3, 'Provide a spill kit at each workshop work cell and replace the damaged oil container.', 'EMP-ENG-001', 'high', '2026-08-06', NULL, 25.00, 'Spill kits received; container replacement pending.', 25, TRUE, NULL, NULL, 'hse/near-misses/NM-2026-0003/actions/spill-kit-receipt.pdf', 3, 3);

SELECT action_id, near_miss_id, assigned_to, priority, completion_percentage, status_id, verified_by
FROM near_miss_corrective_actions WHERE deleted_at IS NULL ORDER BY near_miss_id, action_id;
