-- ==================================================
-- TABLE NAME
--   employee_competencies
--
-- Purpose
--   Competency matrix for employee skills, required/current level, gap, expiry,
--   and assessment ownership. Supports role readiness and compliance dashboards.
--
-- Relationships
--   employees as subjects/assessors and users as audit owners.
--
-- Indexes
--   Employee/skill, department via employee joins, gap/expiry, assessor/date, deletion.
--
-- Workflow
--   Assessed -> Gap identified -> Development planned -> Reassessed/Expired.
--
-- Author
--   CBL HSE Database Architecture
--
-- Version
--   1.0.0 | Phase 6 | MySQL 8
-- ==================================================

USE cbl_hse;

CREATE TABLE IF NOT EXISTS employee_competencies (
    competency_id      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    employee_id        CHAR(36) NOT NULL,
    skill              VARCHAR(200) NOT NULL,
    competency_level   ENUM('awareness', 'basic', 'intermediate', 'advanced', 'expert') NOT NULL,
    required_level     ENUM('awareness', 'basic', 'intermediate', 'advanced', 'expert') NOT NULL,
    current_level      ENUM('awareness', 'basic', 'intermediate', 'advanced', 'expert') NOT NULL,
    gap                TINYINT NOT NULL COMMENT 'Calculated ordinal gap: required level minus current level.',
    assessment_date    DATE NOT NULL,
    assessed_by        CHAR(36) NOT NULL,
    expiry_date        DATE NULL,
    remarks            TEXT NULL,
    created_by         BIGINT UNSIGNED NOT NULL,
    updated_by         BIGINT UNSIGNED NOT NULL,
    created_at         DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at         DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at         DATETIME(3) NULL,

    PRIMARY KEY (competency_id),
    UNIQUE KEY uq_employee_competency_skill (employee_id, skill),
    CONSTRAINT chk_employee_competency_gap CHECK (gap BETWEEN -4 AND 4),
    CONSTRAINT chk_employee_competency_expiry CHECK (expiry_date IS NULL OR expiry_date >= assessment_date),
    CONSTRAINT fk_employee_competency_employee FOREIGN KEY (employee_id) REFERENCES employees (employee_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_employee_competency_assessor FOREIGN KEY (assessed_by) REFERENCES employees (employee_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_employee_competency_created_by FOREIGN KEY (created_by) REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_employee_competency_updated_by FOREIGN KEY (updated_by) REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_employee_competency_employee_skill (employee_id, skill),
    INDEX idx_employee_competency_gap_expiry (gap, expiry_date),
    INDEX idx_employee_competency_assessor_date (assessed_by, assessment_date),
    INDEX idx_employee_competency_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Employee competency matrix for training and operational readiness.';

INSERT INTO employee_competencies
    (employee_id, skill, competency_level, required_level, current_level, gap, assessment_date, assessed_by, expiry_date, remarks, created_by, updated_by)
VALUES
    ('EMP-PROD-003', 'Machine guarding inspection', 'basic', 'advanced', 'basic', 2, '2026-07-15', 'EMP-PROD-001', '2027-07-15', 'Gap linked to machine safety TNA.', 4, 4),
    ('EMP-ENG-002', 'Lockout tagout', 'advanced', 'advanced', 'advanced', 0, '2026-08-20', 'EMP-ENG-001', '2027-08-19', 'Competency verified through practical assessment.', 7, 7),
    ('EMP-PROD-002', 'Safety leadership', 'intermediate', 'advanced', 'intermediate', 1, '2026-08-02', 'EMP-HSE-001', '2028-08-02', 'Development plan includes leadership training.', 4, 1),
    ('EMP-HSE-003', 'Emergency response coordination', 'advanced', 'advanced', 'advanced', 0, '2026-07-20', 'EMP-HSE-001', '2027-07-20', 'Annual drill performance satisfactory.', 2, 1),
    ('EMP-ENG-001', 'ISO 9001 risk-based thinking', 'basic', 'intermediate', 'basic', 1, '2026-08-03', 'EMP-HSE-001', NULL, 'TNA request submitted for October.', 7, 1);

SELECT competency_id, employee_id, skill, required_level, current_level, gap, expiry_date
FROM employee_competencies WHERE deleted_at IS NULL ORDER BY employee_id, skill;
