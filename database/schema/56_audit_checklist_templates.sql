-- ==================================================
-- TABLE NAME
--   audit_checklist_templates
--
-- Purpose
--   Version-controlled reusable checklist templates for audits and inspections.
--
-- Relationships
--   audit_types, departments, employees as approvers, and users.
--
-- Indexes
--   Audit type/status, department/version, approval queue, revision, deletion.
--
-- Workflow
--   Draft -> Pending Approval -> Approved -> Retired.
--
-- Author
--   CBL HSE Database Architecture
--
-- Version
--   1.0.0 | Phase 7 | MySQL 8
-- ==================================================

USE cbl_hse;

CREATE TABLE IF NOT EXISTS audit_checklist_templates (
    checklist_template_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    template_name        VARCHAR(200) NOT NULL,
    audit_type_id        BIGINT UNSIGNED NOT NULL,
    version_number       DECIMAL(5,2) NOT NULL DEFAULT 1.00,
    department_id        CHAR(36) NULL,
    description          TEXT NULL,
    status               ENUM('draft', 'pending_approval', 'approved', 'retired') NOT NULL DEFAULT 'draft',
    revision_number      SMALLINT UNSIGNED NOT NULL DEFAULT 1,
    approved_by          CHAR(36) NULL,
    approval_date        DATETIME(3) NULL,
    created_by           BIGINT UNSIGNED NOT NULL,
    updated_by           BIGINT UNSIGNED NOT NULL,
    created_at           DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at           DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at           DATETIME(3) NULL,
    PRIMARY KEY (checklist_template_id),
    UNIQUE KEY uq_audit_template_version (template_name, version_number),
    CONSTRAINT chk_audit_template_revision CHECK (version_number > 0 AND revision_number > 0),
    CONSTRAINT chk_audit_template_approval CHECK (status NOT IN ('approved', 'retired') OR (approved_by IS NOT NULL AND approval_date IS NOT NULL)),
    CONSTRAINT fk_audit_template_type FOREIGN KEY (audit_type_id) REFERENCES audit_types (audit_type_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_audit_template_department FOREIGN KEY (department_id) REFERENCES departments (department_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_audit_template_approver FOREIGN KEY (approved_by) REFERENCES employees (employee_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_audit_template_created_by FOREIGN KEY (created_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_audit_template_updated_by FOREIGN KEY (updated_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_audit_template_type_status (audit_type_id, status),
    INDEX idx_audit_template_department_version (department_id, version_number),
    INDEX idx_audit_template_approval (status, approval_date),
    INDEX idx_audit_template_revision (revision_number),
    INDEX idx_audit_template_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Reusable, approved, and version-controlled audit checklist templates.';

INSERT INTO audit_checklist_templates
    (checklist_template_id, template_name, audit_type_id, version_number, department_id, description, status, revision_number, approved_by, approval_date, created_by, updated_by)
VALUES
    (1, 'ISO 45001 HSE Management System Checklist', 4, 2.00, 'DEP-HSE-001', 'Clauses, operational controls, consultation, incident learning, and improvement.', 'approved', 2, 'EMP-HSE-001', '2026-06-15 10:00:00.000', 1, 1),
    (2, 'GMP Production Hygiene Checklist', 7, 3.00, 'DEP-PROD-001', 'Hygiene, sanitation, personnel practices, and documented GMP controls.', 'approved', 3, 'EMP-HSE-001', '2026-06-20 10:00:00.000', 1, 1),
    (3, 'Electrical Safety Checklist', 15, 1.00, 'DEP-ENG-001', 'Isolation, labeling, inspection, competency, and emergency controls.', 'pending_approval', 1, NULL, NULL, 3, 3),
    (4, 'Environmental Compliance Checklist', 10, 2.00, 'DEP-ENG-001', 'Aspects, waste, emissions, spills, monitoring, and legal evidence.', 'approved', 2, 'EMP-HSE-001', '2026-06-25 10:00:00.000', 2, 1),
    (5, 'Warehouse Traffic and Storage Checklist', 16, 1.00, 'DEP-STORES-001', 'Racks, traffic, housekeeping, pedestrian controls, and forklift safety.', 'approved', 1, 'EMP-HSE-003', '2026-07-01 10:00:00.000', 3, 3);

SELECT checklist_template_id, template_name, version_number, status, revision_number
FROM audit_checklist_templates WHERE deleted_at IS NULL ORDER BY checklist_template_id;
