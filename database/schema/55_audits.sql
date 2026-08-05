-- ==================================================
-- TABLE NAME
--   audits and audit_team_members
--
-- Purpose
--   Enterprise audit calendar and execution register with normalized audit-team
--   membership, scoring, results, and management reporting.
--
-- Relationships
--   audit_types, plants, departments, locations, employees, statuses, and users.
--
-- Indexes
--   Generated number, calendar, type/date, plant/date, department/date, lead auditor,
--   status/score, and team membership.
--
-- Workflow
--   Scheduled -> In Progress -> Report Pending -> Approved -> Closed.
--
-- Author
--   CBL HSE Database Architecture
--
-- Version
--   1.0.0 | Phase 7 | MySQL 8
-- ==================================================

USE cbl_hse;

CREATE TABLE IF NOT EXISTS audits (
    audit_id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    audit_number      VARCHAR(24) GENERATED ALWAYS AS (CONCAT('AUD-', YEAR(scheduled_date), '-', LPAD(audit_id, 5, '0'))) STORED,
    audit_type_id     BIGINT UNSIGNED NOT NULL,
    title             VARCHAR(250) NOT NULL,
    objective         TEXT NOT NULL,
    plant_id          CHAR(36) NOT NULL,
    department_id     CHAR(36) NULL,
    location_id       CHAR(36) NULL,
    lead_auditor_id   CHAR(36) NOT NULL,
    scheduled_date    DATE NOT NULL,
    actual_date       DATE NULL,
    start_time        TIME NULL,
    end_time          TIME NULL,
    status_id         BIGINT UNSIGNED NOT NULL DEFAULT 29 COMMENT 'FK -> statuses.status_id; audits module.',
    overall_score     DECIMAL(5,2) NULL,
    compliance_percent DECIMAL(5,2) NULL,
    result            ENUM('not_started', 'compliant', 'partially_compliant', 'non_compliant', 'not_applicable') NOT NULL DEFAULT 'not_started',
    remarks           TEXT NULL,
    created_by        BIGINT UNSIGNED NOT NULL,
    updated_by        BIGINT UNSIGNED NOT NULL,
    created_at        DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at        DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at        DATETIME(3) NULL,
    PRIMARY KEY (audit_id),
    UNIQUE KEY uq_audit_number (audit_number),
    CONSTRAINT chk_audit_times CHECK (end_time IS NULL OR start_time IS NULL OR end_time >= start_time),
    CONSTRAINT chk_audit_scores CHECK ((overall_score IS NULL OR overall_score BETWEEN 0 AND 100) AND (compliance_percent IS NULL OR compliance_percent BETWEEN 0 AND 100)),
    CONSTRAINT fk_audit_type FOREIGN KEY (audit_type_id) REFERENCES audit_types (audit_type_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_audit_plant FOREIGN KEY (plant_id) REFERENCES plants (plant_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_audit_department FOREIGN KEY (department_id) REFERENCES departments (department_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_audit_location FOREIGN KEY (location_id) REFERENCES locations (location_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_audit_lead FOREIGN KEY (lead_auditor_id) REFERENCES employees (employee_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_audit_status FOREIGN KEY (status_id) REFERENCES statuses (status_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_audit_created_by FOREIGN KEY (created_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_audit_updated_by FOREIGN KEY (updated_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_audit_calendar (scheduled_date, status_id),
    INDEX idx_audit_type_date (audit_type_id, scheduled_date),
    INDEX idx_audit_plant_date (plant_id, scheduled_date),
    INDEX idx_audit_department_date (department_id, scheduled_date),
    INDEX idx_audit_lead_date (lead_auditor_id, scheduled_date),
    INDEX idx_audit_score_result (compliance_percent, result),
    INDEX idx_audit_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Enterprise audit calendar and execution register.';

CREATE TABLE IF NOT EXISTS audit_team_members (
    audit_team_member_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    audit_id             BIGINT UNSIGNED NOT NULL,
    employee_id          CHAR(36) NOT NULL,
    team_role            ENUM('lead', 'auditor', 'technical_expert', 'observer') NOT NULL DEFAULT 'auditor',
    created_by           BIGINT UNSIGNED NOT NULL,
    updated_by           BIGINT UNSIGNED NOT NULL,
    created_at           DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at           DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at           DATETIME(3) NULL,
    PRIMARY KEY (audit_team_member_id),
    UNIQUE KEY uq_audit_team_member (audit_id, employee_id),
    CONSTRAINT fk_audit_team_audit FOREIGN KEY (audit_id) REFERENCES audits (audit_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_audit_team_employee FOREIGN KEY (employee_id) REFERENCES employees (employee_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_audit_team_created_by FOREIGN KEY (created_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_audit_team_updated_by FOREIGN KEY (updated_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_audit_team_employee (employee_id),
    INDEX idx_audit_team_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Normalized audit team membership.';

INSERT INTO audits
    (audit_type_id, title, objective, plant_id, department_id, location_id, lead_auditor_id, scheduled_date, actual_date, start_time, end_time, status_id, overall_score, compliance_percent, result, remarks, created_by, updated_by)
VALUES
    (4, 'ISO 45001 Internal Audit - Plant HSE System', 'Verify conformity and effectiveness of the occupational health and safety management system.', 'PLT-CBL-SKR-001', 'DEP-HSE-001', 'LOC-ADMIN', 'EMP-HSE-001', '2026-07-18', '2026-07-18', '09:00:00', '16:00:00', 33, 86.00, 86.00, 'partially_compliant', 'Two minor findings remain open.', 1, 1),
    (7, 'GMP Production and Hygiene Audit', 'Confirm production hygiene, GMP controls, and documented practices.', 'PLT-CBL-SKR-001', 'DEP-PROD-001', 'LOC-PROD-L1', 'EMP-HSE-002', '2026-08-08', '2026-08-08', '09:30:00', '14:30:00', 32, 92.00, 92.00, 'compliant', 'Strong housekeeping and hygiene performance.', 2, 2),
    (15, 'Electrical Safety Compliance Audit', 'Assess electrical isolation, labeling, inspection, and competency controls.', 'PLT-CBL-SKR-001', 'DEP-ENG-001', 'LOC-ELEC', 'EMP-HSE-003', '2026-08-20', NULL, NULL, NULL, 29, NULL, NULL, 'not_started', 'Planned after LOTO training completion.', 3, 3),
    (10, 'Quarterly Environmental Compliance Audit', 'Review environmental aspects, waste management, spills, and regulatory evidence.', 'PLT-CBL-SKR-001', 'DEP-ENG-001', 'LOC-BOILER', 'EMP-HSE-002', '2026-09-05', NULL, NULL, NULL, 29, NULL, NULL, 'not_started', 'Regulatory register evidence to be sampled.', 2, 2),
    (16, 'Warehouse Safety and Traffic Audit', 'Evaluate storage, forklift traffic, rack integrity, and pedestrian controls.', 'PLT-CBL-SKR-001', 'DEP-STORES-001', 'LOC-WH', 'EMP-HSE-003', '2026-07-29', '2026-07-29', '08:00:00', '12:00:00', 33, 78.00, 78.00, 'partially_compliant', 'Traffic segregation and temporary storage findings raised.', 3, 3);

INSERT INTO audit_team_members (audit_id, employee_id, team_role, created_by, updated_by)
VALUES
    (1, 'EMP-HSE-001', 'lead', 1, 1),
    (2, 'EMP-HSE-002', 'lead', 2, 2),
    (3, 'EMP-HSE-003', 'lead', 3, 3),
    (4, 'EMP-HSE-002', 'lead', 2, 2),
    (5, 'EMP-HSE-003', 'lead', 3, 3);

SELECT audit_id, audit_number, title, scheduled_date, status_id, compliance_percent, result
FROM audits WHERE deleted_at IS NULL ORDER BY scheduled_date;
