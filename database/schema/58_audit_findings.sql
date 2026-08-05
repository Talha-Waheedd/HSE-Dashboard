-- ==================================================
-- TABLE NAME
--   audit_findings
--
-- Purpose
--   Records observations, non-conformities, opportunities, and best practices
--   identified during audits, with risk, ownership, evidence, and status.
--
-- Relationships
--   audits, departments, employees, risk_ratings, users, and future CAPA linkage.
--
-- Indexes
--   Audit/type, department/status, owner/due date, risk/severity, open/overdue dashboards.
--
-- Workflow
--   Open -> Assigned -> In Progress -> Pending Verification -> Closed or Rejected.
--
-- Author
--   CBL HSE Database Architecture
--
-- Version
--   1.0.0 | Phase 7 | MySQL 8
-- ==================================================

USE cbl_hse;

CREATE TABLE IF NOT EXISTS audit_findings (
    finding_id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    finding_number      VARCHAR(30) GENERATED ALWAYS AS (CONCAT('FND-', YEAR(created_at), '-', LPAD(finding_id, 6, '0'))) STORED,
    audit_id             BIGINT UNSIGNED NOT NULL,
    finding_type         ENUM('observation', 'minor_nc', 'major_nc', 'critical_nc', 'ofi', 'best_practice') NOT NULL,
    risk_rating_id       BIGINT UNSIGNED NULL,
    severity             ENUM('low', 'medium', 'high', 'critical') NOT NULL,
    description          TEXT NOT NULL,
    evidence             TEXT NULL,
    department_id        CHAR(36) NULL,
    responsible_person_id CHAR(36) NULL,
    status               ENUM('open', 'assigned', 'in_progress', 'pending_verification', 'closed', 'rejected') NOT NULL DEFAULT 'open',
    due_date             DATE NULL,
    closure_date         DATE NULL,
    remarks              TEXT NULL,
    created_by           BIGINT UNSIGNED NOT NULL,
    updated_by           BIGINT UNSIGNED NOT NULL,
    created_at           DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at           DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at           DATETIME(3) NULL,
    PRIMARY KEY (finding_id),
    UNIQUE KEY uq_audit_finding_number (finding_number),
    CONSTRAINT chk_audit_finding_dates CHECK (closure_date IS NULL OR due_date IS NULL OR closure_date >= due_date),
    CONSTRAINT fk_audit_finding_audit FOREIGN KEY (audit_id) REFERENCES audits (audit_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_audit_finding_risk FOREIGN KEY (risk_rating_id) REFERENCES risk_ratings (risk_rating_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_audit_finding_department FOREIGN KEY (department_id) REFERENCES departments (department_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_audit_finding_owner FOREIGN KEY (responsible_person_id) REFERENCES employees (employee_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_audit_finding_created_by FOREIGN KEY (created_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_audit_finding_updated_by FOREIGN KEY (updated_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_audit_finding_audit_type (audit_id, finding_type),
    INDEX idx_audit_finding_department_status (department_id, status),
    INDEX idx_audit_finding_owner_due (responsible_person_id, due_date),
    INDEX idx_audit_finding_risk_severity (risk_rating_id, severity),
    INDEX idx_audit_finding_open_due (status, due_date),
    INDEX idx_audit_finding_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Audit observations, non-conformities, opportunities, and best practices.';

INSERT INTO audit_findings
    (audit_id, finding_type, risk_rating_id, severity, description, evidence, department_id, responsible_person_id, status, due_date, closure_date, remarks, created_by, updated_by)
VALUES
    (1, 'minor_nc', 3, 'medium', 'HSE objective review evidence was not available for one department KPI.', 'Objective tracker and meeting minutes sampled on 18 July.', 'DEP-HSE-001', 'EMP-HSE-001', 'in_progress', '2026-08-15', NULL, 'Owner preparing updated KPI review pack.', 1, 1),
    (1, 'observation', 4, 'low', 'Contractor induction records were complete but stored in two locations.', 'Sample of five contractor files.', 'DEP-HSE-001', 'EMP-HSE-002', 'closed', '2026-07-25', '2026-07-24', 'Single controlled folder established.', 1, 2),
    (2, 'best_practice', 5, 'low', 'Production operators used visual hygiene prompts effectively at line entry.', 'Photographic evidence and supervisor interview.', 'DEP-PROD-001', 'EMP-PROD-001', 'closed', '2026-08-15', '2026-08-08', 'Practice recommended for other departments.', 2, 2),
    (5, 'major_nc', 2, 'high', 'Temporary warehouse pallets reduced the marked forklift aisle width.', 'Warehouse walk-through photographs and layout sketch.', 'DEP-STORES-001', 'EMP-PROD-001', 'open', '2026-08-10', NULL, 'CAPA required before audit closure.', 3, 3),
    (5, 'ofi', 3, 'medium', 'Pedestrian route signage could be improved at the south warehouse entrance.', 'Safety walk observation.', 'DEP-STORES-001', 'EMP-HSE-003', 'assigned', '2026-08-20', NULL, 'Review during next warehouse inspection.', 3, 3);

SELECT finding_id, finding_number, audit_id, finding_type, severity, status, due_date
FROM audit_findings WHERE deleted_at IS NULL ORDER BY audit_id, finding_id;
