-- ==================================================
-- TABLE NAME
--   dms_document_folders
--
-- Purpose
--   Nested, unlimited-depth document folder hierarchy for controlled, obsolete,
--   draft, archived, training, SOP, and department libraries.
--
-- Relationships
--   Self-referencing parent folder; users audit changes.
--
-- Indexes
--   Parent/name, folder type, path, active status, deletion.
--
-- Workflow
--   Active -> Archived/Obsolete; documents are assigned by application workflow.
--
-- Author
--   CBL HSE Database Architecture
--
-- Version
--   1.0.0 | DMS and SOP Extension | MySQL 8
-- ==================================================

USE cbl_hse;

CREATE TABLE IF NOT EXISTS dms_document_folders (
    folder_id       BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    parent_folder_id BIGINT UNSIGNED NULL,
    folder_name     VARCHAR(200) NOT NULL,
    folder_type     ENUM('controlled_documents','obsolete_documents','drafts','archived','training_documents','sop_library','department_documents') NOT NULL,
    folder_path     VARCHAR(1000) NOT NULL,
    active          BOOLEAN NOT NULL DEFAULT TRUE,
    created_by      BIGINT UNSIGNED NOT NULL,
    updated_by      BIGINT UNSIGNED NOT NULL,
    created_at      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at      DATETIME(3) NULL,
    PRIMARY KEY (folder_id),
    UNIQUE KEY uq_dms_folder_parent_name (parent_folder_id, folder_name),
    CONSTRAINT fk_dms_folder_parent FOREIGN KEY (parent_folder_id) REFERENCES dms_document_folders (folder_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_dms_folder_created_by FOREIGN KEY (created_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_dms_folder_updated_by FOREIGN KEY (updated_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_dms_folder_parent (parent_folder_id, active),
    INDEX idx_dms_folder_type (folder_type, active),
    INDEX idx_dms_folder_path (folder_path(200)),
    INDEX idx_dms_folder_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Nested DMS folder hierarchy.';

INSERT INTO dms_document_folders (folder_id,parent_folder_id,folder_name,folder_type,folder_path,active,created_by,updated_by) VALUES
 (1,NULL,'Controlled Documents','controlled_documents','/Controlled Documents',TRUE,1,1),
 (2,NULL,'Obsolete Documents','obsolete_documents','/Obsolete Documents',TRUE,1,1),
 (3,NULL,'Drafts','drafts','/Drafts',TRUE,1,1),
 (4,NULL,'Archived','archived','/Archived',TRUE,1,1),
 (5,NULL,'Training Documents','training_documents','/Training Documents',TRUE,1,1),
 (6,NULL,'SOP Library','sop_library','/SOP Library',TRUE,1,1),
 (7,NULL,'Department Documents','department_documents','/Department Documents',TRUE,1,1),
 (8,1,'HSE Controlled','controlled_documents','/Controlled Documents/HSE',TRUE,1,1),
 (9,1,'Quality Controlled','controlled_documents','/Controlled Documents/Quality',TRUE,1,1),
 (10,1,'Environmental Controlled','controlled_documents','/Controlled Documents/Environmental',TRUE,1,1),
 (11,6,'Safe Work Procedures','sop_library','/SOP Library/Safe Work Procedures',TRUE,1,1),
 (12,6,'Emergency Procedures','sop_library','/SOP Library/Emergency Procedures',TRUE,1,1),
 (13,6,'Food Safety SOPs','sop_library','/SOP Library/Food Safety',TRUE,1,1),
 (14,5,'HSE Training','training_documents','/Training Documents/HSE',TRUE,1,1),
 (15,5,'Quality Training','training_documents','/Training Documents/Quality',TRUE,1,1),
 (16,7,'Production','department_documents','/Department Documents/Production',TRUE,1,1),
 (17,7,'Engineering','department_documents','/Department Documents/Engineering',TRUE,1,1),
 (18,7,'Stores','department_documents','/Department Documents/Stores',TRUE,1,1),
 (19,4,'Superseded SOPs','archived','/Archived/Superseded SOPs',TRUE,1,1),
 (20,2,'Obsolete SOPs','obsolete_documents','/Obsolete Documents/SOPs',TRUE,1,1);

SELECT folder_id,parent_folder_id,folder_name,folder_path,active FROM dms_document_folders WHERE deleted_at IS NULL ORDER BY folder_path;
