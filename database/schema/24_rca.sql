-- ==================================================
-- TABLE NAME
--   near_miss_rca
--
-- Purpose
--   Stores structured Root Cause Analysis only for near misses marked for
--   further investigation. Supports 5 Why, Fishbone, Fault Tree, and custom.
--
-- Relationships
--   near_misses, investigations, employees approving, and users auditing.
--
-- Indexes
--   Near miss/version, method/approval, approval date, and soft-delete indexes.
--
-- Workflow
--   Draft -> Pending Approval -> Approved or Rejected. Revisions use version_no.
--
-- Author
--   CBL HSE Database Architecture
--
-- Version
--   1.0.0 | Phase 4 | MySQL 8
-- ==================================================

USE cbl_hse;

CREATE TABLE IF NOT EXISTS near_miss_rca (
    rca_id                    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    near_miss_id              BIGINT UNSIGNED NOT NULL,
    investigation_id          BIGINT UNSIGNED NOT NULL,
    version_no                SMALLINT UNSIGNED NOT NULL DEFAULT 1,
    method                    ENUM('five_why', 'fishbone', 'fault_tree', 'custom') NOT NULL,
    problem_statement         TEXT NOT NULL,
    cause_level_1             TEXT NOT NULL,
    cause_level_2             TEXT NULL,
    cause_level_3             TEXT NULL,
    cause_level_4             TEXT NULL,
    cause_level_5             TEXT NULL,
    final_root_cause          TEXT NOT NULL,
    corrective_recommendation TEXT NOT NULL,
    preventive_recommendation TEXT NOT NULL,
    approval_status           ENUM('draft', 'pending_approval', 'approved', 'rejected') NOT NULL DEFAULT 'draft',
    approved_by               CHAR(36) NULL COMMENT 'FK -> employees.employee_id.',
    approved_date             DATETIME(3) NULL,
    comments                  TEXT NULL,
    created_by                BIGINT UNSIGNED NOT NULL,
    updated_by                BIGINT UNSIGNED NOT NULL,
    created_at                DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at                DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at                DATETIME(3) NULL,

    PRIMARY KEY (rca_id),
    UNIQUE KEY uq_nm_rca_version (near_miss_id, version_no),
    CONSTRAINT chk_nm_rca_version CHECK (version_no > 0),
    CONSTRAINT chk_nm_rca_approval CHECK (
        (approval_status IN ('draft', 'pending_approval') AND approved_by IS NULL AND approved_date IS NULL)
        OR (approval_status IN ('approved', 'rejected') AND approved_by IS NOT NULL AND approved_date IS NOT NULL)
    ),
    CONSTRAINT fk_nm_rca_near_miss FOREIGN KEY (near_miss_id) REFERENCES near_misses (near_miss_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_nm_rca_investigation FOREIGN KEY (investigation_id) REFERENCES near_miss_investigations (investigation_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_nm_rca_approver FOREIGN KEY (approved_by) REFERENCES employees (employee_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_nm_rca_created_by FOREIGN KEY (created_by) REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_nm_rca_updated_by FOREIGN KEY (updated_by) REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_nm_rca_method_status (method, approval_status),
    INDEX idx_nm_rca_approval_date (approved_date),
    INDEX idx_nm_rca_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Versioned root cause analysis for investigated near misses.';

INSERT INTO near_miss_rca
    (near_miss_id, investigation_id, version_no, method, problem_statement, cause_level_1, cause_level_2,
     cause_level_3, cause_level_4, cause_level_5, final_root_cause, corrective_recommendation,
     preventive_recommendation, approval_status, approved_by, approved_date, comments, created_by, updated_by)
VALUES
    (1, 1, 1, 'five_why', 'A pallet jack entered an occupied pedestrian crossing.', 'Vehicle route was not separated from pedestrians.', 'Crossing markings were faded and no physical barrier existed.', 'The route inspection did not identify degraded controls.', 'Shift handover did not include traffic-route verification.', 'Traffic management ownership was not defined in the area standard.', 'The pedestrian and vehicle segregation standard lacked an accountable inspection owner.', 'Repaint the crossing and install a barrier at the bagging line.', 'Add traffic-route verification to every shift handover and monthly HSE audit.', 'pending_approval', NULL, NULL, 'Awaiting HSE Manager approval.', 2, 2),
    (1, 1, 2, 'fishbone', 'The same pedestrian crossing remained vulnerable after the first review.', 'Methods: no documented crossing inspection frequency.', 'People: operators were not briefed after line layout changes.', 'Machine: pallet jack warning beacon was not visible around the bend.', 'Environment: dispatch congestion narrowed the route.', 'Management: change-management review did not include traffic segregation.', 'Change management did not require a documented traffic-control review.', 'Add change-management sign-off and improve warning beacon visibility.', 'Include traffic segregation in layout-change risk assessments.', 'rejected', 'EMP-HSE-001', '2026-08-01 11:00:00.000', 'Returned for stronger management-system controls.', 2, 2),
    (3, 2, 1, 'custom', 'A contractor nearly slipped on oil beside the workshop lathe.', 'Oil reached the walking path.', 'The container seal was degraded.', 'Spill checks were informal on the night shift.', 'The contractor supervisor had no signed checklist.', 'Contractor housekeeping accountability was not embedded in the HSE plan.', 'Contractor housekeeping controls were not formally assigned and verified.', 'Replace containers and provide a spill kit at each work cell.', 'Add signed contractor housekeeping inspections to the monthly HSE audit.', 'approved', 'EMP-HSE-001', '2026-08-04 10:30:00.000', 'Approved for corrective-action tracking.', 3, 2);

SELECT rca_id, near_miss_id, version_no, method, approval_status, approved_date
FROM near_miss_rca WHERE deleted_at IS NULL ORDER BY near_miss_id, version_no;
