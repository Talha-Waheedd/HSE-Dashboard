-- ==================================================
-- TABLE NAME
--   dms_document_notifications
--
-- Purpose
--   Notification history for document distribution, reminders, overdue reviews,
--   new revisions, and approval requests.
--
-- Relationships
--   dms_documents, dms_document_versions, employees as recipients, users.
--
-- Indexes
--   Document/recipient/type, delivery queue, opened/sent, retry, deletion.
--
-- Workflow
--   Pending -> Sent -> Delivered/Failed; opened time is recorded for acknowledgement.
--
-- Author
--   CBL HSE Database Architecture
--
-- Version
--   1.0.0 | DMS and SOP Extension | MySQL 8
-- ==================================================

USE cbl_hse;

CREATE TABLE IF NOT EXISTS dms_document_notifications (
    notification_id      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    document_id          BIGINT UNSIGNED NOT NULL,
    document_version_id  BIGINT UNSIGNED NULL,
    recipient_id          CHAR(36) NOT NULL,
    notification_type    ENUM('email','in_app_notification','reminder','overdue_review','new_revision','approval_request') NOT NULL,
    delivery_status      ENUM('pending','sent','delivered','failed') NOT NULL DEFAULT 'pending',
    retry_count          SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    opened_at            DATETIME(3) NULL,
    sent_at              DATETIME(3) NULL,
    recipient_address    VARCHAR(255) NOT NULL,
    subject              VARCHAR(300) NULL,
    message              TEXT NOT NULL,
    created_by           BIGINT UNSIGNED NOT NULL,
    updated_by           BIGINT UNSIGNED NOT NULL,
    created_at           DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at           DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at           DATETIME(3) NULL,
    PRIMARY KEY (notification_id),
    CONSTRAINT fk_dms_notification_document FOREIGN KEY (document_id) REFERENCES dms_documents (document_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_dms_notification_version FOREIGN KEY (document_version_id) REFERENCES dms_document_versions (document_version_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_dms_notification_recipient FOREIGN KEY (recipient_id) REFERENCES employees (employee_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_dms_notification_created_by FOREIGN KEY (created_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_dms_notification_updated_by FOREIGN KEY (updated_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_dms_notification_document_recipient (document_id, recipient_id, notification_type),
    INDEX idx_dms_notification_queue (delivery_status, retry_count, created_at),
    INDEX idx_dms_notification_opened_sent (opened_at, sent_at),
    INDEX idx_dms_notification_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='DMS notification delivery and opening history.';

INSERT INTO dms_document_notifications (document_id,document_version_id,recipient_id,notification_type,delivery_status,retry_count,opened_at,sent_at,recipient_address,subject,message,created_by,updated_by)
SELECT d.document_id,v.document_version_id,
       CASE x.n WHEN 1 THEN 'EMP-HSE-001' WHEN 2 THEN 'EMP-HSE-002' ELSE 'EMP-ENG-001' END,
       CASE MOD(d.document_id+x.n,6) WHEN 0 THEN 'approval_request' WHEN 1 THEN 'new_revision' WHEN 2 THEN 'overdue_review' WHEN 3 THEN 'reminder' WHEN 4 THEN 'email' ELSE 'in_app_notification' END,
       CASE WHEN MOD(d.document_id+x.n,7)=0 THEN 'failed' WHEN MOD(d.document_id+x.n,5)=0 THEN 'pending' ELSE 'delivered' END,
       CASE WHEN MOD(d.document_id+x.n,7)=0 THEN 2 ELSE 0 END,
       CASE WHEN MOD(d.document_id+x.n,4)=0 THEN NULL ELSE '2026-06-04 09:00:00.000' END,
       CASE WHEN MOD(d.document_id+x.n,5)=0 THEN NULL ELSE '2026-06-03 09:00:00.000' END,
       CASE x.n WHEN 1 THEN 'ahmed.raza@cbl.com.pk' WHEN 2 THEN 'sara.ali@cbl.com.pk' ELSE 'zafar.iqbal@cbl.com.pk' END,
       CONCAT('DMS notification for ',d.title),CONCAT('Controlled document notification for ',d.title,'.'),1,1
FROM dms_documents d JOIN dms_document_versions v ON v.document_id=d.document_id AND v.version_number=2.00
CROSS JOIN (SELECT 1 n UNION ALL SELECT 2 UNION ALL SELECT 3) x
UNION ALL
SELECT d.document_id,v.document_version_id,'EMP-HSE-001','new_revision','delivered',0,'2026-06-05 09:00:00.000','2026-06-05 08:00:00.000','ahmed.raza@cbl.com.pk',CONCAT('Revision: ',d.title),CONCAT('New controlled revision available for ',d.title,'.'),1,1
FROM dms_documents d JOIN dms_document_versions v ON v.document_id=d.document_id AND v.version_number=1.00 WHERE d.document_id<=10;

SELECT COUNT(*) AS notification_count FROM dms_document_notifications WHERE deleted_at IS NULL;
