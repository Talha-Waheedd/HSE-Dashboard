-- ==================================================
-- TABLE NAME
--   audit_notifications
--
-- Purpose
--   Tracks Outlook, Teams, SMS, in-app, reminder, and escalation notifications
--   for audits, inspections, findings, and compliance requirements.
--
-- Relationships
--   audits, inspections, audit_findings, compliance_requirements, users.
--
-- Indexes
--   Source/type, delivery queue, recipient/read, retries, and deletion.
--
-- Workflow
--   Pending -> Sent -> Delivered or Failed; failed messages remain retryable.
--
-- Author
--   CBL HSE Database Architecture
--
-- Version
--   1.0.0 | Phase 7 | MySQL 8
-- ==================================================

USE cbl_hse;

CREATE TABLE IF NOT EXISTS audit_notifications (
    notification_id       BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    audit_id              BIGINT UNSIGNED NULL,
    inspection_id         BIGINT UNSIGNED NULL,
    finding_id            BIGINT UNSIGNED NULL,
    requirement_id        BIGINT UNSIGNED NULL,
    notification_type     ENUM('outlook_email', 'teams', 'sms', 'in_app', 'reminder', 'escalation') NOT NULL,
    recipient_user_id     BIGINT UNSIGNED NOT NULL,
    recipient_address     VARCHAR(255) NOT NULL,
    subject               VARCHAR(300) NULL,
    message               TEXT NOT NULL,
    delivery_status       ENUM('pending', 'sent', 'delivered', 'failed') NOT NULL DEFAULT 'pending',
    retry_count           SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    read_status           ENUM('unread', 'read', 'not_applicable') NOT NULL DEFAULT 'unread',
    sent_at               DATETIME(3) NULL,
    received_at           DATETIME(3) NULL,
    last_error            TEXT NULL,
    created_by            BIGINT UNSIGNED NOT NULL,
    updated_by            BIGINT UNSIGNED NOT NULL,
    created_at            DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at            DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at            DATETIME(3) NULL,
    PRIMARY KEY (notification_id),
    CONSTRAINT chk_audit_notification_source CHECK (audit_id IS NOT NULL OR inspection_id IS NOT NULL OR finding_id IS NOT NULL OR requirement_id IS NOT NULL),
    CONSTRAINT fk_audit_notification_audit FOREIGN KEY (audit_id) REFERENCES audits (audit_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_audit_notification_inspection FOREIGN KEY (inspection_id) REFERENCES inspections (inspection_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_audit_notification_finding FOREIGN KEY (finding_id) REFERENCES audit_findings (finding_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_audit_notification_requirement FOREIGN KEY (requirement_id) REFERENCES compliance_requirements (requirement_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_audit_notification_recipient FOREIGN KEY (recipient_user_id) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_audit_notification_created_by FOREIGN KEY (created_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_audit_notification_updated_by FOREIGN KEY (updated_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_audit_notification_source_type (audit_id, inspection_id, finding_id, requirement_id, notification_type),
    INDEX idx_audit_notification_queue (delivery_status, retry_count, created_at),
    INDEX idx_audit_notification_recipient_read (recipient_user_id, read_status),
    INDEX idx_audit_notification_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Audit, inspection, finding, and compliance notification delivery log.';

INSERT INTO audit_notifications
    (audit_id, inspection_id, finding_id, requirement_id, notification_type, recipient_user_id, recipient_address, subject, message, delivery_status, retry_count, read_status, sent_at, received_at, created_by, updated_by)
VALUES
    (3, NULL, NULL, NULL, 'outlook_email', 3, 'bilal.hussain@cbl.com.pk', 'Upcoming Electrical Audit', 'The electrical compliance audit is scheduled for 20 August 2026.', 'delivered', 0, 'read', '2026-08-15 09:00:00.000', '2026-08-15 09:00:02.000', 1, 1),
    (NULL, 4, NULL, NULL, 'teams', 2, 'sara.ali@cbl.com.pk', 'Warehouse Inspection In Progress', 'The warehouse inspection has open traffic-control observations.', 'sent', 0, 'unread', '2026-08-04 10:00:00.000', NULL, 3, 3),
    (5, NULL, 3, NULL, 'escalation', 1, 'ahmed.raza@cbl.com.pk', 'Major Finding Escalation', 'Warehouse traffic non-conformity remains open and is approaching due date.', 'delivered', 0, 'read', '2026-08-05 08:00:00.000', '2026-08-05 08:00:01.000', 3, 3),
    (NULL, NULL, NULL, 1, 'reminder', 2, 'sara.ali@cbl.com.pk', 'Compliance Review Reminder', 'The LOTO legal requirement review is due by 30 September 2026.', 'pending', 1, 'unread', NULL, NULL, 1, 1),
    (NULL, NULL, NULL, 3, 'in_app', 2, 'sara.ali@cbl.com.pk', 'Environmental Register Review', 'Environmental compliance evidence requires review.', 'delivered', 0, 'unread', '2026-08-01 08:30:00.000', '2026-08-01 08:30:00.000', 2, 2);

SELECT notification_id, audit_id, inspection_id, finding_id, requirement_id, notification_type, delivery_status, read_status
FROM audit_notifications WHERE deleted_at IS NULL ORDER BY notification_id;
