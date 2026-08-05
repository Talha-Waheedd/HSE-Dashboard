-- ==================================================
-- TABLE NAME
--   near_miss_reviews
--
-- Purpose
--   HSE approval and quality review workflow for submitted investigations,
--   root-cause analyses, and corrective-action evidence.
--
-- Relationships
--   near_misses, employees as reviewers, and users auditing the review.
--
-- Indexes
--   Near miss/date, workflow status/date, reviewer/date, proof status.
--
-- Workflow
--   Submitted -> Pending Review -> Approved. Rejected cases may be Reopened.
--   Proof verification is recorded independently from the workflow decision.
--
-- Author
--   CBL HSE Database Architecture
--
-- Version
--   1.0.0 | Phase 4 | MySQL 8
-- ==================================================

USE cbl_hse;

CREATE TABLE IF NOT EXISTS near_miss_reviews (
    review_id                    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    near_miss_id                 BIGINT UNSIGNED NOT NULL,
    workflow_status              ENUM('submitted', 'pending_review', 'approved', 'rejected', 'reopened') NOT NULL,
    reviewer_id                  CHAR(36) NOT NULL COMMENT 'FK -> employees.employee_id.',
    comments                     TEXT NULL,
    reason                       VARCHAR(1000) NULL,
    review_date                  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    proof_verification_status    ENUM('pending', 'verified', 'rejected') NOT NULL DEFAULT 'pending',
    proof_verification_notes     TEXT NULL,
    digital_signature_placeholder VARCHAR(255) NULL COMMENT 'Placeholder for future certificate/signature service reference.',
    created_by                   BIGINT UNSIGNED NOT NULL,
    updated_by                   BIGINT UNSIGNED NOT NULL,
    created_at                   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at                   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at                   DATETIME(3) NULL,

    PRIMARY KEY (review_id),
    CONSTRAINT chk_nm_review_reason CHECK (
        workflow_status NOT IN ('rejected', 'reopened') OR reason IS NOT NULL
    ),
    CONSTRAINT fk_nm_review_near_miss FOREIGN KEY (near_miss_id) REFERENCES near_misses (near_miss_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_nm_review_reviewer FOREIGN KEY (reviewer_id) REFERENCES employees (employee_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_nm_review_created_by FOREIGN KEY (created_by) REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_nm_review_updated_by FOREIGN KEY (updated_by) REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_nm_review_case_date (near_miss_id, review_date),
    INDEX idx_nm_review_status_date (workflow_status, review_date),
    INDEX idx_nm_review_reviewer_date (reviewer_id, review_date),
    INDEX idx_nm_review_proof_status (proof_verification_status),
    INDEX idx_nm_review_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='HSE near miss review, approval, rejection, and proof-verification workflow.';

INSERT INTO near_miss_reviews
    (near_miss_id, workflow_status, reviewer_id, comments, reason, review_date, proof_verification_status,
     proof_verification_notes, digital_signature_placeholder, created_by, updated_by)
VALUES
    (1, 'pending_review', 'EMP-HSE-001', 'Investigation and first RCA version received for management review.', NULL, '2026-07-30 10:00:00.000', 'verified', 'Interview notes and before/after photographs verified.', 'PENDING-SIGNATURE-NM0001-REV01', 1, 1),
    (2, 'approved', 'EMP-HSE-002', 'Evidence and corrective action recommendation accepted; monitor through routine maintenance.', NULL, '2026-08-01 15:00:00.000', 'verified', 'Electrical-room photograph and maintenance entry verified.', 'SIG-PLACEHOLDER-NM0002-REV01', 2, 2),
    (3, 'reopened', 'EMP-HSE-001', 'Reopened because contractor housekeeping evidence was incomplete at first review.', 'Night-shift inspection sheet was not attached to the case.', '2026-08-04 11:00:00.000', 'rejected', 'Required inspection evidence missing.', 'PENDING-SIGNATURE-NM0003-REV02', 1, 1);

SELECT review_id, near_miss_id, workflow_status, reviewer_id, proof_verification_status, review_date
FROM near_miss_reviews WHERE deleted_at IS NULL ORDER BY near_miss_id, review_date;
