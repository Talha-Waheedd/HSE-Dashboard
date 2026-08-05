-- ==================================================
-- TABLE NAME
--   compliance_reviews
--
-- Purpose
--   Periodic review record for each legal, regulatory, ISO, GMP, and HACCP
--   requirement, including observations and next review commitments.
--
-- Relationships
--   compliance_requirements, employees as reviewers, and users.
--
-- Indexes
--   Requirement/date, reviewer/date, result/next review, and deletion.
--
-- Workflow
--   Scheduled -> Reviewed -> Action Required or Compliant.
--
-- Author
--   CBL HSE Database Architecture
--
-- Version
--   1.0.0 | Phase 7 | MySQL 8
-- ==================================================

USE cbl_hse;

CREATE TABLE IF NOT EXISTS compliance_reviews (
    compliance_review_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    requirement_id       BIGINT UNSIGNED NOT NULL,
    reviewer_id          CHAR(36) NOT NULL,
    review_date          DATE NOT NULL,
    result               ENUM('compliant', 'partially_compliant', 'non_compliant', 'not_applicable') NOT NULL,
    observations         TEXT NOT NULL,
    next_review_date     DATE NOT NULL,
    remarks              TEXT NULL,
    created_by           BIGINT UNSIGNED NOT NULL,
    updated_by           BIGINT UNSIGNED NOT NULL,
    created_at           DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at           DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at           DATETIME(3) NULL,
    PRIMARY KEY (compliance_review_id),
    CONSTRAINT chk_compliance_review_dates CHECK (next_review_date > review_date),
    CONSTRAINT fk_compliance_review_requirement FOREIGN KEY (requirement_id) REFERENCES compliance_requirements (requirement_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_compliance_review_reviewer FOREIGN KEY (reviewer_id) REFERENCES employees (employee_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_compliance_review_created_by FOREIGN KEY (created_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_compliance_review_updated_by FOREIGN KEY (updated_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_compliance_review_requirement_date (requirement_id, review_date),
    INDEX idx_compliance_review_reviewer_date (reviewer_id, review_date),
    INDEX idx_compliance_review_result_next (result, next_review_date),
    INDEX idx_compliance_review_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Evidence-based periodic compliance requirement reviews.';

INSERT INTO compliance_reviews
    (requirement_id, reviewer_id, review_date, result, observations, next_review_date, remarks, created_by, updated_by)
VALUES
    (1, 'EMP-HSE-001', '2026-06-30', 'partially_compliant', 'LOTO procedure exists, but field verification records were inconsistent.', '2026-09-30', 'Link to electrical audit and training action.', 1, 1),
    (2, 'EMP-HSE-002', '2026-06-15', 'compliant', 'Operational controls, hazard registers, and incident learning records were available.', '2027-06-15', 'Continue quarterly monitoring.', 2, 2),
    (3, 'EMP-HSE-002', '2026-06-20', 'partially_compliant', 'Environmental register current; one waste contractor license renewal is pending.', '2026-09-15', 'Renewal evidence required before next review.', 2, 2),
    (4, 'EMP-PROD-001', '2026-08-01', 'compliant', 'HACCP monitoring records and CCP verification were complete for the sample period.', '2026-09-01', NULL, 4, 4),
    (5, 'EMP-HSE-001', '2026-07-15', 'partially_compliant', 'Competency matrix is available, but two technical skill gaps remain open.', '2027-01-15', 'TNA records raised for affected employees.', 1, 1);

SELECT compliance_review_id, requirement_id, reviewer_id, review_date, result, next_review_date
FROM compliance_reviews WHERE deleted_at IS NULL ORDER BY next_review_date;
