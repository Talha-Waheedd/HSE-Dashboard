-- ==================================================
-- TABLE NAME
--   dms_document_approvals
--
-- Purpose
--   Multi-level document/version approval workflow for ISO 9001 and ISO 45001 control.
--
-- Relationships
--   dms_documents, dms_document_versions, employees as approvers, users.
--
-- Indexes
--   Document/version, approver/status, approval level/time, pending queue, deletion.
--
-- Workflow
--   Pending -> Approved/Rejected/Returned/Reopened.
--
-- Author
--   CBL HSE Database Architecture
--
-- Version
--   1.0.0 | DMS and SOP Extension | MySQL 8
-- ==================================================

USE cbl_hse;

CREATE TABLE IF NOT EXISTS dms_document_approvals (
    approval_id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    document_id         BIGINT UNSIGNED NOT NULL,
    document_version_id BIGINT UNSIGNED NOT NULL,
    approver_id         CHAR(36) NOT NULL,
    approval_level      TINYINT UNSIGNED NOT NULL,
    decision            ENUM('pending','approved','rejected','returned','reopened') NOT NULL DEFAULT 'pending',
    comments            TEXT NULL,
    decision_at         DATETIME(3) NULL,
    created_by          BIGINT UNSIGNED NOT NULL,
    updated_by          BIGINT UNSIGNED NOT NULL,
    created_at          DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at          DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at          DATETIME(3) NULL,
    PRIMARY KEY (approval_id),
    UNIQUE KEY uq_dms_approval_version_level (document_version_id, approval_level),
    CONSTRAINT chk_dms_approval_level CHECK (approval_level > 0),
    CONSTRAINT chk_dms_approval_decision CHECK (decision='pending' OR decision_at IS NOT NULL),
    CONSTRAINT fk_dms_approval_document FOREIGN KEY (document_id) REFERENCES dms_documents (document_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_dms_approval_version FOREIGN KEY (document_version_id) REFERENCES dms_document_versions (document_version_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_dms_approval_approver FOREIGN KEY (approver_id) REFERENCES employees (employee_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_dms_approval_created_by FOREIGN KEY (created_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_dms_approval_updated_by FOREIGN KEY (updated_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_dms_approval_document_version (document_id, document_version_id),
    INDEX idx_dms_approval_approver_decision (approver_id, decision),
    INDEX idx_dms_approval_level_time (approval_level, decision_at),
    INDEX idx_dms_approval_pending (decision, decision_at),
    INDEX idx_dms_approval_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Controlled document multi-level approval workflow.';

INSERT INTO dms_document_approvals (document_id,document_version_id,approver_id,approval_level,decision,comments,decision_at,created_by,updated_by)
SELECT d.document_id,v.document_version_id,CASE WHEN n.level_no=1 THEN 'EMP-HSE-002' ELSE 'EMP-HSE-001' END,n.level_no,
       CASE WHEN v.version_number=1.00 AND n.level_no=1 THEN 'approved' WHEN v.version_number=1.00 AND n.level_no=2 THEN 'approved' WHEN v.version_number=2.00 AND n.level_no=1 THEN 'approved' ELSE 'pending' END,
       CASE WHEN v.version_number=1.00 THEN 'Controlled review completed.' ELSE 'Awaiting revision approval.' END,
       CASE WHEN v.version_number=1.00 OR (v.version_number=2.00 AND n.level_no=1) THEN DATE_ADD(d.issue_date,INTERVAL n.level_no MONTH) ELSE NULL END,1,1
FROM dms_documents d JOIN dms_document_versions v ON v.document_id=d.document_id CROSS JOIN (SELECT 1 level_no UNION ALL SELECT 2) n;

SELECT COUNT(*) AS approval_count FROM dms_document_approvals WHERE deleted_at IS NULL;
