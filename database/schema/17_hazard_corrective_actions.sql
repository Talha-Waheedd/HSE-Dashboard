-- =============================================================================
-- 17_hazard_corrective_actions.sql
-- CBL HSE Management System — Phase 3: Hazard Management Module
-- Table: hazard_corrective_actions
--
-- Purpose:
--   One hazard can have MULTIPLE corrective actions (unlimited).
--   Each action is assigned to a specific person and department, with its own
--   priority, target date, and completion tracking.
--   This decouples individual tasks from the parent hazard record, enabling
--   parallel progress tracking and granular accountability.
--
--   Workflow:
--     HSE creates action → Assigns to responsible person
--     → Person updates progress
--     → Person marks COMPLETED + uploads proof
--     → HSE VERIFIES → action CLOSED
--     → When ALL actions VERIFIED → parent hazard moves to PENDING REVIEW
--
-- Relationships:
--   hazards  (1)  → hazard_corrective_actions (many)
--   employees (1) → hazard_corrective_actions.assigned_to
--   employees (1) → hazard_corrective_actions.verified_by
--   users    (1)  → hazard_corrective_actions.created_by
--
-- Depends on: 15_hazards.sql, 04_employees.sql, 13_statuses.sql
-- Run: SOURCE database/schema/17_hazard_corrective_actions.sql;
-- =============================================================================

USE cbl_hse;

-- -----------------------------------------------------------------------------
-- Table Definition
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS hazard_corrective_actions (

    -- ── Identity ──────────────────────────────────────────────────────────────
    action_id               BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT      COMMENT 'Surrogate PK.',
    action_number           VARCHAR(40)         NOT NULL                     COMMENT 'Human-readable reference. Format: CA-{hazard_number}-{SEQ}. e.g. CA-HAZ-2026-SKR-00001-01.',

    -- ── Relationship ──────────────────────────────────────────────────────────
    hazard_id               BIGINT UNSIGNED     NOT NULL                     COMMENT 'FK → hazards.hazard_id — parent hazard this action corrects.',

    -- ── Action Details ────────────────────────────────────────────────────────
    action_description      TEXT                NOT NULL                     COMMENT 'Full description of the corrective action to be taken.',
    action_type             ENUM(
                                'corrective',       -- Fix the root cause
                                'preventive',       -- Prevent recurrence
                                'immediate',        -- Immediate containment action
                                'monitoring'        -- Ongoing monitoring action
                            )                   NOT NULL DEFAULT 'corrective' COMMENT 'Type of action — drives reporting and CAPA classification.',

    -- ── Assignment ────────────────────────────────────────────────────────────
    assigned_to             CHAR(36)            NOT NULL                     COMMENT 'FK → employees.employee_id — person responsible for completing this action.',
    assigned_department_id  CHAR(36)            NULL                         COMMENT 'FK → departments.department_id — department responsible for this action.',
    assigned_by             BIGINT UNSIGNED     NOT NULL                     COMMENT 'FK → users.user_id — HSE officer who assigned this action.',
    assigned_date           DATETIME(3)         NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'Timestamp when this action was assigned.',

    -- ── Priority & Timeline ───────────────────────────────────────────────────
    priority                ENUM('critical', 'high', 'medium', 'low')
                                                NOT NULL DEFAULT 'medium'    COMMENT 'Priority level of this specific action.',
    target_date             DATE                NOT NULL                     COMMENT 'Deadline for completing this corrective action.',
    completion_date         DATE                NULL                         COMMENT 'Actual date the responsible person marked this action complete.',
    verified_date           DATETIME(3)         NULL                         COMMENT 'Date HSE verified this action as effective.',

    -- ── Status ────────────────────────────────────────────────────────────────
    status_id               BIGINT UNSIGNED     NOT NULL                     COMMENT 'FK → statuses.status_id where module_name = ''corrective_actions''.',
    is_overdue              BOOLEAN             NOT NULL DEFAULT FALSE        COMMENT 'TRUE = target_date has passed without completion. Set by cron job.',

    -- ── Progress Tracking ─────────────────────────────────────────────────────
    progress_percent        TINYINT UNSIGNED    NOT NULL DEFAULT 0           COMMENT 'Completion percentage (0–100) updated by responsible person.',
    progress_notes          TEXT                NULL                         COMMENT 'Progress update notes from the responsible person.',
    completion_evidence     TEXT                NULL                         COMMENT 'Description of proof/evidence provided for completion (attachments in 16_hazard_attachments).',

    -- ── Verification ──────────────────────────────────────────────────────────
    verified_by             BIGINT UNSIGNED     NULL                         COMMENT 'FK → users.user_id — HSE officer who verified the completed action.',
    rejection_reason        TEXT                NULL                         COMMENT 'Reason if this corrective action completion was rejected by HSE.',

    -- ── Remarks ───────────────────────────────────────────────────────────────
    remarks                 TEXT                NULL                         COMMENT 'General remarks or notes about this corrective action.',

    -- ── Audit Fields ──────────────────────────────────────────────────────────
    created_by              BIGINT UNSIGNED     NOT NULL                     COMMENT 'FK → users.user_id — who created this action record.',
    updated_by              BIGINT UNSIGNED     NULL                         COMMENT 'FK → users.user_id — who last modified this action.',
    created_at              DATETIME(3)         NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at              DATETIME(3)         NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at              DATETIME(3)         NULL                         COMMENT 'Soft-delete.',

    -- ── Constraints ───────────────────────────────────────────────────────────
    PRIMARY KEY (action_id),
    UNIQUE KEY uq_hca_action_number (action_number),

    CONSTRAINT chk_hca_progress
        CHECK (progress_percent BETWEEN 0 AND 100)                          COMMENT 'Progress must be 0–100.',

    CONSTRAINT chk_hca_dates
        CHECK (completion_date IS NULL OR completion_date >= target_date - INTERVAL 30 DAY)
                                                                            COMMENT 'Completion date sanity check.',

    -- ── Foreign Keys ──────────────────────────────────────────────────────────
    CONSTRAINT fk_hca_hazard
        FOREIGN KEY (hazard_id)             REFERENCES hazards      (hazard_id)
        ON UPDATE CASCADE ON DELETE CASCADE,

    CONSTRAINT fk_hca_assigned_to
        FOREIGN KEY (assigned_to)           REFERENCES employees    (employee_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,

    CONSTRAINT fk_hca_assigned_dept
        FOREIGN KEY (assigned_department_id) REFERENCES departments (department_id)
        ON UPDATE CASCADE ON DELETE SET NULL,

    CONSTRAINT fk_hca_assigned_by
        FOREIGN KEY (assigned_by)           REFERENCES users        (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,

    CONSTRAINT fk_hca_status
        FOREIGN KEY (status_id)             REFERENCES statuses     (status_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,

    CONSTRAINT fk_hca_verified_by
        FOREIGN KEY (verified_by)           REFERENCES users        (user_id)
        ON UPDATE CASCADE ON DELETE SET NULL,

    CONSTRAINT fk_hca_created_by
        FOREIGN KEY (created_by)            REFERENCES users        (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,

    CONSTRAINT fk_hca_updated_by
        FOREIGN KEY (updated_by)            REFERENCES users        (user_id)
        ON UPDATE CASCADE ON DELETE SET NULL,

    -- ── Indexes ───────────────────────────────────────────────────────────────
    INDEX idx_hca_hazard_id         (hazard_id)                             COMMENT 'All actions for a hazard.',
    INDEX idx_hca_assigned_to       (assigned_to)                           COMMENT 'My assigned actions view.',
    INDEX idx_hca_status_id         (status_id),
    INDEX idx_hca_priority          (priority),
    INDEX idx_hca_target_date       (target_date),
    INDEX idx_hca_is_overdue        (is_overdue),
    INDEX idx_hca_deleted_at        (deleted_at),
    INDEX idx_hca_hazard_status     (hazard_id, status_id)                  COMMENT 'Count open actions per hazard for closure eligibility check.'

) ENGINE=InnoDB
  AUTO_INCREMENT=1
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Corrective actions for hazards. One hazard → many actions. Each action tracked independently to closure.';


-- =============================================================================
-- Seed Data — Sample corrective actions for seeded hazards
-- =============================================================================

INSERT INTO hazard_corrective_actions
    (action_number,                         hazard_id, action_description,
     action_type,   assigned_to,            assigned_department_id,   assigned_by,
     priority,      target_date,            status_id,  created_by)
VALUES
-- Actions for HAZ-2026-SKR-00001 (Exposed wire — hazard_id = 1)
('CA-HAZ-2026-SKR-00001-01',  1,  'Replace damaged cable insulation on the two exposed wires immediately. Use heat-shrink tubing and tape to the HSE standard.',
 'corrective',  'EMP-ENG-002',  'DEP-ENG-001',  2,  'critical',  '2026-08-02',  24,  2),

('CA-HAZ-2026-SKR-00001-02',  1,  'Conduct full electrical inspection of the Boiler Room entrance area and submit inspection report.',
 'preventive',  'EMP-ENG-001',  'DEP-ENG-001',  1,  'high',      '2026-08-07',  24,  1),

-- Actions for HAZ-2026-SKR-00002 (Oil spill — hazard_id = 2)
('CA-HAZ-2026-SKR-00002-01',  2,  'Repair gearbox oil seal on Packaging Machine #3. Submit maintenance job card as evidence.',
 'corrective',  'EMP-ENG-002',  'DEP-ENG-001',  2,  'high',      '2026-08-05',  24,  2),

('CA-HAZ-2026-SKR-00002-02',  2,  'Place permanent drip tray under Packaging Machine #3 gearbox. Verify installation with photo.',
 'preventive',  'EMP-ENG-001',  'DEP-ENG-001',  2,  'medium',    '2026-08-08',  24,  2),

-- Actions for HAZ-2026-SKR-00003 (Fire extinguisher — hazard_id = 3)
('CA-HAZ-2026-SKR-00003-01',  3,  'Replace fire extinguishers P-04, P-06, and P-08 with fully charged units. Update extinguisher log.',
 'immediate',   'EMP-ENG-001',  'DEP-ENG-001',  1,  'critical',  '2026-08-02',  24,  1),

('CA-HAZ-2026-SKR-00003-02',  3,  'Update monthly fire extinguisher inspection checklist to include pressure verification for all 8 units.',
 'preventive',  'EMP-HSE-001',  'DEP-HSE-001',  1,  'medium',    '2026-08-07',  24,  1);


-- =============================================================================
-- Verification
-- =============================================================================

SELECT
    ca.action_number,
    h.hazard_number,
    ca.action_description,
    ca.priority,
    ca.target_date,
    s.status_name,
    ca.is_overdue
FROM hazard_corrective_actions ca
JOIN hazards  h ON ca.hazard_id = h.hazard_id
JOIN statuses s ON ca.status_id = s.status_id
WHERE ca.deleted_at IS NULL
ORDER BY ca.priority, ca.target_date;

-- Count of open actions per hazard (used for closure eligibility check)
SELECT
    h.hazard_number,
    COUNT(*) AS total_actions,
    SUM(CASE WHEN s.is_closed_status = TRUE THEN 1 ELSE 0 END) AS closed_actions,
    SUM(CASE WHEN s.is_closed_status = FALSE THEN 1 ELSE 0 END) AS open_actions
FROM hazard_corrective_actions ca
JOIN hazards  h ON ca.hazard_id = h.hazard_id
JOIN statuses s ON ca.status_id = s.status_id
WHERE ca.deleted_at IS NULL
GROUP BY h.hazard_id, h.hazard_number;
