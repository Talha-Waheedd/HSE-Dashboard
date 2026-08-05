-- ==================================================
-- TABLE NAME
--   audit_types
--
-- Purpose
--   Master catalog for internal, external, regulatory, management-system,
--   GMP/HACCP, safety, environmental, and operational audits.
--
-- Relationships
--   Referenced by audits and audit_checklist_templates. Audit ownership references users.
--
-- Indexes
--   Unique code/name, mandatory/risk queues, active ordering, frequency, soft deletion.
--
-- Workflow
--   Active types are schedulable; retired types remain for historical reporting.
--
-- Author
--   CBL HSE Database Architecture
--
-- Version
--   1.0.0 | Phase 7 | MySQL 8
-- ==================================================

USE cbl_hse;

CREATE TABLE IF NOT EXISTS audit_types (
    audit_type_id   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    audit_code      VARCHAR(40) NOT NULL,
    audit_name      VARCHAR(150) NOT NULL,
    frequency       ENUM('ad_hoc', 'daily', 'weekly', 'monthly', 'quarterly', 'semi_annual', 'annual', 'triennial') NOT NULL,
    mandatory       BOOLEAN NOT NULL DEFAULT FALSE,
    risk_level      ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'medium',
    description     VARCHAR(600) NULL,
    display_order   SMALLINT UNSIGNED NOT NULL DEFAULT 999,
    status          ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    created_by      BIGINT UNSIGNED NULL,
    updated_by      BIGINT UNSIGNED NULL,
    created_at      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at      DATETIME(3) NULL,
    PRIMARY KEY (audit_type_id),
    UNIQUE KEY uq_audit_type_code (audit_code),
    UNIQUE KEY uq_audit_type_name (audit_name),
    CONSTRAINT fk_audit_type_created_by FOREIGN KEY (created_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_audit_type_updated_by FOREIGN KEY (updated_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_audit_type_active_order (status, display_order),
    INDEX idx_audit_type_mandatory_risk (mandatory, risk_level),
    INDEX idx_audit_type_frequency (frequency, status),
    INDEX idx_audit_type_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Audit classification and frequency master.';

INSERT INTO audit_types
    (audit_type_id, audit_code, audit_name, frequency, mandatory, risk_level, description, display_order, status, created_by, updated_by)
VALUES
    (1, 'INTERNAL', 'Internal Audit', 'quarterly', TRUE, 'high', 'First-party management-system and operational audit.', 1, 'active', 1, 1),
    (2, 'EXTERNAL', 'External Audit', 'annual', TRUE, 'high', 'Customer, certification, or independent third-party audit.', 2, 'active', 1, 1),
    (3, 'SUPPLIER', 'Supplier Audit', 'annual', FALSE, 'medium', 'Audit of supplier quality, HSE, and service controls.', 3, 'active', 1, 1),
    (4, 'ISO45001', 'ISO 45001', 'annual', TRUE, 'high', 'Occupational health and safety management-system audit.', 4, 'active', 1, 1),
    (5, 'ISO9001', 'ISO 9001', 'annual', TRUE, 'medium', 'Quality management-system audit.', 5, 'active', 1, 1),
    (6, 'ISO14001', 'ISO 14001', 'annual', TRUE, 'high', 'Environmental management-system audit.', 6, 'active', 1, 1),
    (7, 'GMP', 'GMP', 'quarterly', TRUE, 'high', 'Good manufacturing practice audit.', 7, 'active', 1, 1),
    (8, 'HACCP', 'HACCP', 'quarterly', TRUE, 'high', 'Hazard analysis and critical control point audit.', 8, 'active', 1, 1),
    (9, 'FOOD', 'Food Safety', 'monthly', TRUE, 'high', 'Food safety and hygiene verification audit.', 9, 'active', 1, 1),
    (10, 'ENV', 'Environmental', 'quarterly', TRUE, 'high', 'Environmental aspects, impacts, and controls audit.', 10, 'active', 1, 1),
    (11, 'CONTRACTOR', 'Contractor', 'monthly', TRUE, 'high', 'Contractor HSE performance and compliance audit.', 11, 'active', 1, 1),
    (12, 'DEPARTMENT', 'Department', 'quarterly', FALSE, 'medium', 'Department-level compliance and control audit.', 12, 'active', 1, 1),
    (13, 'MACHINE', 'Machine', 'monthly', TRUE, 'high', 'Machine guarding and safe-operation audit.', 13, 'active', 1, 1),
    (14, 'FIRE', 'Fire', 'quarterly', TRUE, 'critical', 'Fire prevention, protection, and emergency-readiness audit.', 14, 'active', 1, 1),
    (15, 'ELECTRICAL', 'Electrical', 'quarterly', TRUE, 'critical', 'Electrical safety and isolation audit.', 15, 'active', 1, 1),
    (16, 'WAREHOUSE', 'Warehouse', 'monthly', FALSE, 'medium', 'Warehouse storage, traffic, and material-control audit.', 16, 'active', 1, 1),
    (17, 'BEHAVIORAL', 'Behavioral Safety', 'monthly', FALSE, 'medium', 'Behavior-based observation and coaching audit.', 17, 'active', 1, 1),
    (18, 'COMPLIANCE', 'Compliance', 'quarterly', TRUE, 'high', 'Legal and other requirements compliance audit.', 18, 'active', 1, 1),
    (19, 'MGMT_REVIEW', 'Management Review', 'semi_annual', TRUE, 'high', 'Top-management review of HSE and quality performance.', 19, 'active', 1, 1),
    (20, 'EMERGENCY', 'Emergency Preparedness', 'annual', TRUE, 'critical', 'Emergency plans, drills, resources, and response capability.', 20, 'active', 1, 1);

SELECT audit_type_id, audit_code, audit_name, frequency, mandatory, risk_level, status
FROM audit_types WHERE deleted_at IS NULL ORDER BY display_order;
