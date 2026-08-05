-- ==================================================
-- TABLE NAME
--   dms_document_versions
--
-- Purpose
--   Non-destructive document version ledger. Every edit creates a row; prior
--   versions are retained and may not be physically deleted.
--
-- Relationships
--   dms_documents, employees as preparers/reviewers/approvers, users.
--
-- Indexes
--   Document/version, status/effective date, approval, superseded date, deletion.
--
-- Workflow
--   Draft -> Pending Review -> Approved -> Effective -> Superseded/Obsolete.
--
-- Author
--   CBL HSE Database Architecture
--
-- Version
--   1.0.0 | DMS and SOP Extension | MySQL 8
-- ==================================================

USE cbl_hse;

CREATE TABLE IF NOT EXISTS dms_document_versions (
    document_version_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    document_id         BIGINT UNSIGNED NOT NULL,
    version_number      DECIMAL(5,2) NOT NULL,
    revision_number     SMALLINT UNSIGNED NOT NULL,
    uploaded_file       VARCHAR(1000) NOT NULL,
    change_summary      TEXT NULL,
    revision_reason     TEXT NULL,
    prepared_by         CHAR(36) NOT NULL,
    reviewed_by         CHAR(36) NULL,
    approved_by         CHAR(36) NULL,
    approval_date       DATETIME(3) NULL,
    effective_date      DATE NULL,
    superseded_date     DATE NULL,
    status              ENUM('draft','pending_review','approved','effective','superseded','obsolete') NOT NULL DEFAULT 'draft',
    created_by          BIGINT UNSIGNED NOT NULL,
    updated_by          BIGINT UNSIGNED NOT NULL,
    created_at          DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at          DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at          DATETIME(3) NULL COMMENT 'Must remain NULL; version records are retained.',
    PRIMARY KEY (document_version_id),
    UNIQUE KEY uq_dms_version_document_number (document_id, version_number),
    CONSTRAINT chk_dms_version_numbers CHECK (version_number > 0 AND revision_number > 0),
    CONSTRAINT chk_dms_version_approval CHECK (status NOT IN ('approved','effective','superseded','obsolete') OR approved_by IS NOT NULL),
    CONSTRAINT chk_dms_version_dates CHECK (superseded_date IS NULL OR effective_date IS NULL OR superseded_date >= effective_date),
    CONSTRAINT fk_dms_version_document FOREIGN KEY (document_id) REFERENCES dms_documents (document_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_dms_version_prepared_by FOREIGN KEY (prepared_by) REFERENCES employees (employee_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_dms_version_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES employees (employee_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_dms_version_approved_by FOREIGN KEY (approved_by) REFERENCES employees (employee_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_dms_version_created_by FOREIGN KEY (created_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_dms_version_updated_by FOREIGN KEY (updated_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_dms_version_document_status (document_id, status),
    INDEX idx_dms_version_effective (effective_date, status),
    INDEX idx_dms_version_approval (approved_by, approval_date),
    INDEX idx_dms_version_superseded (superseded_date),
    INDEX idx_dms_version_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Non-destructive controlled document version ledger.';

INSERT INTO dms_document_versions (document_id,version_number,revision_number,uploaded_file,change_summary,revision_reason,prepared_by,reviewed_by,approved_by,approval_date,effective_date,superseded_date,status,created_by,updated_by)
SELECT d.document_id,x.version_number,x.version_number,
       CONCAT('dms/documents/',d.document_id,'/version-',x.version_number,'.pdf'),
       CASE WHEN x.version_number=1 THEN 'Initial controlled issue.' ELSE CONCAT('Revision ',x.version_number,' updates operational control and evidence requirements.') END,
       CASE WHEN x.version_number=1 THEN 'Initial document release.' ELSE 'Scheduled document review and continual improvement.' END,
       d.author_id,CASE WHEN x.version_number=1 THEN NULL ELSE d.owner_id END,
       CASE WHEN x.version_number=1 THEN NULL ELSE d.approver_id END,
       CASE WHEN x.version_number=1 THEN NULL ELSE DATE_ADD(d.issue_date,INTERVAL x.version_number MONTH) END,
       CASE WHEN x.version_number=1 THEN d.effective_date ELSE DATE_ADD(d.effective_date,INTERVAL x.version_number MONTH) END,
       CASE WHEN x.version_number=1 THEN DATE_ADD(d.effective_date,INTERVAL 12 MONTH) ELSE NULL END,
       CASE WHEN x.version_number=1 THEN 'superseded' WHEN x.version_number=2 THEN 'effective' ELSE 'pending_review' END,1,1
FROM dms_documents d CROSS JOIN (SELECT 1.00 version_number UNION ALL SELECT 2.00) x
UNION ALL
SELECT d.document_id,3.00,3,CONCAT('dms/documents/',d.document_id,'/version-3.00.pdf'),'Additional controlled revision.','Management review improvement.',d.author_id,d.owner_id,d.approver_id,DATE_ADD(d.issue_date,INTERVAL 18 MONTH),DATE_ADD(d.effective_date,INTERVAL 18 MONTH),NULL,'pending_review',1,1
FROM dms_documents d WHERE d.document_id <= 10;

SELECT COUNT(*) AS document_version_count FROM dms_document_versions WHERE deleted_at IS NULL;
