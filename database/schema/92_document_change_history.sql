-- ==================================================
-- TABLE NAME
--   dms_document_change_history
--
-- Purpose
--   Immutable audit trail for document edits, values, actions, timestamps, IP,
--   and remarks. Every content or metadata change is append-only.
--
-- Relationships
--   dms_documents, dms_document_versions, users.
--
-- Indexes
--   Document/time, version/time, editor/time, action, IP, deletion.
--
-- Workflow
--   Append on create/edit/submit/approve/reject/archive/obsolete actions.
--
-- Author
--   CBL HSE Database Architecture
--
-- Version
--   1.0.0 | DMS and SOP Extension | MySQL 8
-- ==================================================

USE cbl_hse;

CREATE TABLE IF NOT EXISTS dms_document_change_history (
    change_history_id  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    document_id        BIGINT UNSIGNED NOT NULL,
    document_version_id BIGINT UNSIGNED NULL,
    changed_by         BIGINT UNSIGNED NOT NULL,
    old_value          TEXT NULL,
    new_value          TEXT NULL,
    action_performed   ENUM('created','edited','version_created','submitted','approved','rejected','returned','reopened','archived','obsoleted') NOT NULL,
    changed_at         DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ip_address         VARCHAR(45) NULL,
    remarks            TEXT NULL,
    created_by         BIGINT UNSIGNED NOT NULL,
    updated_by         BIGINT UNSIGNED NOT NULL,
    created_at         DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at         DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    deleted_at         DATETIME(3) NULL COMMENT 'Always NULL; immutable audit history is never deleted.',
    PRIMARY KEY (change_history_id),
    CONSTRAINT fk_dms_change_document FOREIGN KEY (document_id) REFERENCES dms_documents (document_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_dms_change_version FOREIGN KEY (document_version_id) REFERENCES dms_document_versions (document_version_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_dms_change_changed_by FOREIGN KEY (changed_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_dms_change_created_by FOREIGN KEY (created_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_dms_change_updated_by FOREIGN KEY (updated_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_dms_change_document_time (document_id, changed_at),
    INDEX idx_dms_change_version_time (document_version_id, changed_at),
    INDEX idx_dms_change_editor_time (changed_by, changed_at),
    INDEX idx_dms_change_action (action_performed, changed_at),
    INDEX idx_dms_change_ip (ip_address),
    INDEX idx_dms_change_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Immutable DMS document change audit trail.';

DROP TRIGGER IF EXISTS trg_dms_change_history_no_update;
DROP TRIGGER IF EXISTS trg_dms_change_history_no_delete;
DELIMITER $$
CREATE TRIGGER trg_dms_change_history_no_update BEFORE UPDATE ON dms_document_change_history FOR EACH ROW BEGIN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='DMS change history is immutable'; END$$
CREATE TRIGGER trg_dms_change_history_no_delete BEFORE DELETE ON dms_document_change_history FOR EACH ROW BEGIN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='DMS change history cannot be deleted'; END$$
DELIMITER ;

INSERT INTO dms_document_change_history (document_id,document_version_id,changed_by,old_value,new_value,action_performed,ip_address,remarks,created_by,updated_by)
SELECT d.document_id, v.document_version_id, CASE WHEN MOD(n.seq,3)=0 THEN 1 WHEN MOD(n.seq,3)=1 THEN 2 ELSE 3 END,
       CONCAT('status=',CASE WHEN MOD(n.seq,3)=0 THEN 'draft' ELSE 'pending_review' END),CONCAT('status=',CASE WHEN MOD(n.seq,3)=0 THEN 'pending_review' ELSE 'approved' END),
       CASE MOD(n.seq,5) WHEN 1 THEN 'created' WHEN 2 THEN 'edited' WHEN 3 THEN 'version_created' WHEN 4 THEN 'submitted' ELSE 'approved' END,
       CONCAT('10.20.1.',MOD(d.document_id,240)+1),'Seeded immutable document audit event.',1,1
FROM dms_documents d JOIN dms_document_versions v ON v.document_id=d.document_id CROSS JOIN (SELECT 1 seq UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5) n
WHERE v.version_number=1.00;

SELECT COUNT(*) AS change_history_count FROM dms_document_change_history WHERE deleted_at IS NULL;
