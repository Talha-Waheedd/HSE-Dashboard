-- ==================================================
-- TABLE NAME
--   incident_reviews
--
-- Purpose
--   Enterprise approval workflow for incident reports, investigations, RCA,
--   corrective actions, and permanent closure decisions.
--
-- Relationships
--   incidents, employees as reviewers, and users as audit owners.
--
-- Indexes
--   Incident/date, workflow queue, reviewer/date, decision, and deletion.
--
-- Workflow
--   Draft -> Submitted -> Pending Investigation -> Pending HSE Review ->
--   Pending Plant Manager Review -> Approved -> Closed; Rejected/Reopened loop.
--
-- Author
--   CBL HSE Database Architecture
--
-- Version
--   1.0.0 | Phase 5 | MySQL 8
-- ==================================================

USE cbl_hse;

CREATE TABLE IF NOT EXISTS incident_reviews (
    review_id                    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    incident_id                 BIGINT UNSIGNED NOT NULL,
    workflow_status             ENUM('draft', 'submitted', 'pending_investigation', 'pending_hse_review', 'pending_plant_manager_review', 'approved', 'rejected', 'reopened', 'closed') NOT NULL,
    reviewer_id                 CHAR(36) NOT NULL,
    decision                    ENUM('pending', 'approve', 'reject', 'reopen', 'close') NOT NULL DEFAULT 'pending',
    reason                      VARCHAR(1000) NULL,
    comments                    TEXT NULL,
    review_date                 DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    digital_signature_placeholder VARCHAR(255) NULL,
    created_by                  BIGINT UNSIGNED NOT NULL,
    updated_by                  BIGINT UNSIGNED NOT NULL,
    created_at                  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at                  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at                  DATETIME(3) NULL,

    PRIMARY KEY (review_id),
    CONSTRAINT chk_incident_review_reason CHECK (workflow_status NOT IN ('rejected', 'reopened') OR reason IS NOT NULL),
    CONSTRAINT fk_incident_review_incident FOREIGN KEY (incident_id) REFERENCES incidents (incident_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_incident_review_reviewer FOREIGN KEY (reviewer_id) REFERENCES employees (employee_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_incident_review_created_by FOREIGN KEY (created_by) REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_incident_review_updated_by FOREIGN KEY (updated_by) REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_incident_review_case_date (incident_id, review_date),
    INDEX idx_incident_review_workflow_queue (workflow_status, review_date),
    INDEX idx_incident_review_reviewer_date (reviewer_id, review_date),
    INDEX idx_incident_review_decision (decision, review_date),
    INDEX idx_incident_review_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Incident HSE, plant manager, approval, rejection, reopening, and closure reviews.';

INSERT INTO incident_reviews
    (incident_id, workflow_status, reviewer_id, decision, reason, comments, review_date, digital_signature_placeholder, created_by, updated_by)
VALUES
    (1, 'approved', 'EMP-HSE-001', 'approve', NULL, 'First aid case reviewed and corrective action verified.', '2026-07-18 11:00:00.000', 'SIG-INC000001-HSE-APPROVAL', 1, 1),
    (2, 'pending_plant_manager_review', 'EMP-PROD-001', 'pending', NULL, 'Investigation accepted; awaiting plant manager decision.', '2026-07-25 15:30:00.000', 'PENDING-SIGNATURE-INC000002', 2, 2),
    (3, 'approved', 'EMP-HSE-001', 'approve', NULL, 'Fire controls and evidence accepted.', '2026-07-29 14:00:00.000', 'SIG-INC000003-HSE-APPROVAL', 1, 1),
    (4, 'rejected', 'EMP-HSE-001', 'reject', 'Contractor traffic controls were incomplete.', 'Return to investigation team for additional evidence.', '2026-08-01 10:00:00.000', 'PENDING-SIGNATURE-INC000004', 1, 1),
    (5, 'submitted', 'EMP-HSE-002', 'pending', NULL, 'Incident submitted for investigation assignment.', '2026-08-03 09:00:00.000', NULL, 2, 2);

SELECT review_id, incident_id, workflow_status, decision, reviewer_id, review_date
FROM incident_reviews WHERE deleted_at IS NULL ORDER BY incident_id, review_date;
