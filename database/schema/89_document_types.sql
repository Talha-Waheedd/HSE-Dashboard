-- ==================================================
-- TABLE NAME
--   dms_document_types
--
-- Purpose
--   Classification and control level for DMS documents.
--
-- Relationships
--   Referenced by dms_documents; users audit type maintenance.
--
-- Indexes
--   Unique names, approval/retention rules, active status, deletion.
--
-- Workflow
--   Draft -> Controlled/Approved -> Archived/Obsolete.
--
-- Author
--   CBL HSE Database Architecture
--
-- Version
--   1.0.0 | DMS and SOP Extension | MySQL 8
-- ==================================================

USE cbl_hse;

CREATE TABLE IF NOT EXISTS dms_document_types (
    document_type_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name             VARCHAR(100) NOT NULL,
    retention_months SMALLINT UNSIGNED NULL,
    approval_required BOOLEAN NOT NULL DEFAULT TRUE,
    active_status    BOOLEAN NOT NULL DEFAULT TRUE,
    created_by       BIGINT UNSIGNED NULL,
    updated_by       BIGINT UNSIGNED NULL,
    created_at       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at       DATETIME(3) NULL,
    PRIMARY KEY (document_type_id),
    UNIQUE KEY uq_dms_document_type_name (name),
    CONSTRAINT chk_dms_document_type_retention CHECK (retention_months IS NULL OR retention_months > 0),
    CONSTRAINT fk_dms_document_type_created_by FOREIGN KEY (created_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_dms_document_type_updated_by FOREIGN KEY (updated_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_dms_document_type_control (approval_required, active_status),
    INDEX idx_dms_document_type_retention (retention_months),
    INDEX idx_dms_document_type_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='DMS document control classification master.';

INSERT INTO dms_document_types (document_type_id,name,retention_months,approval_required,active_status,created_by,updated_by) VALUES
 (1,'Controlled',120,TRUE,TRUE,1,1),(2,'Uncontrolled',36,FALSE,TRUE,1,1),(3,'Confidential',120,TRUE,TRUE,1,1),(4,'Public',36,FALSE,TRUE,1,1),(5,'Internal',120,TRUE,TRUE,1,1),(6,'External',120,TRUE,TRUE,1,1),(7,'Draft',12,FALSE,TRUE,1,1),(8,'Approved',120,TRUE,TRUE,1,1),(9,'Archived',120,FALSE,TRUE,1,1),(10,'Obsolete',120,FALSE,TRUE,1,1);

SELECT document_type_id,name,retention_months,approval_required,active_status FROM dms_document_types WHERE deleted_at IS NULL ORDER BY document_type_id;
