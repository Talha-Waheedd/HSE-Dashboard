-- ==================================================
-- TABLE NAME
--   incident_notifications
--
-- Purpose
--   Tracks incident communications through Outlook Email, SMS, In-App, Teams,
--   reminders, and escalations, including retries and read/delivery state.
--
-- Relationships
--   incidents, users as recipients and audit owners.
--
-- Indexes
--   Incident/type, delivery queue, recipient/read state, and retry processing.
--
-- Workflow
--   Pending -> Sent -> Delivered or Failed. Failed items remain retryable.
--
-- Author
--   CBL HSE Database Architecture
--
-- Version
--   1.0.0 | Phase 5 | MySQL 8
-- ==================================================

USE cbl_hse;

CREATE TABLE IF NOT EXISTS incident_notifications (
    notification_id   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    incident_id       BIGINT UNSIGNED NOT NULL,
    notification_type ENUM('outlook_email', 'sms', 'in_app', 'teams_notification', 'reminder', 'escalation') NOT NULL,
    recipient_user_id BIGINT UNSIGNED NULL,
    recipient_address VARCHAR(255) NOT NULL,
    subject           VARCHAR(300) NULL,
    message           TEXT NOT NULL,
    retry_count       SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    delivery_status   ENUM('pending', 'sent', 'delivered', 'failed') NOT NULL DEFAULT 'pending',
    read_status       ENUM('unread', 'read', 'not_applicable') NOT NULL DEFAULT 'unread',
    sent_at           DATETIME(3) NULL,
    received_at       DATETIME(3) NULL,
    last_error        TEXT NULL,
    created_by        BIGINT UNSIGNED NOT NULL,
    updated_by        BIGINT UNSIGNED NOT NULL,
    created_at        DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at        DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at        DATETIME(3) NULL,

    PRIMARY KEY (notification_id),
    CONSTRAINT fk_incident_notification_incident FOREIGN KEY (incident_id) REFERENCES incidents (incident_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_incident_notification_recipient FOREIGN KEY (recipient_user_id) REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_incident_notification_created_by FOREIGN KEY (created_by) REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_incident_notification_updated_by FOREIGN KEY (updated_by) REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_incident_notification_case_type (incident_id, notification_type),
    INDEX idx_incident_notification_queue (delivery_status, retry_count, created_at),
    INDEX idx_incident_notification_recipient_read (recipient_user_id, read_status),
    INDEX idx_incident_notification_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Incident notification, escalation, delivery, and read audit log.';

INSERT INTO incident_notifications
    (incident_id, notification_type, recipient_user_id, recipient_address, subject, message, retry_count, delivery_status, read_status, sent_at, received_at, created_by, updated_by)
VALUES
    (1, 'outlook_email', 1, 'ahmed.raza@cbl.com.pk', 'Incident INC-2026-000001 Reported', 'A first aid case has been reported on Production Line 1.', 0, 'delivered', 'read', '2026-07-14 10:32:00.000', '2026-07-14 10:32:03.000', 2, 2),
    (2, 'teams_notification', 3, 'bilal.hussain@cbl.com.pk', 'Electrical Shock Investigation Required', 'Incident INC-2026-000002 requires immediate HSE investigation.', 0, 'delivered', 'unread', '2026-07-20 16:55:00.000', '2026-07-20 16:55:01.000', 3, 3),
    (3, 'escalation', 1, 'ahmed.raza@cbl.com.pk', 'Boiler Fire Escalation', 'The boiler-area fire incident has been escalated for management review.', 1, 'sent', 'unread', '2026-07-25 22:30:00.000', NULL, 3, 3),
    (4, 'reminder', 2, 'sara.ali@cbl.com.pk', 'Investigation Evidence Reminder', 'Please attach the contractor traffic-control evidence for INC-2026-000004.', 2, 'failed', 'unread', NULL, NULL, 2, 2),
    (5, 'in_app', 3, 'bilal.hussain@cbl.com.pk', 'Pump Damage Incident Submitted', 'Incident INC-2026-000005 is awaiting investigation assignment.', 0, 'delivered', 'unread', '2026-08-02 13:20:00.000', '2026-08-02 13:20:00.000', 3, 3);

SELECT notification_id, incident_id, notification_type, delivery_status, read_status, retry_count
FROM incident_notifications WHERE deleted_at IS NULL ORDER BY notification_id;
