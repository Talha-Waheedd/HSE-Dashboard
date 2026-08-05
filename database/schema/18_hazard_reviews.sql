-- =============================================================================
-- 18_hazard_reviews.sql
-- CBL HSE Management System — Phase 3: Hazard Management Module
-- Table: hazard_reviews
--
-- Purpose:
--   Implements the HSE Approval Workflow for hazard closure.
--   When a responsible person marks all corrective actions as complete,
--   the hazard moves to 'Pending Review'.
--   The HSE Administrator/Reviewer must formally approve or reject the closure.
--
--   Workflow Decisions:
--     - Approved → Hazard moves to 'Closed'
--     - Rejected → Hazard moves to 'Rejected', corrective actions reopened
--     - Reopened → Hazard moved from 'Closed' back to active status (re-occurrence)
--
-- Relationships:
--   hazards   (1) → hazard_reviews (many) - a hazard can be rejected/reviewed multiple times
--   employees (1) → hazard_reviews.reviewer
--   users     (1) → hazard_reviews.created_by
--
-- Depends on: 15_hazards.sql, 04_employees.sql
-- Run: SOURCE database/schema/18_hazard_reviews.sql;
-- =============================================================================

USE cbl_hse;

-- -----------------------------------------------------------------------------
-- Table Definition
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS hazard_reviews (

    -- ── Identity ──────────────────────────────────────────────────────────────
    review_id           BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT          COMMENT 'Surrogate PK.',

    -- ── Relationship ──────────────────────────────────────────────────────────
    hazard_id           BIGINT UNSIGNED     NOT NULL                         COMMENT 'FK → hazards.hazard_id — hazard being reviewed.',

    -- ── Review Details ────────────────────────────────────────────────────────
    reviewer            CHAR(36)            NOT NULL                         COMMENT 'FK → employees.employee_id — HSE person conducting the review.',
    approval_level      ENUM(
                            'dept_manager',     -- First line review (optional)
                            'hse_officer',      -- Standard review
                            'hse_admin',        -- Final approval for high-risk
                            'plant_manager'     -- Extreme risk approval
                        )                   NOT NULL DEFAULT 'hse_officer'   COMMENT 'Tier of approval/review taking place.',

    decision            ENUM(
                            'approved',         -- Corrective actions verified, hazard can close
                            'rejected',         -- Evidence insufficient, rework required
                            'reopened'          -- Hazard was previously closed but occurred again
                        )                   NOT NULL                         COMMENT 'The outcome of the review.',

    reason              VARCHAR(500)        NULL                             COMMENT 'Short reason, especially mandatory for rejection/reopening.',
    comments            TEXT                NULL                             COMMENT 'Detailed review comments and observations.',

    -- ── Timeline ──────────────────────────────────────────────────────────────
    review_date         DATETIME(3)         NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'Exact timestamp of the review decision.',

    -- ── Audit Fields ──────────────────────────────────────────────────────────
    created_by          BIGINT UNSIGNED     NOT NULL                         COMMENT 'FK → users.user_id',
    created_at          DATETIME(3)         NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at          DATETIME(3)         NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at          DATETIME(3)         NULL                             COMMENT 'Soft-delete. Usually never deleted to preserve approval audit.',

    -- ── Constraints ───────────────────────────────────────────────────────────
    PRIMARY KEY (review_id),

    -- ── Foreign Keys ──────────────────────────────────────────────────────────
    CONSTRAINT fk_hrev_hazard
        FOREIGN KEY (hazard_id)     REFERENCES hazards (hazard_id)
        ON UPDATE CASCADE ON DELETE CASCADE,

    CONSTRAINT fk_hrev_reviewer
        FOREIGN KEY (reviewer)      REFERENCES employees (employee_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,

    CONSTRAINT fk_hrev_created_by
        FOREIGN KEY (created_by)    REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,

    -- ── Indexes ───────────────────────────────────────────────────────────────
    INDEX idx_hrev_hazard_id        (hazard_id),
    INDEX idx_hrev_reviewer         (reviewer),
    INDEX idx_hrev_decision         (decision),
    INDEX idx_hrev_review_date      (review_date),
    INDEX idx_hrev_deleted_at       (deleted_at)

) ENGINE=InnoDB
  AUTO_INCREMENT=1
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Audit log of formal hazard reviews, approvals, and rejections.';


-- =============================================================================
-- Seed Data
-- =============================================================================

-- Assuming HAZ-2026-SKR-00003 (hazard_id = 3) had an initial review that was rejected,
-- and then a subsequent review that was approved (though it's currently pending in our seed,
-- let's simulate a history for hazard_id = 1 which might have been rejected once).

INSERT INTO hazard_reviews (
    hazard_id,  reviewer,       approval_level, decision,
    reason,                                                         comments,
    created_by
) VALUES
-- Simulate a rejection for hazard 1 before it got back to 'Submitted/Assigned'
(1,  'EMP-HSE-001', 'hse_officer',  'rejected',
 'Corrective action plan insufficient.',                            'Please add a preventive action to inspect the whole area, not just fix the two wires.',
 1),

-- Simulate an approval for hazard 3 (even though status is pending, we'll log an approval to show structure)
(3,  'EMP-HSE-001', 'hse_admin',    'approved',
 'Actions verified.',                                               'Extinguishers replaced and log updated. Closing hazard.',
 1);


-- =============================================================================
-- Verification
-- =============================================================================

SELECT
    hr.review_id,
    h.hazard_number,
    hr.decision,
    hr.approval_level,
    e.first_name AS reviewer_name,
    hr.review_date,
    hr.reason
FROM hazard_reviews hr
JOIN hazards h ON hr.hazard_id = h.hazard_id
JOIN employees e ON hr.reviewer = e.employee_id
ORDER BY hr.review_date DESC;
