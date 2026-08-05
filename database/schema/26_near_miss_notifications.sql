-- ==================================================
-- TABLE NAME
--   near_miss_notifications
--
-- Purpose
--   Tracks Outlook email, in-app notification, reminders, escalations, retries,
--   delivery state, read state, and recipient message history.
--
-- Relationships
--   near_misses and users as recipients, senders, and audit owners.
--
-- Indexes
--   Near miss/type, delivery queue, recipient/read state, and retry processing.
--
-- Workflow
--   Pending -> Sent -> Delivered or Failed, with retry_count and escalation support.
--
-- Author
--   CBL HSE Database Architecture
--
-- Version
--   1.0.0 | Phase 4 | MySQL 8
-- ==================================================

USE cbl_hse;

CREATE TABLE IF NOT EXISTS near_miss_notifications (
    notification_id   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    near_miss_id      BIGINT UNSIGNED NOT NULL,
    notification_type ENUM('outlook_email', 'in_app_notification', 'reminder', 'escalation') NOT NULL,
    recipient_user_id BIGINT UNSIGNED NULL COMMENT 'FK -> users.user_id.',
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
    CONSTRAINT chk_nm_notification_retry CHECK (retry_count <= 255),
    CONSTRAINT fk_nm_notification_near_miss FOREIGN KEY (near_miss_id) REFERENCES near_misses (near_miss_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_nm_notification_recipient FOREIGN KEY (recipient_user_id) REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_nm_notification_created_by FOREIGN KEY (created_by) REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_nm_notification_updated_by FOREIGN KEY (updated_by) REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_nm_notification_case_type (near_miss_id, notification_type),
    INDEX idx_nm_notification_queue (delivery_status, retry_count, created_at),
    INDEX idx_nm_notification_recipient_read (recipient_user_id, read_status),
    INDEX idx_nm_notification_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Near miss communication, reminder, escalation, and delivery audit log.';

INSERT INTO near_miss_notifications
    (near_miss_id, notification_type, recipient_user_id, recipient_address, subject, message, retry_count,
     delivery_status, read_status, sent_at, received_at, created_by, updated_by)
VALUES
    (1, 'outlook_email', 1, 'ahmed.raza@cbl.com.pk', 'Near Miss NM-2026-0001 Submitted', 'A high-potential vehicle and pedestrian near miss requires investigation.', 0, 'delivered', 'read', '2026-07-28 09:42:00.000', '2026-07-28 09:42:04.000', 2, 2),
    (2, 'in_app_notification', 3, 'bilal.hussain@cbl.com.pk', 'Near Miss NM-2026-0002 Submitted', 'Please review the electrical panel latch observation.', 0, 'delivered', 'unread', '2026-07-30 14:22:00.000', '2026-07-30 14:22:00.000', 3, 3),
    (3, 'escalation', 1, 'ahmed.raza@cbl.com.pk', 'Contractor Near Miss Escalation', 'The workshop contractor slip near miss requires follow-up before the next night shift.', 1, 'sent', 'unread', '2026-08-01 22:00:00.000', NULL, 4, 4);

SELECT notification_id, near_miss_id, notification_type, delivery_status, read_status, retry_count
FROM near_miss_notifications WHERE deleted_at IS NULL ORDER BY notification_id;
