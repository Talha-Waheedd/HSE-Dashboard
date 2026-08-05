-- ==================================================
-- TABLE NAME
--   incident_categories
--
-- Purpose
--   Master classification catalog for workplace incidents and accidents.
--   Category controls support OSHA recordability, ISO 45001 investigation
--   planning, SAP EHS workflow routing, and executive dashboard KPIs.
--
-- Relationships
--   Referenced by incidents.incident_category_id. Audit ownership references
--   users.user_id.
--
-- Indexes
--   Unique category code/name, active catalog filtering, severity analytics,
--   investigation/RCA/regulatory queues, display order, and soft deletion.
--
-- Workflow
--   Active categories are available to new incident reports. Retired categories
--   remain available to historical records but are excluded from new forms.
--
-- Author
--   CBL HSE Database Architecture
--
-- Version
--   1.0.0 | Phase 5 | MySQL 8
-- ==================================================

USE cbl_hse;

CREATE TABLE IF NOT EXISTS incident_categories (
    incident_category_id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT
                                      COMMENT 'Surrogate primary key.',
    category_name                 VARCHAR(120) NOT NULL
                                      COMMENT 'Enterprise incident classification name.',
    category_code                 VARCHAR(40) NOT NULL
                                      COMMENT 'Stable integration code used by APIs and reports.',
    severity_level                ENUM('minor', 'moderate', 'serious', 'critical', 'catastrophic')
                                      NOT NULL COMMENT 'Default severity band for this category.',
    color_code                    CHAR(7) NOT NULL
                                      COMMENT 'Hex color for dashboards and workflow badges.',
    dashboard_icon                VARCHAR(100) NOT NULL
                                      COMMENT 'Icon identifier used by the web and PowerApps clients.',
    default_investigation_required BOOLEAN NOT NULL DEFAULT FALSE
                                      COMMENT 'Default investigation routing rule; HSE may override per incident.',
    requires_rca                  BOOLEAN NOT NULL DEFAULT FALSE
                                      COMMENT 'Default RCA requirement; HSE may override per incident.',
    requires_regulatory_reporting BOOLEAN NOT NULL DEFAULT FALSE
                                      COMMENT 'Default regulatory notification flag; final decision is incident-specific.',
    description                   VARCHAR(500) NULL,
    display_order                 SMALLINT UNSIGNED NOT NULL DEFAULT 999,
    is_active                     BOOLEAN NOT NULL DEFAULT TRUE,
    created_by                    BIGINT UNSIGNED NULL COMMENT 'FK -> users.user_id.',
    updated_by                    BIGINT UNSIGNED NULL COMMENT 'FK -> users.user_id.',
    created_at                    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at                    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                                      ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at                    DATETIME(3) NULL,

    PRIMARY KEY (incident_category_id),
    UNIQUE KEY uq_incident_categories_code (category_code),
    UNIQUE KEY uq_incident_categories_name (category_name),
    CONSTRAINT chk_incident_category_color CHECK (color_code REGEXP '^#[0-9A-Fa-f]{6}$'),
    CONSTRAINT fk_incident_category_created_by FOREIGN KEY (created_by) REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_incident_category_updated_by FOREIGN KEY (updated_by) REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_incident_category_active_order (is_active, display_order),
    INDEX idx_incident_category_severity (severity_level, is_active),
    INDEX idx_incident_category_investigation (default_investigation_required, requires_rca),
    INDEX idx_incident_category_regulatory (requires_regulatory_reporting, is_active),
    INDEX idx_incident_category_deleted_at (deleted_at)
) ENGINE=InnoDB
  AUTO_INCREMENT=1
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Enterprise incident category master for severity, workflow, regulatory, and dashboard classification.';

-- ==================================================
-- Seed Data
-- ==================================================

INSERT INTO incident_categories (
    incident_category_id, category_name, category_code, severity_level, color_code, dashboard_icon,
    default_investigation_required, requires_rca, requires_regulatory_reporting, description,
    display_order, is_active, created_by, updated_by
) VALUES
    (1,  'First Aid',                    'FIRST_AID',       'minor',        '#16A34A', 'first-aid-kit', TRUE,  FALSE, FALSE, 'Case treated on site with first aid only.', 1,  TRUE, 1, 1),
    (2,  'Medical Treatment Case (MTC)', 'MTC',              'moderate',     '#2563EB', 'stethoscope',   TRUE,  FALSE, FALSE, 'Work-related case requiring treatment beyond first aid.', 2,  TRUE, 1, 1),
    (3,  'Restricted Work Case (RWC)',   'RWC',              'serious',      '#7C3AED', 'user-cog',       TRUE,  TRUE,  FALSE, 'Case where the employee cannot perform normal duties but remains at work.', 3,  TRUE, 1, 1),
    (4,  'Lost Time Injury (LTI)',       'LTI',              'serious',      '#D97706', 'user-minus',     TRUE,  TRUE,  TRUE,  'Work-related injury resulting in days away from work.', 4,  TRUE, 1, 1),
    (5,  'Fatality',                     'FATALITY',         'catastrophic', '#991B1B', 'skull',          TRUE,  TRUE,  TRUE,  'Work-related death or fatal occupational event.', 5,  TRUE, 1, 1),
    (6,  'Significant Near Miss',        'SIGNIFICANT_NM',   'serious',      '#EA580C', 'triangle-alert', TRUE,  TRUE,  FALSE, 'High-potential event that did not result in injury or damage.', 6,  TRUE, 1, 1),
    (7,  'Minor Fire',                   'MINOR_FIRE',       'moderate',     '#F97316', 'flame',          TRUE,  FALSE, FALSE, 'Small fire controlled without significant damage or escalation.', 7,  TRUE, 1, 1),
    (8,  'Major Fire',                   'MAJOR_FIRE',       'critical',     '#DC2626', 'flame-kindling', TRUE,  TRUE,  TRUE,  'Fire requiring emergency response, evacuation, or significant damage control.', 8,  TRUE, 1, 1),
    (9,  'Environmental Spill',           'ENV_SPILL',        'serious',      '#059669', 'droplets',       TRUE,  TRUE,  TRUE,  'Unplanned release affecting soil, water, air, or regulated containment.', 9,  TRUE, 1, 1),
    (10, 'Property Damage',               'PROPERTY_DAMAGE',  'moderate',     '#64748B', 'building-2',     TRUE,  FALSE, FALSE, 'Damage to company, contractor, or third-party property.', 10, TRUE, 1, 1),
    (11, 'Equipment Damage',              'EQUIPMENT_DAMAGE', 'moderate',     '#475569', 'factory',        TRUE,  FALSE, FALSE, 'Damage or loss of production or maintenance equipment.', 11, TRUE, 1, 1),
    (12, 'Vehicle Accident',              'VEHICLE_ACCIDENT', 'serious',      '#B45309', 'truck',          TRUE,  TRUE,  TRUE,  'On-site or business-related vehicle collision or movement event.', 12, TRUE, 1, 1),
    (13, 'Occupational Illness',          'OCC_ILLNESS',      'serious',      '#0891B2', 'lungs',           TRUE,  TRUE,  TRUE,  'Work-related illness, disease, or occupational health condition.', 13, TRUE, 1, 1),
    (14, 'Chemical Exposure',             'CHEM_EXPOSURE',    'serious',      '#9333EA', 'flask-conical',   TRUE,  TRUE,  TRUE,  'Unplanned exposure to a hazardous chemical or substance.', 14, TRUE, 1, 1),
    (15, 'Electrical Shock',              'ELECTRICAL_SHOCK', 'critical',     '#CA8A04', 'zap',             TRUE,  TRUE,  TRUE,  'Electrical contact, arc flash, or shock exposure event.', 15, TRUE, 1, 1),
    (16, 'Explosion',                    'EXPLOSION',        'catastrophic', '#7F1D1D', 'bomb',            TRUE,  TRUE,  TRUE,  'Explosion, blast, pressure release, or related event.', 16, TRUE, 1, 1),
    (17, 'Security Incident',             'SECURITY',         'serious',      '#1E3A8A', 'shield-alert',    TRUE,  TRUE,  TRUE,  'Threat, violence, unauthorized access, sabotage, or security breach.', 17, TRUE, 1, 1),
    (18, 'Natural Disaster',              'NATURAL_DISASTER', 'critical',     '#0F766E', 'cloud-lightning', TRUE,  TRUE,  TRUE,  'Earthquake, flood, severe weather, or other natural event.', 18, TRUE, 1, 1),
    (19, 'Other',                         'OTHER',            'moderate',     '#6B7280', 'circle-help',     FALSE, FALSE, FALSE, 'Incident not covered by a more specific enterprise category.', 19, TRUE, 1, 1);

-- ==================================================
-- Verification
-- ==================================================

SELECT
    incident_category_id,
    category_code,
    category_name,
    severity_level,
    default_investigation_required,
    requires_rca,
    requires_regulatory_reporting,
    is_active
FROM incident_categories
WHERE deleted_at IS NULL
ORDER BY display_order;
