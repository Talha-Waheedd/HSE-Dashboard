-- ==================================================
-- TABLE NAME
--   training_types
--
-- Purpose
--   Master catalog of HSE, quality, environmental, leadership, soft-skill, and
--   technical training programs used for compliance and competency planning.
--
-- Relationships
--   Referenced by training_sessions, training_need_assessment, and dashboards.
--   Audit ownership references users.
--
-- Indexes
--   Unique code/name, active ordering, mandatory compliance, certification,
--   validity/refresh reporting, and soft deletion.
--
-- Workflow
--   Active types appear in training forms. Retired types remain available for history.
--
-- Author
--   CBL HSE Database Architecture
--
-- Version
--   1.0.0 | Phase 6 | MySQL 8
-- ==================================================

USE cbl_hse;

CREATE TABLE IF NOT EXISTS training_types (
    training_type_id       BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    training_code          VARCHAR(40) NOT NULL,
    training_name          VARCHAR(150) NOT NULL,
    category               ENUM('hse', 'quality', 'environmental', 'leadership', 'soft_skills', 'technical', 'induction') NOT NULL,
    mandatory_flag         BOOLEAN NOT NULL DEFAULT FALSE,
    certification_required BOOLEAN NOT NULL DEFAULT FALSE,
    validity_period_months SMALLINT UNSIGNED NULL,
    refresh_interval_months SMALLINT UNSIGNED NULL,
    active_status           BOOLEAN NOT NULL DEFAULT TRUE,
    display_order           SMALLINT UNSIGNED NOT NULL DEFAULT 999,
    description             VARCHAR(500) NULL,
    created_by              BIGINT UNSIGNED NULL,
    updated_by              BIGINT UNSIGNED NULL,
    created_at              DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at              DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at              DATETIME(3) NULL,

    PRIMARY KEY (training_type_id),
    UNIQUE KEY uq_training_types_code (training_code),
    UNIQUE KEY uq_training_types_name (training_name),
    CONSTRAINT chk_training_type_validity CHECK (validity_period_months IS NULL OR validity_period_months > 0),
    CONSTRAINT chk_training_type_refresh CHECK (refresh_interval_months IS NULL OR refresh_interval_months > 0),
    CONSTRAINT fk_training_type_created_by FOREIGN KEY (created_by) REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_training_type_updated_by FOREIGN KEY (updated_by) REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_training_type_active_order (active_status, display_order),
    INDEX idx_training_type_mandatory (mandatory_flag, active_status),
    INDEX idx_training_type_certification (certification_required, validity_period_months),
    INDEX idx_training_type_category (category, active_status),
    INDEX idx_training_type_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Enterprise training type and compliance master catalog.';

INSERT INTO training_types
    (training_type_id, training_code, training_name, category, mandatory_flag, certification_required, validity_period_months, refresh_interval_months, active_status, display_order, description, created_by, updated_by)
VALUES
    (1,  'HSE-IND',       'HSE Induction',             'induction',     TRUE,  TRUE,  24, 24, TRUE, 1,  'Initial HSE orientation for employees and contractors.', 1, 1),
    (2,  'FIRE-SAFE',     'Fire Safety',               'hse',           TRUE,  TRUE,  12, 12, TRUE, 2,  'Fire prevention, extinguisher use, and evacuation.', 1, 1),
    (3,  'FIRST-AID',     'First Aid',                 'hse',           TRUE,  TRUE,  24, 24, TRUE, 3,  'Basic first aid response and emergency care.', 1, 1),
    (4,  'EMR-RESP',      'Emergency Response',         'hse',           TRUE,  FALSE, 12, 12, TRUE, 4,  'Plant emergency command and response roles.', 1, 1),
    (5,  'PPE-AWARE',     'PPE Awareness',              'hse',           TRUE,  FALSE, 12, 12, TRUE, 5,  'Selection, use, inspection, and care of PPE.', 1, 1),
    (6,  'CHEM-SAFE',     'Chemical Safety',             'hse',           TRUE,  TRUE,  12, 12, TRUE, 6,  'Chemical handling, SDS, storage, and spill response.', 1, 1),
    (7,  'ELEC-SAFE',     'Electrical Safety',           'hse',           TRUE,  TRUE,  24, 24, TRUE, 7,  'Electrical hazards, boundaries, and safe work practices.', 1, 1),
    (8,  'LOTO',          'Lockout Tagout',              'hse',           TRUE,  TRUE,  12, 12, TRUE, 8,  'Energy isolation and verification competence.', 1, 1),
    (9,  'WAH',           'Working at Height',           'hse',           TRUE,  TRUE,  12, 12, TRUE, 9,  'Fall prevention, harness use, and rescue planning.', 1, 1),
    (10, 'CONFINED',      'Confined Space',              'hse',           TRUE,  TRUE,  12, 12, TRUE, 10, 'Entry permits, atmospheric testing, and rescue.', 1, 1),
    (11, 'MACHINE-SAFE',  'Machine Safety',              'technical',     TRUE,  FALSE, 24, 24, TRUE, 11, 'Machine guarding and safe operation.', 1, 1),
    (12, 'FOOD-SAFE',     'Food Safety',                'quality',       TRUE,  TRUE,  12, 12, TRUE, 12, 'Food hygiene and food-safety controls.', 1, 1),
    (13, 'ISO45001',      'ISO 45001 Awareness',        'hse',           FALSE, FALSE, NULL, 24, TRUE, 13, 'Occupational health and safety management system awareness.', 1, 1),
    (14, 'ISO9001',       'ISO 9001 Awareness',         'quality',       FALSE, FALSE, NULL, 24, TRUE, 14, 'Quality management system awareness.', 1, 1),
    (15, 'ENV-AWARE',     'Environmental Awareness',    'environmental', TRUE,  FALSE, 12, 12, TRUE, 15, 'Environmental aspects, waste, and spill prevention.', 1, 1),
    (16, 'DEF-DRIVE',     'Defensive Driving',           'hse',           TRUE,  TRUE,  24, 24, TRUE, 16, 'Safe vehicle operation and journey management.', 1, 1),
    (17, 'CONT-IND',      'Contractor Induction',       'induction',     TRUE,  TRUE,  12, 12, TRUE, 17, 'Site rules and contractor HSE expectations.', 1, 1),
    (18, 'LEAD-HSE',      'Leadership Training',        'leadership',    FALSE, FALSE, NULL, 24, TRUE, 18, 'Visible safety leadership and accountability.', 1, 1),
    (19, 'SOFT-SKILLS',   'Soft Skills',                'soft_skills',   FALSE, FALSE, NULL, NULL, TRUE, 19, 'Communication, teamwork, and workplace behaviors.', 1, 1),
    (20, 'TECHNICAL',     'Technical Training',          'technical',     FALSE, TRUE,  36, 36, TRUE, 20, 'Role-specific technical capability development.', 1, 1);

SELECT training_type_id, training_code, training_name, category, mandatory_flag, certification_required, active_status
FROM training_types WHERE deleted_at IS NULL ORDER BY display_order;
