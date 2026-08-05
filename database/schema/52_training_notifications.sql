-- ==================================================
-- TABLE NAME
--   training_notifications
--
-- Purpose
--   Notification queue for training events and certification compliance,
--   including email, in-app messages, reminders, upcoming sessions, expired
--   certificates, and renewal reminders.
--
-- Relationships
--   training_sessions, training_certifications, users as recipients/auditors.
--
-- Indexes
--   Session/type, certification/type, delivery queue, recipient/read state, retries.
--
-- Workflow
--   Pending -> Sent -> Delivered or Failed; retry_count controls reprocessing.
--
-- Author
--   CBL HSE Database Architecture
--
-- Version
--   1.0.0 | Phase 6 | MySQL 8
-- ==================================================

USE cbl_hse;

CREATE TABLE IF NOT EXISTS training_notifications (
    notification_id      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    training_session_id  BIGINT UNSIGNED NULL,
    certification_id     BIGINT UNSIGNED NULL,
    notification_type    ENUM('outlook_email', 'in_app_notification', 'reminder', 'upcoming_training', 'expired_certification', 'renewal_reminder') NOT NULL,
    recipient_user_id    BIGINT UNSIGNED NOT NULL,
    recipient_address    VARCHAR(255) NOT NULL,
    subject              VARCHAR(300) NULL,
    message              TEXT NOT NULL,
    delivery_status      ENUM('pending', 'sent', 'delivered', 'failed') NOT NULL DEFAULT 'pending',
    retry_count          SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    read_status          ENUM('unread', 'read', 'not_applicable') NOT NULL DEFAULT 'unread',
    sent_at              DATETIME(3) NULL,
    received_at          DATETIME(3) NULL,
    last_error           TEXT NULL,
    created_by           BIGINT UNSIGNED NOT NULL,
    updated_by           BIGINT UNSIGNED NOT NULL,
    created_at           DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at           DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at           DATETIME(3) NULL,

    PRIMARY KEY (notification_id),
    CONSTRAINT chk_training_notification_subject CHECK (training_session_id IS NOT NULL OR certification_id IS NOT NULL),
    CONSTRAINT fk_training_notification_session FOREIGN KEY (training_session_id) REFERENCES training_sessions (training_session_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_training_notification_certification FOREIGN KEY (certification_id) REFERENCES training_certifications (certification_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_training_notification_recipient FOREIGN KEY (recipient_user_id) REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_training_notification_created_by FOREIGN KEY (created_by) REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_training_notification_updated_by FOREIGN KEY (updated_by) REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_training_notification_session_type (training_session_id, notification_type),
    INDEX idx_training_notification_cert_type (certification_id, notification_type),
    INDEX idx_training_notification_queue (delivery_status, retry_count, created_at),
    INDEX idx_training_notification_recipient_read (recipient_user_id, read_status),
    INDEX idx_training_notification_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Training and certification notification delivery audit log.';

INSERT INTO training_notifications
    (training_session_id, certification_id, notification_type, recipient_user_id, recipient_address, subject, message, delivery_status, retry_count, read_status, sent_at, received_at, created_by, updated_by)
VALUES
    (2, NULL, 'upcoming_training', 2, 'sara.ali@cbl.com.pk', 'Upcoming Fire Safety Training', 'Annual fire safety training is scheduled for 12 August 2026.', 'delivered', 0, 'read', '2026-08-08 09:00:00.000', '2026-08-08 09:00:02.000', 1, 1),
    (3, NULL, 'reminder', 3, 'bilal.hussain@cbl.com.pk', 'LOTO Workshop Reminder', 'Please confirm attendance for the authorized person LOTO workshop.', 'sent', 0, 'unread', '2026-08-16 09:00:00.000', NULL, 1, 1),
    (NULL, 4, 'expired_certification', 4, 'tariq.mehmood@cbl.com.pk', 'Expired Food Safety Certificate', 'The food safety certificate for EMP-PROD-002 has expired and requires renewal.', 'delivered', 0, 'read', '2026-07-10 08:00:00.000', '2026-07-10 08:00:01.000', 1, 1),
    (NULL, 4, 'renewal_reminder', 4, 'tariq.mehmood@cbl.com.pk', 'Food Safety Renewal Scheduled', 'Renewal has been scheduled for 15 September 2026.', 'pending', 1, 'unread', NULL, NULL, 1, 1),
    (1, NULL, 'in_app_notification', 2, 'sara.ali@cbl.com.pk', 'HSE Induction Records Complete', 'The August induction attendance and certificates are available for review.', 'delivered', 0, 'unread', '2026-08-06 11:00:00.000', '2026-08-06 11:00:00.000', 1, 1);

SELECT notification_id, training_session_id, certification_id, notification_type, delivery_status, read_status
FROM training_notifications WHERE deleted_at IS NULL ORDER BY notification_id;
