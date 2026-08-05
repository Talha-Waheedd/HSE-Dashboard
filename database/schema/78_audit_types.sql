-- ==================================================
-- TABLE NAME
--   am_audit_types
--
-- Purpose
--   Configurable audit classification master for internal, external, ISO, GMP,
--   HACCP, safety, contractor, supplier, environmental, and management audits.
--
-- Relationships
--   Referenced by am_audits; users audit master changes.
--
-- Indexes
--   Unique name/code, frequency/status, active ordering, and soft-delete filtering.
--
-- Workflow
--   Active types are schedulable; inactive types remain historical.
--
-- Author
--   CBL HSE Database Architecture
--
-- Version
--   1.0.0 | Audit and Inspection Extension | MySQL 8
-- ==================================================

USE cbl_hse;

CREATE TABLE IF NOT EXISTS am_audit_types (
    audit_type_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name          VARCHAR(150) NOT NULL,
    description   VARCHAR(600) NULL,
    frequency     ENUM('ad_hoc','monthly','quarterly','semi_annual','annual') NOT NULL,
    active        BOOLEAN NOT NULL DEFAULT TRUE,
    created_by    BIGINT UNSIGNED NULL,
    updated_by    BIGINT UNSIGNED NULL,
    created_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at    DATETIME(3) NULL,
    PRIMARY KEY (audit_type_id),
    UNIQUE KEY uq_am_audit_type_name (name),
    CONSTRAINT fk_am_audit_type_created_by FOREIGN KEY (created_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_am_audit_type_updated_by FOREIGN KEY (updated_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_am_audit_type_frequency_status (frequency, active),
    INDEX idx_am_audit_type_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Audit type master for the isolated Audit and Inspection extension.';

INSERT INTO am_audit_types (audit_type_id,name,description,frequency,active,created_by,updated_by) VALUES
 (1,'Internal Audit','First-party management-system audit.','quarterly',TRUE,1,1),(2,'External Audit','Independent third-party audit.','annual',TRUE,1,1),(3,'ISO 9001','Quality management-system audit.','annual',TRUE,1,1),(4,'ISO 14001','Environmental management-system audit.','annual',TRUE,1,1),(5,'ISO 45001','Occupational health and safety audit.','annual',TRUE,1,1),(6,'GMP','Good manufacturing practice audit.','quarterly',TRUE,1,1),(7,'HACCP','Hazard analysis and critical control point audit.','quarterly',TRUE,1,1),(8,'Safety Audit','Operational HSE control audit.','quarterly',TRUE,1,1),(9,'Contractor Audit','Contractor HSE and permit audit.','monthly',TRUE,1,1),(10,'Supplier Audit','Supplier quality and HSE audit.','annual',TRUE,1,1),(11,'Behavioral Audit','Behavior-based safety audit.','monthly',TRUE,1,1),(12,'Fire Audit','Fire prevention and protection audit.','quarterly',TRUE,1,1),(13,'Environmental Audit','Environmental aspects and legal control audit.','quarterly',TRUE,1,1),(14,'Legal Compliance','Legal and other requirements audit.','quarterly',TRUE,1,1),(15,'Management Review','Top-management performance review.','semi_annual',TRUE,1,1),(16,'Emergency Preparedness','Emergency response readiness audit.','annual',TRUE,1,1),(17,'Food Safety Audit','Food safety and hygiene audit.','monthly',TRUE,1,1),(18,'Department Audit','Department-level controls audit.','quarterly',TRUE,1,1),(19,'Machine Safety Audit','Machine guarding and operation audit.','monthly',TRUE,1,1),(20,'Warehouse Audit','Storage and warehouse control audit.','monthly',TRUE,1,1);

SELECT audit_type_id,name,frequency,active FROM am_audit_types WHERE deleted_at IS NULL ORDER BY audit_type_id;
