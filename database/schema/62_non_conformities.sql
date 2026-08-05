-- ==================================================
-- TABLE NAME
--   non_conformities
--
-- Purpose
--   Central non-conformance register for audits, inspections, incidents, and
--   regulatory sources, supporting ownership, risk, due dates, and closure.
--
-- Relationships
--   audits, inspections, departments, employees, risk_ratings, and users.
--
-- Indexes
--   Source, department/status, owner/due date, severity/risk, overdue closure queues.
--
-- Workflow
--   Open -> Assigned -> In Progress -> Pending Verification -> Closed/Reopened.
--
-- Author
--   CBL HSE Database Architecture
--
-- Version
--   1.0.0 | Phase 7 | MySQL 8
-- ==================================================

USE cbl_hse;

CREATE TABLE IF NOT EXISTS non_conformities (
    non_conformity_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    nc_number         VARCHAR(30) GENERATED ALWAYS AS (CONCAT('NC-', YEAR(created_at), '-', LPAD(non_conformity_id, 6, '0'))) STORED,
    source            ENUM('audit', 'inspection', 'incident', 'regulatory_review', 'customer', 'internal_observation') NOT NULL,
    audit_id          BIGINT UNSIGNED NULL,
    inspection_id     BIGINT UNSIGNED NULL,
    department_id     CHAR(36) NULL,
    description       TEXT NOT NULL,
    category          ENUM('system', 'process', 'equipment', 'people', 'legal', 'documentation', 'environmental', 'quality') NOT NULL,
    severity          ENUM('minor', 'major', 'critical') NOT NULL,
    risk_rating_id    BIGINT UNSIGNED NULL,
    status            ENUM('open', 'assigned', 'in_progress', 'pending_verification', 'closed', 'reopened') NOT NULL DEFAULT 'open',
    owner_id          CHAR(36) NULL,
    due_date          DATE NULL,
    closure_date      DATE NULL,
    remarks           TEXT NULL,
    created_by        BIGINT UNSIGNED NOT NULL,
    updated_by        BIGINT UNSIGNED NOT NULL,
    created_at        DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at        DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at        DATETIME(3) NULL,
    PRIMARY KEY (non_conformity_id),
    UNIQUE KEY uq_non_conformity_number (nc_number),
    CONSTRAINT chk_nc_source CHECK ((source = 'audit' AND audit_id IS NOT NULL) OR (source = 'inspection' AND inspection_id IS NOT NULL) OR source NOT IN ('audit', 'inspection')),
    CONSTRAINT chk_nc_dates CHECK (closure_date IS NULL OR due_date IS NULL OR closure_date >= due_date),
    CONSTRAINT fk_nc_audit FOREIGN KEY (audit_id) REFERENCES audits (audit_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_nc_inspection FOREIGN KEY (inspection_id) REFERENCES inspections (inspection_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_nc_department FOREIGN KEY (department_id) REFERENCES departments (department_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_nc_risk FOREIGN KEY (risk_rating_id) REFERENCES risk_ratings (risk_rating_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_nc_owner FOREIGN KEY (owner_id) REFERENCES employees (employee_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_nc_created_by FOREIGN KEY (created_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_nc_updated_by FOREIGN KEY (updated_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_nc_source_case (source, audit_id, inspection_id),
    INDEX idx_nc_department_status (department_id, status),
    INDEX idx_nc_owner_due (owner_id, due_date),
    INDEX idx_nc_severity_risk (severity, risk_rating_id),
    INDEX idx_nc_open_due (status, due_date),
    INDEX idx_nc_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Central enterprise non-conformance and closure register.';

INSERT INTO non_conformities
    (source, audit_id, inspection_id, department_id, description, category, severity, risk_rating_id, status, owner_id, due_date, closure_date, remarks, created_by, updated_by)
VALUES
    ('audit', 1, NULL, 'DEP-HSE-001', 'HSE objective review evidence was incomplete for one department KPI.', 'documentation', 'minor', 3, 'in_progress', 'EMP-HSE-001', '2026-08-15', NULL, 'Corrective action in progress.', 1, 1),
    ('inspection', NULL, 2, 'DEP-ENG-001', 'Machine guard fastener was loose during workshop inspection.', 'equipment', 'major', 2, 'assigned', 'EMP-ENG-001', '2026-08-09', NULL, 'Maintenance work order raised.', 3, 3),
    ('audit', 5, NULL, 'DEP-STORES-001', 'Temporary pallets reduced the marked forklift aisle width.', 'process', 'major', 2, 'open', 'EMP-PROD-001', '2026-08-10', NULL, 'Requires traffic-layout approval.', 3, 3),
    ('inspection', NULL, 4, 'DEP-STORES-001', 'Warehouse rack protection showed impact damage.', 'equipment', 'minor', 3, 'closed', 'EMP-PROD-001', '2026-08-08', '2026-08-07', 'Protection replaced and photographed.', 2, 2),
    ('regulatory_review', NULL, NULL, 'DEP-HSE-001', 'Emergency drill evidence did not include one contractor attendance sheet.', 'legal', 'minor', 3, 'pending_verification', 'EMP-HSE-002', '2026-08-20', NULL, 'Evidence requested from contractor coordinator.', 1, 1);

SELECT non_conformity_id, nc_number, source, severity, status, due_date, closure_date
FROM non_conformities WHERE deleted_at IS NULL ORDER BY non_conformity_id;
