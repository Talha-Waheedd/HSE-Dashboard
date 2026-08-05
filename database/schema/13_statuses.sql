-- =============================================================================
-- 13_statuses.sql
-- CBL HSE Management System — Phase 3: Hazard Management Module
-- Table: statuses
--
-- Purpose:
--   Universal master status lookup table used by ALL modules in the system.
--   A single table with a module_name discriminator column avoids creating
--   separate status tables per module while keeping statuses contextual.
--   This design follows SAP configuration table patterns.
--
--   Modules using this table:
--     hazards, near_misses, incidents, corrective_actions, audits,
--     inspections, training, documents, sop, tna
--
--   Status lifecycle (example — Hazard):
--     DRAFT → SUBMITTED → ASSIGNED → IN_PROGRESS → PENDING_REVIEW
--     → APPROVED → CLOSED
--     → REJECTED → REOPENED → IN_PROGRESS (loop)
--
-- Depends on: (none — root lookup table)
-- Run: SOURCE database/schema/13_statuses.sql;
-- =============================================================================

USE cbl_hse;

-- -----------------------------------------------------------------------------
-- Table Definition
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS statuses (

    -- ── Identity ──────────────────────────────────────────────────────────────
    status_id           BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT          COMMENT 'Surrogate PK.',
    status_name         VARCHAR(80)         NOT NULL                         COMMENT 'Display name shown in the UI. e.g. Pending Review, In Progress.',
    status_code         VARCHAR(40)         NOT NULL                         COMMENT 'Machine-readable code used in API responses and business logic. e.g. PENDING_REVIEW.',

    -- ── Module Scoping ────────────────────────────────────────────────────────
    module_name         VARCHAR(50)         NOT NULL                         COMMENT 'The module this status belongs to. Matches the table name. e.g. hazards, incidents, training. Use ALL for global statuses.',

    -- ── Display & Behaviour ────────────────────────────────────────────────────
    display_order       TINYINT UNSIGNED    NOT NULL DEFAULT 99              COMMENT 'Sort order within the module status list. Lower = shown first.',
    color               VARCHAR(10)         NULL                             COMMENT 'Hex color for status badge in the UI.',
    background_color    VARCHAR(10)         NULL                             COMMENT 'Background hex color for status chip/badge.',
    description         VARCHAR(500)        NULL                             COMMENT 'What this status means in the workflow context.',

    -- ── Workflow Flags ────────────────────────────────────────────────────────
    is_closed_status    BOOLEAN             NOT NULL DEFAULT FALSE           COMMENT 'TRUE = records with this status are considered closed/terminal and counted in closure KPIs.',
    is_initial_status   BOOLEAN             NOT NULL DEFAULT FALSE           COMMENT 'TRUE = this is the starting status when a new record is created.',
    allows_edit         BOOLEAN             NOT NULL DEFAULT TRUE            COMMENT 'FALSE = records in this status cannot be edited by the reporter (e.g. Approved, Closed).',
    requires_comment    BOOLEAN             NOT NULL DEFAULT FALSE           COMMENT 'TRUE = a reason/comment is mandatory when transitioning to this status (e.g. Rejected, Reopened).',

    -- ── Meta ──────────────────────────────────────────────────────────────────
    is_active           BOOLEAN             NOT NULL DEFAULT TRUE            COMMENT 'FALSE = status is hidden from UI and cannot be used for new records.',
    created_at          DATETIME(3)         NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at          DATETIME(3)         NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    -- ── Constraints ───────────────────────────────────────────────────────────
    PRIMARY KEY (status_id),
    UNIQUE KEY uq_statuses_code_module (status_code, module_name)           COMMENT 'Status codes must be unique per module.',

    -- ── Indexes ───────────────────────────────────────────────────────────────
    INDEX idx_statuses_module       (module_name)           COMMENT 'Primary lookup pattern — filter by module.',
    INDEX idx_statuses_is_active    (is_active),
    INDEX idx_statuses_display_ord  (module_name, display_order)

) ENGINE=InnoDB
  AUTO_INCREMENT=1
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Universal status master table for all HSE modules. module_name discriminator scopes statuses per module.';


-- =============================================================================
-- Seed Data — Statuses for ALL modules
-- =============================================================================

INSERT INTO statuses
    (status_id, status_name,        status_code,        module_name,            display_order,
     color,      background_color,  description,
     is_closed_status, is_initial_status, allows_edit, requires_comment, is_active)
VALUES

-- ─────────────────────────────────────────────────────────────────────────────
-- MODULE: hazards
-- ─────────────────────────────────────────────────────────────────────────────
(1,  'Draft',               'DRAFT',            'hazards',              1,  '#6B7280', '#F3F4F6', 'Hazard report saved but not yet submitted.',                                       FALSE, TRUE,  TRUE,  FALSE, TRUE),
(2,  'Submitted',           'SUBMITTED',        'hazards',              2,  '#2563EB', '#DBEAFE', 'Hazard submitted for review by HSE.',                                              FALSE, FALSE, FALSE, FALSE, TRUE),
(3,  'Assigned',            'ASSIGNED',         'hazards',              3,  '#7C3AED', '#EDE9FE', 'Responsible person has been assigned.',                                            FALSE, FALSE, FALSE, FALSE, TRUE),
(4,  'In Progress',         'IN_PROGRESS',      'hazards',              4,  '#D97706', '#FEF3C7', 'Corrective actions are being implemented.',                                        FALSE, FALSE, FALSE, FALSE, TRUE),
(5,  'Pending Review',      'PENDING_REVIEW',   'hazards',              5,  '#0891B2', '#CFFAFE', 'Responsible person has marked complete. Awaiting HSE review.',                    FALSE, FALSE, FALSE, FALSE, TRUE),
(6,  'Waiting Approval',    'WAITING_APPROVAL', 'hazards',              6,  '#9333EA', '#F3E8FF', 'Under HSE Administrator approval.',                                               FALSE, FALSE, FALSE, FALSE, TRUE),
(7,  'Approved',            'APPROVED',         'hazards',              7,  '#15803D', '#DCFCE7', 'Corrective actions verified and approved by HSE.',                                FALSE, FALSE, FALSE, FALSE, TRUE),
(8,  'Rejected',            'REJECTED',         'hazards',              8,  '#DC2626', '#FEE2E2', 'Rejected by HSE — requires rework by responsible person.',                        FALSE, FALSE, FALSE, TRUE,  TRUE),
(9,  'Reopened',            'REOPENED',         'hazards',              9,  '#F97316', '#FFEDD5', 'Hazard was reopened after rejection or recurring observation.',                   FALSE, FALSE, FALSE, TRUE,  TRUE),
(10, 'Closed',              'CLOSED',           'hazards',              10, '#1F2937', '#F9FAFB', 'Hazard permanently closed. All corrective actions verified.',                    TRUE,  FALSE, FALSE, FALSE, TRUE),
(11, 'Cancelled',           'CANCELLED',        'hazards',              11, '#6B7280', '#F3F4F6', 'Hazard report cancelled (duplicate or invalid).',                                 TRUE,  FALSE, FALSE, TRUE,  TRUE),
(12, 'Archived',            'ARCHIVED',         'hazards',              12, '#374151', '#E5E7EB', 'Archived for long-term retention. Read-only.',                                    TRUE,  FALSE, FALSE, FALSE, TRUE),

-- ─────────────────────────────────────────────────────────────────────────────
-- MODULE: near_misses
-- ─────────────────────────────────────────────────────────────────────────────
(13, 'Draft',               'DRAFT',            'near_misses',          1,  '#6B7280', '#F3F4F6', 'Near miss saved but not submitted.',                                              FALSE, TRUE,  TRUE,  FALSE, TRUE),
(14, 'Submitted',           'SUBMITTED',        'near_misses',          2,  '#2563EB', '#DBEAFE', 'Near miss submitted for review.',                                                 FALSE, FALSE, FALSE, FALSE, TRUE),
(15, 'Under Investigation', 'INVESTIGATING',    'near_misses',          3,  '#D97706', '#FEF3C7', 'Root cause investigation in progress.',                                            FALSE, FALSE, FALSE, FALSE, TRUE),
(16, 'Closed',              'CLOSED',           'near_misses',          4,  '#1F2937', '#F9FAFB', 'Near miss closed after corrective action.',                                       TRUE,  FALSE, FALSE, FALSE, TRUE),
(17, 'Cancelled',           'CANCELLED',        'near_misses',          5,  '#6B7280', '#F3F4F6', 'Cancelled — duplicate or invalid report.',                                        TRUE,  FALSE, FALSE, TRUE,  TRUE),

-- ─────────────────────────────────────────────────────────────────────────────
-- MODULE: incidents
-- ─────────────────────────────────────────────────────────────────────────────
(18, 'Draft',               'DRAFT',            'incidents',            1,  '#6B7280', '#F3F4F6', 'Incident report in draft state.',                                                 FALSE, TRUE,  TRUE,  FALSE, TRUE),
(19, 'Reported',            'REPORTED',         'incidents',            2,  '#2563EB', '#DBEAFE', 'Incident formally reported.',                                                     FALSE, FALSE, FALSE, FALSE, TRUE),
(20, 'Under Investigation', 'INVESTIGATING',    'incidents',            3,  '#D97706', '#FEF3C7', 'Investigation team assigned and active.',                                          FALSE, FALSE, FALSE, FALSE, TRUE),
(21, 'Pending Approval',    'PENDING_APPROVAL', 'incidents',            4,  '#9333EA', '#F3E8FF', 'Investigation report awaiting management approval.',                              FALSE, FALSE, FALSE, FALSE, TRUE),
(22, 'Approved',            'APPROVED',         'incidents',            5,  '#15803D', '#DCFCE7', 'Investigation approved. Actions in progress.',                                    FALSE, FALSE, FALSE, FALSE, TRUE),
(23, 'Closed',              'CLOSED',           'incidents',            6,  '#1F2937', '#F9FAFB', 'Incident closed. All actions complete.',                                          TRUE,  FALSE, FALSE, FALSE, TRUE),

-- ─────────────────────────────────────────────────────────────────────────────
-- MODULE: corrective_actions
-- ─────────────────────────────────────────────────────────────────────────────
(24, 'Open',                'OPEN',             'corrective_actions',   1,  '#2563EB', '#DBEAFE', 'Action assigned and open.',                                                       FALSE, TRUE,  TRUE,  FALSE, TRUE),
(25, 'In Progress',         'IN_PROGRESS',      'corrective_actions',   2,  '#D97706', '#FEF3C7', 'Action is being implemented.',                                                    FALSE, FALSE, TRUE,  FALSE, TRUE),
(26, 'Completed',           'COMPLETED',        'corrective_actions',   3,  '#0891B2', '#CFFAFE', 'Action marked complete by responsible person. Pending verification.',            FALSE, FALSE, FALSE, FALSE, TRUE),
(27, 'Verified',            'VERIFIED',         'corrective_actions',   4,  '#15803D', '#DCFCE7', 'Action verified as effective by HSE.',                                            TRUE,  FALSE, FALSE, FALSE, TRUE),
(28, 'Overdue',             'OVERDUE',          'corrective_actions',   5,  '#DC2626', '#FEE2E2', 'Target date passed without completion.',                                          FALSE, FALSE, TRUE,  FALSE, TRUE),

-- ─────────────────────────────────────────────────────────────────────────────
-- MODULE: audits
-- ─────────────────────────────────────────────────────────────────────────────
(29, 'Scheduled',           'SCHEDULED',        'audits',               1,  '#2563EB', '#DBEAFE', 'Audit planned and date scheduled.',                                               FALSE, TRUE,  TRUE,  FALSE, TRUE),
(30, 'In Progress',         'IN_PROGRESS',      'audits',               2,  '#D97706', '#FEF3C7', 'Audit is being conducted on-site.',                                               FALSE, FALSE, FALSE, FALSE, TRUE),
(31, 'Report Pending',      'REPORT_PENDING',   'audits',               3,  '#9333EA', '#F3E8FF', 'Audit done. Report being finalized.',                                             FALSE, FALSE, FALSE, FALSE, TRUE),
(32, 'Approved',            'APPROVED',         'audits',               4,  '#15803D', '#DCFCE7', 'Audit report approved.',                                                          FALSE, FALSE, FALSE, FALSE, TRUE),
(33, 'Closed',              'CLOSED',           'audits',               5,  '#1F2937', '#F9FAFB', 'All findings actioned and audit closed.',                                         TRUE,  FALSE, FALSE, FALSE, TRUE),

-- ─────────────────────────────────────────────────────────────────────────────
-- MODULE: inspections
-- ─────────────────────────────────────────────────────────────────────────────
(34, 'Scheduled',           'SCHEDULED',        'inspections',          1,  '#2563EB', '#DBEAFE', 'Inspection scheduled.',                                                           FALSE, TRUE,  TRUE,  FALSE, TRUE),
(35, 'In Progress',         'IN_PROGRESS',      'inspections',          2,  '#D97706', '#FEF3C7', 'Inspection being conducted.',                                                     FALSE, FALSE, FALSE, FALSE, TRUE),
(36, 'Closed',              'CLOSED',           'inspections',          3,  '#1F2937', '#F9FAFB', 'Inspection closed.',                                                              TRUE,  FALSE, FALSE, FALSE, TRUE),

-- ─────────────────────────────────────────────────────────────────────────────
-- MODULE: training
-- ─────────────────────────────────────────────────────────────────────────────
(37, 'Planned',             'PLANNED',          'training',             1,  '#2563EB', '#DBEAFE', 'Training session planned.',                                                       FALSE, TRUE,  TRUE,  FALSE, TRUE),
(38, 'In Progress',         'IN_PROGRESS',      'training',             2,  '#D97706', '#FEF3C7', 'Training currently ongoing.',                                                     FALSE, FALSE, FALSE, FALSE, TRUE),
(39, 'Completed',           'COMPLETED',        'training',             3,  '#15803D', '#DCFCE7', 'Training completed and attendance recorded.',                                     TRUE,  FALSE, FALSE, FALSE, TRUE),
(40, 'Cancelled',           'CANCELLED',        'training',             4,  '#6B7280', '#F3F4F6', 'Training cancelled.',                                                             TRUE,  FALSE, FALSE, TRUE,  TRUE)

ON DUPLICATE KEY UPDATE
    status_name     = VALUES(status_name),
    color           = VALUES(color),
    description     = VALUES(description),
    is_active       = VALUES(is_active),
    updated_at      = CURRENT_TIMESTAMP(3);


-- =============================================================================
-- Verification
-- =============================================================================

SELECT
    module_name,
    COUNT(*) AS status_count
FROM statuses
GROUP BY module_name
ORDER BY module_name;

SELECT
    status_id,
    module_name,
    status_code,
    status_name,
    is_initial_status,
    is_closed_status,
    display_order
FROM statuses
WHERE module_name = 'hazards'
ORDER BY display_order;
