-- =============================================================================
-- 11_hazard_categories.sql
-- CBL HSE Management System — Phase 3: Hazard Management Module
-- Table: hazard_categories
--
-- Purpose:
--   Master lookup table for all hazard categories used in the system.
--   Hazard categories classify the TYPE of hazard observed (e.g., Electrical,
--   Chemical, Fire). They drive color-coding, icons, filtering, and KPI grouping
--   on the dashboard. Follows SAP EHS category classification principles.
--
-- Relationships:
--   hazard_categories → hazards (one category → many hazards)
--
-- Performance Notes:
--   This is a small, high-read, low-write lookup table. It will be cached
--   by the application layer. No heavy indexing required beyond PK and code.
--
-- Depends on: (none — this is a root lookup table)
-- Run: SOURCE database/schema/11_hazard_categories.sql;
-- =============================================================================

USE cbl_hse;

-- -----------------------------------------------------------------------------
-- Table Definition
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS hazard_categories (

    -- ── Identity ──────────────────────────────────────────────────────────────
    category_id         BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT          COMMENT 'Surrogate PK — auto-increment for fast FK joins.',
    category_name       VARCHAR(100)        NOT NULL                         COMMENT 'Full display name of the hazard category. e.g. Electrical, Chemical, Fire.',
    category_code       VARCHAR(30)         NOT NULL                         COMMENT 'Short unique code used in filters, exports, and API responses. e.g. ELEC, CHEM, FIRE.',
    description         TEXT                NULL                             COMMENT 'Detailed description of what hazards fall under this category and how to assess them.',

    -- ── Display & UI ──────────────────────────────────────────────────────────
    color_code          VARCHAR(10)         NULL                             COMMENT 'Hex color code for category badge/chip in the UI. e.g. #FF5733 for fire. Ensures consistent visual identity.',
    icon                VARCHAR(100)        NULL                             COMMENT 'Icon identifier for the UI. Can be a Lucide icon name or SVG filename. e.g. zap, flame, droplets.',
    display_order       TINYINT UNSIGNED    NOT NULL DEFAULT 99              COMMENT 'Sort order for dropdown menus and category lists. Lower = shown first.',

    -- ── Status & Audit ────────────────────────────────────────────────────────
    is_active           BOOLEAN             NOT NULL DEFAULT TRUE            COMMENT 'FALSE = category is retired and hidden from new hazard forms. Existing records unaffected.',
    created_by          BIGINT UNSIGNED     NULL                             COMMENT 'FK → users.user_id — who created this category.',
    updated_by          BIGINT UNSIGNED     NULL                             COMMENT 'FK → users.user_id — who last modified this category.',
    created_at          DATETIME(3)         NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at          DATETIME(3)         NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at          DATETIME(3)         NULL                             COMMENT 'Soft-delete timestamp. NULL = active. Existing hazards retain reference.',

    -- ── Constraints ───────────────────────────────────────────────────────────
    PRIMARY KEY (category_id),
    UNIQUE KEY uq_hazard_categories_code   (category_code)                   COMMENT 'Category codes must be globally unique.',
    UNIQUE KEY uq_hazard_categories_name   (category_name)                   COMMENT 'Category names must be unique.',

    -- ── Indexes ───────────────────────────────────────────────────────────────
    INDEX idx_hcat_is_active        (is_active)             COMMENT 'Filter active categories for form dropdowns.',
    INDEX idx_hcat_display_order    (display_order)         COMMENT 'Sort categories for ordered dropdowns.',
    INDEX idx_hcat_deleted_at       (deleted_at)

) ENGINE=InnoDB
  AUTO_INCREMENT=1
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Master lookup table for hazard categories. Drives classification, KPIs, and dashboard grouping.';


-- =============================================================================
-- Seed Data — 20 Standard HSE Hazard Categories
-- Based on ISO 45001, OSHA, and CBL HSE requirements.
-- =============================================================================

INSERT INTO hazard_categories
    (category_id, category_name,           category_code,  color_code, icon,               display_order, is_active)
VALUES
    (1,  'Electrical',                      'ELEC',         '#F59E0B', 'zap',               1,  TRUE),
    (2,  'Mechanical',                      'MECH',         '#6B7280', 'settings',          2,  TRUE),
    (3,  'Chemical',                        'CHEM',         '#8B5CF6', 'flask-conical',      3,  TRUE),
    (4,  'Fire & Explosion',               'FIRE',         '#EF4444', 'flame',             4,  TRUE),
    (5,  'Working at Height',              'HEIGHT',       '#3B82F6', 'arrow-up',          5,  TRUE),
    (6,  'Environmental',                   'ENV',          '#10B981', 'leaf',              6,  TRUE),
    (7,  'Confined Space',                 'CONFINED',     '#78716C', 'circle-dot',        7,  TRUE),
    (8,  'Housekeeping',                   'HOUSEKEEP',    '#F97316', 'sparkles',          8,  TRUE),
    (9,  'Machine Guarding',               'MACHINE',      '#64748B', 'shield',            9,  TRUE),
    (10, 'Slip / Trip / Fall',             'STF',          '#FBBF24', 'footprints',        10, TRUE),
    (11, 'Personal Protective Equipment',  'PPE',          '#0EA5E9', 'hard-hat',          11, TRUE),
    (12, 'Vehicle & Traffic Movement',     'VEHICLE',      '#DC2626', 'truck',             12, TRUE),
    (13, 'Excavation & Ground Work',       'EXCAVATION',   '#92400E', 'shovel',            13, TRUE),
    (14, 'Noise & Vibration',             'NOISE',        '#7C3AED', 'volume-2',          14, TRUE),
    (15, 'Radiation',                      'RADIATION',    '#B91C1C', 'radio',             15, TRUE),
    (16, 'Biological / Health Hazard',    'BIOLOGICAL',   '#059669', 'biohazard',         16, TRUE),
    (17, 'Ergonomics',                     'ERGO',         '#6366F1', 'person-standing',   17, TRUE),
    (18, 'Pressure Systems',               'PRESSURE',     '#1D4ED8', 'gauge',             18, TRUE),
    (19, 'Utilities (Water/Gas/Steam)',    'UTILITIES',    '#0891B2', 'waves',             19, TRUE),
    (20, 'Security & Access Control',     'SECURITY',     '#374151', 'lock',              20, TRUE)

ON DUPLICATE KEY UPDATE
    category_name   = VALUES(category_name),
    color_code      = VALUES(color_code),
    icon            = VALUES(icon),
    is_active       = VALUES(is_active),
    updated_at      = CURRENT_TIMESTAMP(3);


-- =============================================================================
-- Verification
-- =============================================================================

SELECT
    category_id,
    category_code,
    category_name,
    color_code,
    display_order,
    is_active
FROM hazard_categories
ORDER BY display_order;
