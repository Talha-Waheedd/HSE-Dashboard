-- =============================================================================
-- 05_contractors.sql
-- CBL HSE Management System
-- Table: contractors
-- Description: External contractor / vendor registry. Referenced by Hazards
--              and Incidents whenever "Contractor Involved" is selected.
--              A single contractor company may have multiple contact persons
--              but is stored as one record here for simplicity at Phase 1.
-- Depends on: 01_plants.sql
-- Run: SOURCE database/schema/05_contractors.sql;
-- =============================================================================

USE cbl_hse;

-- -----------------------------------------------------------------------------
-- Table Definition
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS contractors (
    contractor_id       CHAR(36)        NOT NULL DEFAULT (UUID())   COMMENT 'Primary key — UUID',

    -- ── Company Details ───────────────────────────────────────────────────
    company_name        VARCHAR(255)    NOT NULL                    COMMENT 'Official registered company / vendor name',
    company_ntn         VARCHAR(50)     NULL                        COMMENT 'National Tax Number (NTN) for official records',

    -- ── Primary Contact Person ────────────────────────────────────────────
    contact_person      VARCHAR(200)    NOT NULL                    COMMENT 'Name of primary contact / site representative',
    phone               VARCHAR(30)     NULL                        COMMENT 'Contact mobile / office number',
    email               VARCHAR(255)    NULL                        COMMENT 'Contact email address',

    -- ── Assignment ────────────────────────────────────────────────────────
    plant_id            CHAR(36)        NULL                        COMMENT 'FK → plants.plant_id — which plant this contractor operates in',
    work_area           VARCHAR(200)    NULL                        COMMENT 'Area or scope of work e.g. Civil, Electrical, Housekeeping',

    -- ── Contract Validity ─────────────────────────────────────────────────
    contract_start_date DATE            NULL                        COMMENT 'Contract start date',
    contract_end_date   DATE            NULL                        COMMENT 'Contract expiry date',

    -- ── Status ────────────────────────────────────────────────────────────
    status              ENUM('active', 'inactive', 'blacklisted')
                                        NOT NULL DEFAULT 'active'   COMMENT 'active = on-site, blacklisted = banned',

    -- ── Timestamps ────────────────────────────────────────────────────────
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- ── Constraints ────────────────────────────────────────────────────────
    PRIMARY KEY (contractor_id),
    UNIQUE KEY uq_contractors_company_plant (company_name, plant_id)      COMMENT 'Same company unique per plant',

    -- ── Foreign Keys ────────────────────────────────────────────────────────
    CONSTRAINT fk_contractors_plant
        FOREIGN KEY (plant_id) REFERENCES plants (plant_id)
        ON UPDATE CASCADE ON DELETE SET NULL,

    -- ── Indexes ─────────────────────────────────────────────────────────────
    INDEX idx_contractors_plant_id  (plant_id),
    INDEX idx_contractors_status    (status)

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='External contractors and vendors. Referenced when contractor is involved in an HSE event.';


-- -----------------------------------------------------------------------------
-- Seed Data — Sample contractors for CBL LU Sukkur Plant
-- -----------------------------------------------------------------------------

INSERT IGNORE INTO contractors
    (contractor_id,     company_name,                           contact_person,         phone,          email,                              plant_id,           work_area,                          contract_start_date, contract_end_date,  status)
VALUES
    ('CON-001',         'Al-Hamza Civil Works',                 'Muhammad Hamza',       '0321-1111111', 'hamza@alhamzacivil.com',           'PLT-CBL-SKR-001',  'Civil Works & Construction',       '2025-01-01',       '2026-12-31',       'active'),
    ('CON-002',         'Pak Electrical Solutions',             'Rizwan Ahmed',         '0322-2222222', 'rizwan@pakelectrical.com',         'PLT-CBL-SKR-001',  'Electrical Installation & Repair', '2025-03-01',       '2026-02-28',       'active'),
    ('CON-003',         'National Housekeeping Services',       'Sarfraz Khan',         '0333-3333333', 'sarfraz@nhs.com.pk',               'PLT-CBL-SKR-001',  'Housekeeping & Sanitation',        '2024-07-01',       '2025-06-30',       'active'),
    ('CON-004',         'SafePak Industrial Safety',            'Dr. Asif Malik',       '0344-4444444', 'asif@safepak.com',                 'PLT-CBL-SKR-001',  'Safety Equipment & Training',      '2025-01-15',       '2025-12-31',       'active'),
    ('CON-005',         'Sukkur Mechanical Services',           'Ghulam Mustafa',       '0355-5555555', 'mustafa@sukkurmech.com',           'PLT-CBL-SKR-001',  'Mechanical Maintenance',           '2024-09-01',       '2025-08-31',       'active'),
    ('CON-006',         'Green Waste Management Co.',           'Imtiaz Brohi',         '0366-6666666', 'imtiaz@greenwaste.pk',             'PLT-CBL-SKR-001',  'Waste Disposal & Environment',     '2025-02-01',       '2026-01-31',       'active'),
    ('CON-007',         'Fast IT Solutions',                    'Kashif Nawaz',         '0377-7777777', 'kashif@fastitpk.com',              'PLT-CBL-SKR-001',  'IT Infrastructure & Support',      '2025-04-01',       '2025-09-30',       'inactive');


-- -----------------------------------------------------------------------------
-- Verification Query
-- -----------------------------------------------------------------------------

SELECT
    contractor_id,
    company_name,
    contact_person,
    phone,
    work_area,
    status,
    contract_end_date
FROM contractors
ORDER BY status, company_name;
