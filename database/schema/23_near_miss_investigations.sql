-- ==================================================
-- TABLE NAME
--   near_miss_investigations
--
-- Purpose
--   Records formal investigation work for near misses requiring deeper review.
--
-- Relationships
--   near_misses, employees as investigators, statuses, and users.
--
-- Indexes
--   Near miss/date, investigator/date, status, and soft-delete indexes.
--
-- Workflow
--   Investigation is opened after Submitted and progresses through the
--   near_misses status family until the case is closed.
--
-- Author
--   CBL HSE Database Architecture
--
-- Version
--   1.0.0 | Phase 4 | MySQL 8
-- ==================================================

USE cbl_hse;

CREATE TABLE IF NOT EXISTS near_miss_investigations (
    investigation_id       BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    near_miss_id           BIGINT UNSIGNED NOT NULL,
    investigator_id        CHAR(36) NOT NULL COMMENT 'FK -> employees.employee_id.',
    investigation_date     DATE NOT NULL,
    investigation_summary  TEXT NOT NULL,
    contributing_factors   TEXT NULL,
    immediate_causes       TEXT NOT NULL,
    root_cause             TEXT NULL,
    recommendations        TEXT NULL,
    review_notes           TEXT NULL,
    status_id              BIGINT UNSIGNED NOT NULL DEFAULT 15 COMMENT 'FK -> statuses.status_id.',
    created_by             BIGINT UNSIGNED NOT NULL,
    updated_by             BIGINT UNSIGNED NOT NULL,
    created_at             DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at             DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at             DATETIME(3) NULL,

    PRIMARY KEY (investigation_id),
    CONSTRAINT fk_nm_investigation_near_miss FOREIGN KEY (near_miss_id) REFERENCES near_misses (near_miss_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_nm_investigation_investigator FOREIGN KEY (investigator_id) REFERENCES employees (employee_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_nm_investigation_status FOREIGN KEY (status_id) REFERENCES statuses (status_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_nm_investigation_created_by FOREIGN KEY (created_by) REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_nm_investigation_updated_by FOREIGN KEY (updated_by) REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_nm_investigation_case_date (near_miss_id, investigation_date),
    INDEX idx_nm_investigation_investigator (investigator_id, investigation_date),
    INDEX idx_nm_investigation_status (status_id),
    INDEX idx_nm_investigation_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Formal investigations linked to near misses requiring investigation.';

INSERT INTO near_miss_investigations
    (near_miss_id, investigator_id, investigation_date, investigation_summary, contributing_factors,
     immediate_causes, root_cause, recommendations, review_notes, status_id, created_by, updated_by)
VALUES
    (1, 'EMP-HSE-002', '2026-07-29', 'Reviewed pedestrian and pallet-jack movements during the day shift and interviewed the operator and supervisor.', 'Faded crossing markings, mixed traffic, and production pressure during dispatch.', 'Pallet jack entered the pedestrian route while the crossing was occupied.', 'Pedestrian and vehicle segregation controls were not maintained as a managed standard.', 'Repaint route markings, install a physical barrier, and include route checks in the shift handover.', 'Evidence supports a systemic control gap; RCA version 1 opened.', 15, 2, 2),
    (3, 'EMP-HSE-003', '2026-08-02', 'Reviewed the workshop floor, oil handling practice, and contractor housekeeping briefing.', 'Oil container seal was degraded and the night-shift inspection was not documented.', 'Oil film was present beside the lathe in a walking path.', 'Housekeeping inspection and spill-control ownership were not clearly assigned to the contractor supervisor.', 'Introduce signed night-shift inspections and require spill kits at each workshop work cell.', 'Contractor supervisor accepted the recommendations.', 16, 3, 3),
    (3, 'EMP-HSE-002', '2026-08-03', 'Follow-up verification confirmed that the spill-control station and inspection checklist were implemented.', 'The revised checklist now assigns accountability by work cell.', 'No repeat oil contamination observed during the verification walk.', 'Control effectiveness improved after ownership and inspection frequency were defined.', 'Retain the control in the contractor HSE plan and audit monthly.', 'Ready for HSE closure review.', 16, 2, 2);

SELECT investigation_id, near_miss_id, investigator_id, investigation_date, status_id
FROM near_miss_investigations WHERE deleted_at IS NULL ORDER BY investigation_date, investigation_id;
