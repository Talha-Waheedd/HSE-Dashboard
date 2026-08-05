-- =============================================================================
-- 14_hazard_types.sql
-- CBL HSE Management System — Phase 3: Hazard Management Module
-- Table: hazard_types
--
-- Purpose:
--   Stores the type/nature of the hazard observed.
--   This was called "Unsafe Name" in the legacy system and has been renamed
--   to "Type of Hazard" per HSE team request.
--
--   Hazard Type answers the question: "What kind of hazard condition or act is this?"
--   Hazard Category (table 11) answers: "Which domain does it fall under?"
--
--   Examples:
--     Category: Electrical   → Type: Unsafe Condition / Equipment Failure
--     Category: Fire         → Type: Fire Hazard / Human Error
--     Category: Vehicle      → Type: Vehicle Hazard / Unsafe Act
--
-- Depends on: (none — root lookup table)
-- Run: SOURCE database/schema/14_hazard_types.sql;
-- =============================================================================

USE cbl_hse;

-- -----------------------------------------------------------------------------
-- Table Definition
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS hazard_types (

    -- ── Identity ──────────────────────────────────────────────────────────────
    hazard_type_id      BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT          COMMENT 'Surrogate PK.',
    type_name           VARCHAR(100)        NOT NULL                         COMMENT 'Full display name of the hazard type. e.g. Unsafe Act, Equipment Failure.',
    type_code           VARCHAR(40)         NOT NULL                         COMMENT 'Short unique code. e.g. UNSAFE_ACT, EQUIP_FAILURE, NEAR_MISS.',
    description         TEXT                NULL                             COMMENT 'Explanation of what this type represents with examples.',

    -- ── Display ───────────────────────────────────────────────────────────────
    color_code          VARCHAR(10)         NULL                             COMMENT 'Hex color for this type badge.',
    display_order       TINYINT UNSIGNED    NOT NULL DEFAULT 99              COMMENT 'Sort order in dropdown.',

    -- ── Status & Audit ────────────────────────────────────────────────────────
    is_active           BOOLEAN             NOT NULL DEFAULT TRUE            COMMENT 'FALSE = type hidden from new hazard forms.',
    created_by          BIGINT UNSIGNED     NULL                             COMMENT 'FK → users.user_id',
    updated_by          BIGINT UNSIGNED     NULL                             COMMENT 'FK → users.user_id',
    created_at          DATETIME(3)         NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at          DATETIME(3)         NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at          DATETIME(3)         NULL                             COMMENT 'Soft-delete. Existing hazards retain reference.',

    -- ── Constraints ───────────────────────────────────────────────────────────
    PRIMARY KEY (hazard_type_id),
    UNIQUE KEY uq_hazard_types_code (type_code),
    UNIQUE KEY uq_hazard_types_name (type_name),

    -- ── Indexes ───────────────────────────────────────────────────────────────
    INDEX idx_ht_is_active      (is_active),
    INDEX idx_ht_display_order  (display_order),
    INDEX idx_ht_deleted_at     (deleted_at)

) ENGINE=InnoDB
  AUTO_INCREMENT=1
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Type of Hazard lookup table (previously "Unsafe Name"). Classifies the nature of the observed hazard.';


-- =============================================================================
-- Seed Data — 12 Hazard Types
-- =============================================================================

INSERT INTO hazard_types
    (hazard_type_id, type_name,              type_code,          description,                                                                color_code, display_order, is_active)
VALUES
    (1,  'Unsafe Act',              'UNSAFE_ACT',       'An action by a person that deviates from accepted safe work procedures.',           '#DC2626',  1,  TRUE),
    (2,  'Unsafe Condition',        'UNSAFE_COND',      'A physical state of the workplace, equipment, or environment that poses a risk.',   '#D97706',  2,  TRUE),
    (3,  'Near Miss',               'NEAR_MISS',        'An unplanned event that did not result in injury but had the potential to.',        '#F59E0B',  3,  TRUE),
    (4,  'Equipment Failure',       'EQUIP_FAILURE',    'Malfunction or breakdown of machinery, tools, or safety systems.',                 '#7C3AED',  4,  TRUE),
    (5,  'Human Error',             'HUMAN_ERROR',      'An unintentional mistake or lapse in judgment by personnel.',                      '#0891B2',  5,  TRUE),
    (6,  'Behavioral Hazard',       'BEHAVIORAL',       'Deliberate or habitual unsafe behavior, including ignoring safety rules.',         '#DB2777',  6,  TRUE),
    (7,  'Environmental Hazard',    'ENVIRONMENTAL',    'Hazard arising from environmental conditions such as weather, spillage, or waste.', '#10B981',  7,  TRUE),
    (8,  'Fire Hazard',             'FIRE',             'Conditions that increase the risk of fire, such as exposed ignition sources.',     '#EF4444',  8,  TRUE),
    (9,  'Chemical Hazard',         'CHEMICAL',         'Presence of hazardous substances that may cause harm through contact/inhalation.', '#8B5CF6',  9,  TRUE),
    (10, 'Vehicle Hazard',          'VEHICLE',          'Risk arising from vehicle movement, parking violations, or traffic management.',   '#6B7280',  10, TRUE),
    (11, 'Electrical Hazard',       'ELECTRICAL',       'Risk from exposed wiring, overloaded circuits, or unsafe electrical equipment.',   '#F59E0B',  11, TRUE),
    (12, 'Mechanical Hazard',       'MECHANICAL',       'Risk from moving parts, unguarded machinery, or structural failure.',              '#374151',  12, TRUE)

ON DUPLICATE KEY UPDATE
    type_name       = VALUES(type_name),
    description     = VALUES(description),
    is_active       = VALUES(is_active),
    updated_at      = CURRENT_TIMESTAMP(3);


-- =============================================================================
-- Verification
-- =============================================================================

SELECT
    hazard_type_id,
    type_code,
    type_name,
    display_order,
    is_active
FROM hazard_types
ORDER BY display_order;
