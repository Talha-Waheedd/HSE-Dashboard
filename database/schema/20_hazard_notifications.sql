-- =============================================================================
-- 20_hazard_notifications.sql
-- CBL HSE Management System — Phase 3: Hazard Management Module
-- Table: hazard_notifications
--
-- Purpose:
--   Tracks all notifications (Email, In-App, SMS, etc.) sent regarding hazards.
--   Used to audit communication, track delivery failures, and prevent spam.
--   Supports asynchronous processing via message queues.
--
-- Relationships:
--   hazards (1) → hazard_notifications (many)
--   users   (1) → hazard_notifications.recipient_user (optional, can be raw email)
--
-- Depends on: 15_hazards.sql, 09_users.sql
-- Run: SOURCE database/schema/20_hazard_notifications.sql;
-- =============================================================================

USE cbl_hse;

-- -----------------------------------------------------------------------------
-- Table Definition
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS hazard_notifications (

    -- ── Identity ──────────────────────────────────────────────────────────────
    notification_id     BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT          COMMENT 'Surrogate PK.',

    -- ── Context ───────────────────────────────────────────────────────────────
    hazard_id           BIGINT UNSIGNED     NOT NULL                         COMMENT 'FK → hazards.hazard_id.',
    notification_type   ENUM(
                            'assignment',       -- New hazard assigned
                            'overdue',          -- Hazard is overdue
                            'escalation',       -- Hazard escalated to management
                            'review_requested', -- Corrective actions complete, review needed
                            'approved',         -- Hazard closed successfully
                            'rejected',         -- Corrective action rejected
                            'reminder'          -- General follow-up reminder
                        )                   NOT NULL                         COMMENT 'Type of notification. Determines the template used.',

    -- ── Recipient ─────────────────────────────────────────────────────────────
    recipient_user      BIGINT UNSIGNED     NULL                             COMMENT 'FK → users.user_id. NULL if sent to an external raw email address.',
    recipient_email     VARCHAR(255)        NOT NULL                         COMMENT 'The actual email address the notification was sent to.',

    -- ── Content ───────────────────────────────────────────────────────────────
    subject             VARCHAR(300)        NOT NULL                         COMMENT 'Email subject or push notification title.',
    message             TEXT                NOT NULL                         COMMENT 'Full text or HTML content of the notification.',
    channel             ENUM(
                            'email',
                            'in_app',
                            'sms',
                            'teams'
                        )                   NOT NULL DEFAULT 'email'         COMMENT 'Delivery channel used.',

    -- ── Status & Tracking ─────────────────────────────────────────────────────
    delivery_status     ENUM(
                            'pending',          -- Queued for sending
                            'sent',             -- Sent successfully to provider (e.g. SendGrid)
                            'failed',           -- Sending failed
                            'delivered'         -- Provider confirmed delivery (if webhook configured)
                        )                   NOT NULL DEFAULT 'pending'       COMMENT 'Current status of the notification delivery.',

    sent_at             DATETIME(3)         NULL                             COMMENT 'Timestamp when successfully dispatched.',
    read_at             DATETIME(3)         NULL                             COMMENT 'Timestamp when user opened the email/in-app message (if tracking pixel used).',
    acknowledged_at     DATETIME(3)         NULL                             COMMENT 'Timestamp when user explicitly clicked "Acknowledge" in the app.',

    -- ── Error Handling ────────────────────────────────────────────────────────
    retry_count         TINYINT UNSIGNED    NOT NULL DEFAULT 0               COMMENT 'Number of times sending was retried after failure.',
    error_message       TEXT                NULL                             COMMENT 'Error details from the email provider API if failed.',

    -- ── Audit Fields ──────────────────────────────────────────────────────────
    created_at          DATETIME(3)         NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at          DATETIME(3)         NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    -- ── Constraints ───────────────────────────────────────────────────────────
    PRIMARY KEY (notification_id),

    -- ── Foreign Keys ──────────────────────────────────────────────────────────
    CONSTRAINT fk_hnotif_hazard
        FOREIGN KEY (hazard_id)         REFERENCES hazards (hazard_id)
        ON UPDATE CASCADE ON DELETE CASCADE,

    CONSTRAINT fk_hnotif_recipient
        FOREIGN KEY (recipient_user)    REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE SET NULL,

    -- ── Indexes ───────────────────────────────────────────────────────────────
    INDEX idx_hnotif_hazard_id      (hazard_id),
    INDEX idx_hnotif_recipient      (recipient_user),
    INDEX idx_hnotif_status         (delivery_status),
    INDEX idx_hnotif_sent_at        (sent_at)

) ENGINE=InnoDB
  AUTO_INCREMENT=1
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Audit log and tracking for hazard-related notifications.';


-- =============================================================================
-- Seed Data
-- =============================================================================

INSERT INTO hazard_notifications (
    hazard_id, notification_type, recipient_user, recipient_email,
    subject, message, channel, delivery_status, sent_at
) VALUES
-- Assignment notification for HAZ-2026-SKR-00001
(1, 'assignment', 2, 'sara.ali@cbl.com.pk',
 'Hazard Assigned: Exposed Electrical Wiring',
 'You have been assigned to resolve Hazard HAZ-2026-SKR-00001. Target Date: 2026-08-04.',
 'email', 'sent', '2026-07-28 09:36:00'),

-- Assignment notification for HAZ-2026-SKR-00002
(2, 'assignment', 4, 'tariq.mehmood@cbl.com.pk',
 'Hazard Assigned: Oil Spill on Production Line 1',
 'You have been assigned to resolve Hazard HAZ-2026-SKR-00002. Target Date: 2026-08-06.',
 'email', 'sent', '2026-07-31 09:05:00');


-- =============================================================================
-- Verification
-- =============================================================================

SELECT
    hn.notification_id,
    h.hazard_number,
    hn.notification_type,
    hn.recipient_email,
    hn.subject,
    hn.delivery_status,
    hn.sent_at
FROM hazard_notifications hn
JOIN hazards h ON hn.hazard_id = h.hazard_id
ORDER BY hn.sent_at DESC;
