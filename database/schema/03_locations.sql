-- =============================================================================
-- 03_locations.sql
-- CBL HSE Management System
-- Table: locations
-- Description: Physical locations within a plant. Each location belongs to
--              a department. HSE records (hazards, incidents, inspections)
--              reference a location to pinpoint where events occurred.
-- Depends on: 01_plants.sql, 02_departments.sql
-- Run: SOURCE database/schema/03_locations.sql;
-- =============================================================================

USE cbl_hse;

-- -----------------------------------------------------------------------------
-- Table Definition
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS locations (
    location_id     CHAR(36)        NOT NULL DEFAULT (UUID())   COMMENT 'Primary key — UUID',
    plant_id        CHAR(36)        NOT NULL                    COMMENT 'FK → plants.plant_id',
    department_id   CHAR(36)        NULL                        COMMENT 'FK → departments.department_id (optional — some locations span departments)',

    location_name   VARCHAR(200)    NOT NULL                    COMMENT 'Full descriptive name e.g. Production Line 1',
    location_code   VARCHAR(30)     NOT NULL                    COMMENT 'Short code e.g. PROD-L1, BOILER, WH-01',

    description     TEXT            NULL                        COMMENT 'Additional notes about the location',

    status          ENUM('active', 'inactive')
                                    NOT NULL DEFAULT 'active'   COMMENT 'Active / Inactive flag',

    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- ── Constraints ────────────────────────────────────────────────────────
    PRIMARY KEY (location_id),
    UNIQUE KEY uq_locations_code_plant (location_code, plant_id)          COMMENT 'Code must be unique per plant',

    -- ── Foreign Keys ────────────────────────────────────────────────────────
    CONSTRAINT fk_locations_plant
        FOREIGN KEY (plant_id) REFERENCES plants (plant_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,

    CONSTRAINT fk_locations_department
        FOREIGN KEY (department_id) REFERENCES departments (department_id)
        ON UPDATE CASCADE ON DELETE SET NULL,

    -- ── Indexes ─────────────────────────────────────────────────────────────
    INDEX idx_locations_plant_id      (plant_id),
    INDEX idx_locations_department_id (department_id),
    INDEX idx_locations_status        (status)

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Physical locations within a plant (lines, areas, rooms, stores).';


-- -----------------------------------------------------------------------------
-- Seed Data — CBL LU Sukkur Plant Locations
-- Department IDs must match 02_departments.sql seed data.
-- Uses INSERT IGNORE so it is safe to re-run.
-- -----------------------------------------------------------------------------

INSERT IGNORE INTO locations
    (location_id,           plant_id,           department_id,      location_name,              location_code,  description,                                            status)
VALUES
    -- Production
    ('LOC-PROD-L1',         'PLT-CBL-SKR-001',  'DEP-PROD-001',     'Production Line 1',        'PROD-L1',      'Main biscuit production line — Line 1',                 'active'),
    ('LOC-PROD-L2',         'PLT-CBL-SKR-001',  'DEP-PROD-001',     'Production Line 2',        'PROD-L2',      'Main biscuit production line — Line 2',                 'active'),
    ('LOC-PACK',            'PLT-CBL-SKR-001',  'DEP-PROD-001',     'Packing Area',             'PACK',         'Primary product packing and wrapping area',             'active'),

    -- Engineering / Utilities
    ('LOC-BOILER',          'PLT-CBL-SKR-001',  'DEP-ENG-001',      'Boiler Area',              'BOILER',       'Boiler house and steam generation area',                'active'),
    ('LOC-ELEC',            'PLT-CBL-SKR-001',  'DEP-ENG-001',      'Electrical Room',          'ELEC-RM',      'Main switchgear, MCC panels, and transformer area',     'active'),
    ('LOC-WORKSHOP',        'PLT-CBL-SKR-001',  'DEP-ENG-001',      'Workshop',                 'WRKSHP',       'Mechanical maintenance and fabrication workshop',       'active'),

    -- Stores / Warehouse
    ('LOC-WH',              'PLT-CBL-SKR-001',  'DEP-STORES-001',   'Warehouse',                'WH-01',        'General goods warehouse',                               'active'),
    ('LOC-RM-STORE',        'PLT-CBL-SKR-001',  'DEP-STORES-001',   'Raw Material Store',       'RM-STORE',     'Incoming raw material storage and receiving area',      'active'),
    ('LOC-FG-STORE',        'PLT-CBL-SKR-001',  'DEP-STORES-001',   'Finished Goods Store',     'FG-STORE',     'Finished product storage before dispatch',              'active'),

    -- Administration
    ('LOC-ADMIN',           'PLT-CBL-SKR-001',  'DEP-ADMIN-001',    'Admin Block',              'ADMIN-BLK',    'Administrative offices building',                       'active'),
    ('LOC-PARKING',         'PLT-CBL-SKR-001',  NULL,               'Parking Area',             'PARKING',      'Vehicle parking area — shared across all departments',  'active');


-- -----------------------------------------------------------------------------
-- Verification Query
-- -----------------------------------------------------------------------------

SELECT
    l.location_id,
    l.location_code,
    l.location_name,
    d.department_code,
    l.status
FROM locations l
LEFT JOIN departments d ON l.department_id = d.department_id
ORDER BY l.location_code;
