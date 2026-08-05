-- =============================================================================
-- 12_risk_ratings.sql
-- CBL HSE Management System — Phase 3: Hazard Management Module
-- Table: risk_ratings
--
-- Purpose:
--   Master Risk Rating lookup table based on a 5x5 Risk Matrix (Likelihood ×
--   Severity). Used by the Hazard module to assess and prioritize hazards.
--   Controls escalation timelines, color-coding, and required actions.
--
--   Risk Matrix Logic:
--     score = severity_score × probability_score  (1–5 each)
--     score 1–4   → Very Low
--     score 5–9   → Low
--     score 10–14 → Medium
--     score 15–19 → High
--     score 20–25 → Extreme
--
--   Following ISO 45001, OSHA, and Enablon risk assessment methodology.
--
-- Depends on: (none — root lookup table)
-- Run: SOURCE database/schema/12_risk_ratings.sql;
-- =============================================================================

USE cbl_hse;

-- -----------------------------------------------------------------------------
-- Table Definition
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS risk_ratings (

    -- ── Identity ──────────────────────────────────────────────────────────────
    risk_rating_id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT  COMMENT 'Surrogate PK.',
    rating_name                 VARCHAR(50)         NOT NULL                 COMMENT 'Display name of the risk rating. e.g. Extreme, High, Medium.',
    rating_code                 VARCHAR(20)         NOT NULL                 COMMENT 'Short code used in API, filters, and exports. e.g. EXTREME, HIGH, MED.',

    -- ── Risk Matrix Components ────────────────────────────────────────────────
    score_min                   TINYINT UNSIGNED    NOT NULL                 COMMENT 'Minimum risk score (severity × probability) that maps to this rating.',
    score_max                   TINYINT UNSIGNED    NOT NULL                 COMMENT 'Maximum risk score that maps to this rating.',
    severity_label              VARCHAR(50)         NOT NULL                 COMMENT 'Severity description for this band. e.g. Catastrophic, Major, Moderate.',
    probability_label           VARCHAR(50)         NOT NULL                 COMMENT 'Probability description for this band. e.g. Almost Certain, Likely, Possible.',

    -- ── Priority & Escalation ─────────────────────────────────────────────────
    priority_order              TINYINT UNSIGNED    NOT NULL                 COMMENT 'Sort order — 1 = highest urgency (Extreme), 5 = lowest (Very Low).',
    requires_immediate_action   BOOLEAN             NOT NULL DEFAULT FALSE   COMMENT 'TRUE = this hazard must be actioned immediately. Triggers instant notification.',
    escalation_hours            SMALLINT UNSIGNED   NOT NULL DEFAULT 72      COMMENT 'Target resolution time in hours. Used for overdue calculation. e.g. Extreme=4h, High=24h.',
    management_notification     BOOLEAN             NOT NULL DEFAULT FALSE   COMMENT 'TRUE = senior management must be notified when a hazard with this rating is reported.',

    -- ── Display ───────────────────────────────────────────────────────────────
    color                       VARCHAR(10)         NOT NULL                 COMMENT 'Hex color code for badge display. e.g. #EF4444 for Extreme (red).',
    background_color            VARCHAR(10)         NULL                     COMMENT 'Background fill color for risk matrix cell display.',
    description                 TEXT                NULL                     COMMENT 'Full description of the risk level and required response actions.',

    -- ── Timestamps ────────────────────────────────────────────────────────────
    created_at                  DATETIME(3)         NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at                  DATETIME(3)         NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at                  DATETIME(3)         NULL                     COMMENT 'Soft-delete. Risk ratings are never hard-deleted to preserve historical integrity.',

    -- ── Constraints ───────────────────────────────────────────────────────────
    PRIMARY KEY (risk_rating_id),
    UNIQUE KEY uq_risk_ratings_code     (rating_code),
    UNIQUE KEY uq_risk_ratings_name     (rating_name),

    CONSTRAINT chk_risk_score_range
        CHECK (score_min <= score_max AND score_min >= 1 AND score_max <= 25)
                                                                             COMMENT 'Score range must be valid within a 5x5 matrix (1–25).',

    -- ── Indexes ───────────────────────────────────────────────────────────────
    INDEX idx_rr_priority_order     (priority_order),
    INDEX idx_rr_deleted_at         (deleted_at)

) ENGINE=InnoDB
  AUTO_INCREMENT=1
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Master risk rating levels based on 5×5 risk matrix. Controls escalation timelines and notification rules.';


-- =============================================================================
-- Seed Data — 5 Risk Rating Bands
-- =============================================================================

INSERT INTO risk_ratings
    (risk_rating_id, rating_name, rating_code, score_min, score_max,
     severity_label,        probability_label,
     priority_order, requires_immediate_action, escalation_hours, management_notification,
     color,      background_color,
     description)
VALUES
(
    1, 'Extreme', 'EXTREME', 20, 25,
    'Catastrophic — Fatality or multiple injuries / irreversible environmental damage.',
    'Almost Certain — Will most likely occur in most circumstances.',
    1, TRUE, 4, TRUE,
    '#7F1D1D', '#FEE2E2',
    'STOP WORK IMMEDIATELY. Escalate to Plant Manager, HSE Manager, and Directors within 1 hour. Corrective action must begin within 4 hours. External regulatory notification may be required.'
),
(
    2, 'High', 'HIGH', 15, 19,
    'Major — Serious injury, permanent disability, or significant environmental impact.',
    'Likely — Will probably occur in most circumstances.',
    2, TRUE, 24, TRUE,
    '#B91C1C', '#FEE2E2',
    'Immediate notification to HSE Manager and Department Head. Work may continue with controls. Corrective action must be assigned within 24 hours. Management review required.'
),
(
    3, 'Medium', 'MEDIUM', 10, 14,
    'Moderate — Lost time injury or significant first aid. Moderate environmental impact.',
    'Possible — Might occur at some time.',
    3, FALSE, 72, FALSE,
    '#D97706', '#FEF3C7',
    'Notify HSE Officer. Corrective action required within 72 hours (3 working days). Responsible person must be assigned. Monitor closely until closed.'
),
(
    4, 'Low', 'LOW', 5, 9,
    'Minor — First aid treatment required. Minor environmental impact.',
    'Unlikely — Could occur but not expected.',
    4, FALSE, 168, FALSE,
    '#15803D', '#DCFCE7',
    'Document and assign to responsible person. Corrective action required within 7 days. Standard review process applies.'
),
(
    5, 'Very Low', 'VERY_LOW', 1, 4,
    'Negligible — No injury or minimal environmental impact.',
    'Rare — May occur only in exceptional circumstances.',
    5, FALSE, 336, FALSE,
    '#1D4ED8', '#DBEAFE',
    'Log for awareness and continuous improvement tracking. Corrective action within 14 days. No immediate escalation required.'
)

ON DUPLICATE KEY UPDATE
    rating_name                 = VALUES(rating_name),
    score_min                   = VALUES(score_min),
    score_max                   = VALUES(score_max),
    requires_immediate_action   = VALUES(requires_immediate_action),
    escalation_hours            = VALUES(escalation_hours),
    updated_at                  = CURRENT_TIMESTAMP(3);


-- =============================================================================
-- Verification
-- =============================================================================

SELECT
    risk_rating_id,
    rating_code,
    rating_name,
    score_min,
    score_max,
    priority_order,
    requires_immediate_action,
    escalation_hours,
    color
FROM risk_ratings
ORDER BY priority_order;
