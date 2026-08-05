-- =============================================================================
-- 19_hazard_status_history.sql
-- CBL HSE Management System — Phase 3: Hazard Management Module
-- Table: hazard_status_history
--
-- Purpose:
--   Tracks EVERY status transition for a hazard record.
--   Provides a complete, immutable audit trail of the hazard's lifecycle.
--   Crucial for calculating SLA metrics (e.g., time spent in 'In Progress').
--
--   Never overwrite history. Only append new records on status change.
--
-- Relationships:
--   hazards  (1) → hazard_status_history (many)
--   statuses (1) → hazard_status_history.old_status (optional, NULL if Draft creation)
--   statuses (1) → hazard_status_history.new_status
--   users    (1) → hazard_status_history.changed_by
--
-- Depends on: 15_hazards.sql, 13_statuses.sql, 09_users.sql
-- Run: SOURCE database/schema/19_hazard_status_history.sql;
-- =============================================================================

USE cbl_hse;

-- -----------------------------------------------------------------------------
-- Table Definition
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS hazard_status_history (

    -- ── Identity ──────────────────────────────────────────────────────────────
    history_id          BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT          COMMENT 'Surrogate PK.',

    -- ── Relationship ──────────────────────────────────────────────────────────
    hazard_id           BIGINT UNSIGNED     NOT NULL                         COMMENT 'FK → hazards.hazard_id.',

    -- ── Transition ────────────────────────────────────────────────────────────
    old_status          BIGINT UNSIGNED     NULL                             COMMENT 'FK → statuses.status_id. The status before the change. NULL if this is the initial creation (Draft).',
    new_status          BIGINT UNSIGNED     NOT NULL                         COMMENT 'FK → statuses.status_id. The status after the change.',

    -- ── Audit Details ─────────────────────────────────────────────────────────
    changed_by          BIGINT UNSIGNED     NOT NULL                         COMMENT 'FK → users.user_id — person who triggered the status change.',
    changed_on          DATETIME(3)         NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'Exact timestamp of the transition.',
    reason              VARCHAR(500)        NULL                             COMMENT 'Optional reason for the change, required for certain transitions (like Reject).',
    comments            TEXT                NULL                             COMMENT 'Detailed comments attached to the transition.',

    -- ── Constraints ───────────────────────────────────────────────────────────
    PRIMARY KEY (history_id),

    -- ── Foreign Keys ──────────────────────────────────────────────────────────
    CONSTRAINT fk_hhist_hazard
        FOREIGN KEY (hazard_id)     REFERENCES hazards (hazard_id)
        ON UPDATE CASCADE ON DELETE CASCADE,

    CONSTRAINT fk_hhist_old_status
        FOREIGN KEY (old_status)    REFERENCES statuses (status_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,

    CONSTRAINT fk_hhist_new_status
        FOREIGN KEY (new_status)    REFERENCES statuses (status_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,

    CONSTRAINT fk_hhist_changed_by
        FOREIGN KEY (changed_by)    REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,

    -- ── Indexes ───────────────────────────────────────────────────────────────
    INDEX idx_hhist_hazard_id       (hazard_id),
    INDEX idx_hhist_new_status      (new_status),
    INDEX idx_hhist_changed_on      (changed_on)

) ENGINE=InnoDB
  AUTO_INCREMENT=1
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Immutable audit trail of all hazard status transitions.';


-- =============================================================================
-- Seed Data
-- =============================================================================

-- We will simulate the history for HAZ-2026-SKR-00001 (hazard_id = 1)
-- Draft (1) -> Submitted (2)

INSERT INTO hazard_status_history (
    hazard_id,  old_status, new_status, changed_by, changed_on, reason
) VALUES
(1, NULL, 1, 2, '2026-07-28 09:30:00', 'Initial report created.'),
(1, 1,    2, 2, '2026-07-28 09:35:00', 'Submitted for review.');

-- Simulate history for HAZ-2026-SKR-00002 (hazard_id = 2)
-- Draft(1) -> Submitted(2) -> Assigned(3) -> In Progress(4)
INSERT INTO hazard_status_history (
    hazard_id,  old_status, new_status, changed_by, changed_on, reason
) VALUES
(2, NULL, 1, 2, '2026-07-30 14:15:00', 'Initial report created.'),
(2, 1,    2, 2, '2026-07-30 14:20:00', 'Submitted for review.'),
(2, 2,    3, 1, '2026-07-31 09:00:00', 'Assigned to EMP-PROD-001.'),
(2, 3,    4, 2, '2026-07-31 10:00:00', 'Started corrective action work.');


-- =============================================================================
-- Verification
-- =============================================================================

SELECT
    hsh.history_id,
    h.hazard_number,
    s_old.status_name AS old_status,
    s_new.status_name AS new_status,
    u.username AS changed_by,
    hsh.changed_on,
    hsh.reason
FROM hazard_status_history hsh
JOIN hazards h ON hsh.hazard_id = h.hazard_id
LEFT JOIN statuses s_old ON hsh.old_status = s_old.status_id
JOIN statuses s_new ON hsh.new_status = s_new.status_id
JOIN users u ON hsh.changed_by = u.user_id
ORDER BY h.hazard_id, hsh.changed_on;
