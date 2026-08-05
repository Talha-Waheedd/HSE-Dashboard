-- =============================================================================
-- 02_departments.sql
-- CBL HSE Management System
-- Table: departments
-- Description: All departments within a plant. Every HSE record
--              (hazards, incidents, training, etc.) is scoped to a department.
-- Run: SOURCE database/schema/02_departments.sql;
-- =============================================================================

USE cbl_hse;

-- -----------------------------------------------------------------------------
-- Table Definition
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS departments (
    department_id   CHAR(36)        NOT NULL DEFAULT (UUID())   COMMENT 'Primary key — UUID',
    plant_id        CHAR(36)        NOT NULL                    COMMENT 'FK → plants.plant_id',

    department_name VARCHAR(150)    NOT NULL                    COMMENT 'Full department name e.g. Health, Safety & Environment',
    department_code VARCHAR(20)     NOT NULL                    COMMENT 'Short code e.g. HSE, PROD, ENG',

    department_head VARCHAR(150)    NULL                        COMMENT 'Name of department head / HOD',
    email           VARCHAR(255)    NULL                        COMMENT 'Department contact email',

    status          ENUM('active', 'inactive')
                                    NOT NULL DEFAULT 'active'   COMMENT 'Soft-enable flag',

    created_by      CHAR(36)        NULL                        COMMENT 'FK → users.user_id — who created this row',
    updated_by      CHAR(36)        NULL                        COMMENT 'FK → users.user_id — who last updated this row',

    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at      DATETIME        NULL                        COMMENT 'Soft-delete timestamp — NULL means not deleted',

    -- ── Constraints ────────────────────────────────────────────────────────
    PRIMARY KEY (department_id),
    UNIQUE KEY uq_departments_code_plant (department_code, plant_id)     COMMENT 'Code must be unique per plant',

    -- ── Foreign Keys ────────────────────────────────────────────────────────
    CONSTRAINT fk_departments_plant
        FOREIGN KEY (plant_id) REFERENCES plants (plant_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,

    -- ── Indexes ─────────────────────────────────────────────────────────────
    INDEX idx_departments_plant_id   (plant_id),
    INDEX idx_departments_status     (status),
    INDEX idx_departments_deleted_at (deleted_at)

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Departments within a plant. HSE records are scoped here.';


-- -----------------------------------------------------------------------------
-- Seed Data — CBL LU Sukkur Plant Departments
-- Uses INSERT IGNORE so it is safe to re-run without duplicates.
-- plant_id 'PLT-CBL-SKR-001' must exist in the plants table first.
-- -----------------------------------------------------------------------------

INSERT IGNORE INTO departments
    (department_id,                         plant_id,               department_name,                    department_code, department_head,            email,                          status)
VALUES
    ('DEP-HSE-001',                         'PLT-CBL-SKR-001',      'Health, Safety & Environment',     'HSE',           'HSE Manager',              'hse@cbl.com.pk',               'active'),
    ('DEP-PROD-001',                        'PLT-CBL-SKR-001',      'Production',                       'PROD',          'Production Manager',       'production@cbl.com.pk',        'active'),
    ('DEP-ENG-001',                         'PLT-CBL-SKR-001',      'Engineering',                      'ENG',           'Engineering Manager',      'engineering@cbl.com.pk',       'active'),
    ('DEP-ADMIN-001',                       'PLT-CBL-SKR-001',      'Administration',                   'ADMIN',         'Admin Manager',            'admin@cbl.com.pk',             'active'),
    ('DEP-HR-001',                          'PLT-CBL-SKR-001',      'Human Resources',                  'HR',            'HR Manager',               'hr@cbl.com.pk',                'active'),
    ('DEP-PROJ-001',                        'PLT-CBL-SKR-001',      'Projects',                         'PROJ',          'Projects Manager',         'projects@cbl.com.pk',          'active'),
    ('DEP-ESD-001',                         'PLT-CBL-SKR-001',      'Environment & Sustainability',     'ESD',           'ESD Manager',              'esd@cbl.com.pk',               'active'),
    ('DEP-QC-001',                          'PLT-CBL-SKR-001',      'Quality Control',                  'QC',            'QC Manager',               'qc@cbl.com.pk',                'active'),
    ('DEP-STORES-001',                      'PLT-CBL-SKR-001',      'Stores',                           'STORES',        'Stores Manager',           'stores@cbl.com.pk',            'active'),
    ('DEP-FIN-001',                         'PLT-CBL-SKR-001',      'Finance',                          'FIN',           'Finance Manager',          'finance@cbl.com.pk',           'active'),
    ('DEP-IT-001',                          'PLT-CBL-SKR-001',      'Information Technology',           'IT',            'IT Manager',               'it@cbl.com.pk',                'active');

-- -----------------------------------------------------------------------------
-- Verification Query (optional — comment out in CI)
-- -----------------------------------------------------------------------------

SELECT
    department_id,
    department_code,
    department_name,
    department_head,
    status
FROM departments
ORDER BY department_code;
