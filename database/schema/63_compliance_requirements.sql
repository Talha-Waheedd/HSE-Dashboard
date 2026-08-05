-- ==================================================
-- TABLE NAME
--   compliance_requirements
--
-- Purpose
--   Legal, regulatory, ISO, GMP, HACCP, OSHA, and other compliance obligation
--   register with ownership, review frequency, status, and evidence.
--
-- Relationships
--   departments, employees as owners, and users.
--
-- Indexes
--   Authority/clause, department/status, next review, owner, compliance heatmap, deletion.
--
-- Workflow
--   Active -> Under Review -> Compliant/Partially Compliant/Non-Compliant -> Retired.
--
-- Author
--   CBL HSE Database Architecture
--
-- Version
--   1.0.0 | Phase 7 | MySQL 8
-- ==================================================

USE cbl_hse;

CREATE TABLE IF NOT EXISTS compliance_requirements (
    requirement_id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    law                        VARCHAR(255) NOT NULL,
    regulation                 VARCHAR(255) NULL,
    iso_clause                 VARCHAR(100) NULL,
    authority                  VARCHAR(255) NOT NULL,
    department_id              CHAR(36) NULL,
    compliance_requirement     TEXT NOT NULL,
    review_frequency           ENUM('monthly', 'quarterly', 'semi_annual', 'annual', 'ad_hoc') NOT NULL,
    next_review_date           DATE NOT NULL,
    owner_id                   CHAR(36) NOT NULL,
    status                     ENUM('active', 'under_review', 'compliant', 'partially_compliant', 'non_compliant', 'retired') NOT NULL DEFAULT 'active',
    evidence                   TEXT NULL,
    created_by                 BIGINT UNSIGNED NOT NULL,
    updated_by                 BIGINT UNSIGNED NOT NULL,
    created_at                 DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at                 DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at                 DATETIME(3) NULL,
    PRIMARY KEY (requirement_id),
    CONSTRAINT fk_compliance_department FOREIGN KEY (department_id) REFERENCES departments (department_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_compliance_owner FOREIGN KEY (owner_id) REFERENCES employees (employee_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_compliance_created_by FOREIGN KEY (created_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_compliance_updated_by FOREIGN KEY (updated_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_compliance_authority_clause (authority, iso_clause),
    INDEX idx_compliance_department_status (department_id, status),
    INDEX idx_compliance_next_review (next_review_date, status),
    INDEX idx_compliance_owner (owner_id, next_review_date),
    INDEX idx_compliance_heatmap (status, review_frequency),
    INDEX idx_compliance_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Enterprise legal, regulatory, ISO, GMP, HACCP, and OSHA compliance register.';

INSERT INTO compliance_requirements
    (law, regulation, iso_clause, authority, department_id, compliance_requirement, review_frequency, next_review_date, owner_id, status, evidence, created_by, updated_by)
VALUES
    ('Occupational Safety and Health Act', 'OSHA 29 CFR 1910.147', NULL, 'U.S. OSHA benchmark / corporate standard', 'DEP-ENG-001', 'Energy control procedures must be documented, authorized, and verified.', 'quarterly', '2026-09-30', 'EMP-ENG-001', 'partially_compliant', 'hse/compliance/loto-procedure-and-audit.pdf', 1, 1),
    ('Occupational Health and Safety Management Systems', NULL, 'ISO 45001:8.1', 'ISO', 'DEP-HSE-001', 'Operational planning and control must manage hazards and risks.', 'annual', '2026-12-15', 'EMP-HSE-001', 'compliant', 'hse/compliance/iso45001-operational-control-review.pdf', 1, 1),
    ('Environmental Management Systems', NULL, 'ISO 14001:6.1.3', 'ISO', 'DEP-ENG-001', 'Applicable legal and other environmental requirements must be identified and evaluated.', 'quarterly', '2026-09-15', 'EMP-HSE-002', 'under_review', 'hse/compliance/environmental-register.xlsx', 2, 2),
    ('Food Safety Management', 'HACCP Codex Principles', NULL, 'Codex Alimentarius / CBL Quality', 'DEP-PROD-001', 'Critical control points and monitoring records must be maintained.', 'monthly', '2026-09-01', 'EMP-PROD-001', 'compliant', 'quality/compliance/haccp-monitoring-records.pdf', 4, 4),
    ('Quality Management Systems', NULL, 'ISO 9001:7.2', 'ISO', 'DEP-QC-001', 'Personnel competence must be determined, maintained, and evidenced.', 'annual', '2027-01-15', 'EMP-HSE-001', 'partially_compliant', 'quality/compliance/competency-matrix.xlsx', 1, 1);

SELECT requirement_id, law, regulation, iso_clause, authority, status, next_review_date
FROM compliance_requirements WHERE deleted_at IS NULL ORDER BY next_review_date;
