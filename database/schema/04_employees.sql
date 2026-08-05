-- =============================================================================
-- 04_employees.sql
-- CBL HSE Management System
-- Table: employees
-- Description: Central employee registry. This is one of the most referenced
--              tables in the system. Nearly every HSE module (hazards, incidents,
--              training, audits) uses employees as:
--              Reported By / Responsible Person / Trainer / Auditor /
--              Area Manager / Investigator / Reviewer / Approver
-- Depends on: 01_plants.sql, 02_departments.sql
-- Run: SOURCE database/schema/04_employees.sql;
-- =============================================================================

USE cbl_hse;

-- -----------------------------------------------------------------------------
-- Table Definition
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS employees (
    employee_id         CHAR(36)        NOT NULL DEFAULT (UUID())   COMMENT 'Primary key — UUID',

    -- ── Identity ──────────────────────────────────────────────────────────
    emp_code            VARCHAR(50)     NOT NULL                    COMMENT 'Human-readable employee number e.g. EMP-0001',
    full_name           VARCHAR(200)    NOT NULL                    COMMENT 'Full legal name',
    email               VARCHAR(255)    NOT NULL                    COMMENT 'Official company email',
    microsoft_email     VARCHAR(255)    NULL                        COMMENT 'Microsoft/Azure AD UPN used for SSO login',
    phone               VARCHAR(30)     NULL                        COMMENT 'Mobile / office phone number',
    cnic                VARCHAR(20)     NULL                        COMMENT 'Pakistan CNIC — format: 00000-0000000-0',
    profile_picture     VARCHAR(500)    NULL                        COMMENT 'Path or URL to profile photo',

    -- ── Organizational ────────────────────────────────────────────────────
    plant_id            CHAR(36)        NOT NULL                    COMMENT 'FK → plants.plant_id',
    department_id       CHAR(36)        NULL                        COMMENT 'FK → departments.department_id',
    designation         VARCHAR(150)    NULL                        COMMENT 'Job designation e.g. HSE Officer, Production Operator',
    reporting_manager   CHAR(36)        NULL                        COMMENT 'Self-referencing FK → employees.employee_id',

    -- ── Access & Role ─────────────────────────────────────────────────────
    role                VARCHAR(100)    NULL                        COMMENT 'System role label — will be replaced by RBAC tables (06-10)',

    -- ── Employment ────────────────────────────────────────────────────────
    joining_date        DATE            NULL                        COMMENT 'Date of joining the company',
    employment_type     ENUM('permanent', 'contract', 'intern', 'daily-wages')
                                        NOT NULL DEFAULT 'permanent',

    -- ── Status ────────────────────────────────────────────────────────────
    status              ENUM('active', 'inactive', 'resigned', 'terminated')
                                        NOT NULL DEFAULT 'active',

    -- ── Timestamps ────────────────────────────────────────────────────────
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- ── Constraints ────────────────────────────────────────────────────────
    PRIMARY KEY (employee_id),
    UNIQUE KEY uq_employees_emp_code        (emp_code),
    UNIQUE KEY uq_employees_email           (email),
    UNIQUE KEY uq_employees_cnic            (cnic),
    UNIQUE KEY uq_employees_microsoft_email (microsoft_email),

    -- ── Foreign Keys ────────────────────────────────────────────────────────
    CONSTRAINT fk_employees_plant
        FOREIGN KEY (plant_id) REFERENCES plants (plant_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,

    CONSTRAINT fk_employees_department
        FOREIGN KEY (department_id) REFERENCES departments (department_id)
        ON UPDATE CASCADE ON DELETE SET NULL,

    CONSTRAINT fk_employees_manager
        FOREIGN KEY (reporting_manager) REFERENCES employees (employee_id)
        ON UPDATE CASCADE ON DELETE SET NULL,

    -- ── Indexes ─────────────────────────────────────────────────────────────
    INDEX idx_employees_plant_id        (plant_id),
    INDEX idx_employees_department_id   (department_id),
    INDEX idx_employees_status          (status),
    INDEX idx_employees_reporting_mgr   (reporting_manager)

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Central employee registry — referenced by every HSE module.';


-- -----------------------------------------------------------------------------
-- Seed Data — Sample employees for CBL LU Sukkur Plant
-- Note: reporting_manager is NULL for seed records to avoid ordering issues.
--       Update after inserting all employees.
-- -----------------------------------------------------------------------------

INSERT IGNORE INTO employees
    (employee_id,       emp_code,       full_name,                  email,                              microsoft_email,                        phone,          department_id,      designation,                role,               joining_date,   employment_type,    status)
VALUES
    -- HSE Department
    ('EMP-HSE-001',     'EMP-0001',     'Ahmed Raza Khan',          'ahmed.raza@cbl.com.pk',            'ahmed.raza@cblindustries.onmicrosoft.com',  '0300-1234567', 'DEP-HSE-001',      'HSE Manager',              'hse_manager',      '2020-03-15',   'permanent',        'active'),
    ('EMP-HSE-002',     'EMP-0002',     'Sara Ali',                 'sara.ali@cbl.com.pk',              'sara.ali@cblindustries.onmicrosoft.com',    '0301-2345678', 'DEP-HSE-001',      'HSE Officer',              'hse_officer',      '2021-06-01',   'permanent',        'active'),
    ('EMP-HSE-003',     'EMP-0003',     'Bilal Hussain',            'bilal.hussain@cbl.com.pk',         'bilal.hussain@cblindustries.onmicrosoft.com','0302-3456789', 'DEP-HSE-001',      'HSE Officer',              'hse_officer',      '2022-01-10',   'permanent',        'active'),

    -- Production Department
    ('EMP-PROD-001',    'EMP-0004',     'Tariq Mehmood',            'tariq.mehmood@cbl.com.pk',         'tariq.mehmood@cblindustries.onmicrosoft.com','0303-4567890', 'DEP-PROD-001',     'Production Manager',       'dept_manager',     '2018-07-20',   'permanent',        'active'),
    ('EMP-PROD-002',    'EMP-0005',     'Usman Farooq',             'usman.farooq@cbl.com.pk',          'usman.farooq@cblindustries.onmicrosoft.com','0304-5678901', 'DEP-PROD-001',     'Production Supervisor',    'employee',         '2019-09-05',   'permanent',        'active'),
    ('EMP-PROD-003',    'EMP-0006',     'Amna Sheikh',              'amna.sheikh@cbl.com.pk',           'amna.sheikh@cblindustries.onmicrosoft.com', '0305-6789012', 'DEP-PROD-001',     'Production Operator',      'employee',         '2023-02-14',   'contract',         'active'),

    -- Engineering Department
    ('EMP-ENG-001',     'EMP-0007',     'Zafar Iqbal',              'zafar.iqbal@cbl.com.pk',           'zafar.iqbal@cblindustries.onmicrosoft.com', '0306-7890123', 'DEP-ENG-001',      'Engineering Manager',      'dept_manager',     '2017-11-30',   'permanent',        'active'),
    ('EMP-ENG-002',     'EMP-0008',     'Hamza Qureshi',            'hamza.qureshi@cbl.com.pk',         'hamza.qureshi@cblindustries.onmicrosoft.com','0307-8901234', 'DEP-ENG-001',      'Mechanical Engineer',      'employee',         '2021-04-22',   'permanent',        'active'),

    -- Administration
    ('EMP-ADMIN-001',   'EMP-0009',     'Nadia Mirza',              'nadia.mirza@cbl.com.pk',           'nadia.mirza@cblindustries.onmicrosoft.com', '0308-9012345', 'DEP-ADMIN-001',    'Admin Manager',            'dept_manager',     '2019-01-08',   'permanent',        'active'),

    -- HR Department
    ('EMP-HR-001',      'EMP-0010',     'Fatima Zahra',             'fatima.zahra@cbl.com.pk',          'fatima.zahra@cblindustries.onmicrosoft.com','0309-0123456', 'DEP-HR-001',       'HR Manager',               'dept_manager',     '2020-08-12',   'permanent',        'active'),

    -- QC Department
    ('EMP-QC-001',      'EMP-0011',     'Imran Siddiqui',           'imran.siddiqui@cbl.com.pk',        'imran.siddiqui@cblindustries.onmicrosoft.com','0310-1234567','DEP-QC-001',      'QC Manager',               'dept_manager',     '2018-05-25',   'permanent',        'active'),

    -- IT Department
    ('EMP-IT-001',      'EMP-0012',     'Ali Hassan',               'ali.hassan@cbl.com.pk',            'ali.hassan@cblindustries.onmicrosoft.com',  '0311-2345678', 'DEP-IT-001',       'IT Manager',               'dept_admin',       '2021-10-03',   'permanent',        'active');


-- -----------------------------------------------------------------------------
-- Update reporting managers after initial insert
-- -----------------------------------------------------------------------------

-- HSE Officers report to HSE Manager
UPDATE employees SET reporting_manager = 'EMP-HSE-001'  WHERE employee_id IN ('EMP-HSE-002', 'EMP-HSE-003');
-- Production team reports to Production Manager
UPDATE employees SET reporting_manager = 'EMP-PROD-001' WHERE employee_id IN ('EMP-PROD-002', 'EMP-PROD-003');
-- Engineering team reports to Engineering Manager
UPDATE employees SET reporting_manager = 'EMP-ENG-001'  WHERE employee_id = 'EMP-ENG-002';


-- -----------------------------------------------------------------------------
-- Verification Query
-- -----------------------------------------------------------------------------

SELECT
    e.emp_code,
    e.full_name,
    d.department_code,
    e.designation,
    e.employment_type,
    e.status,
    m.full_name AS reports_to
FROM employees e
LEFT JOIN departments  d ON e.department_id    = d.department_id
LEFT JOIN employees    m ON e.reporting_manager = m.employee_id
ORDER BY d.department_code, e.emp_code;
