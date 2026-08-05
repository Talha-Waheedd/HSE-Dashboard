-- ==================================================
-- TABLE NAME
--   tm_training_notifications
--
-- Purpose
--   Training Management notifications for assignment, reminders, overdue actions,
--   certificate expiry, upcoming sessions, missed training, and escalation.
--
-- Relationships
--   tm_training_sessions, employees, users as recipients and audit owners.
--
-- Indexes
--   Session/employee/type, delivery queue, expiry/reminder, read status, deletion.
--
-- Workflow
--   Pending -> Sent -> Delivered/Failed; retry_count supports asynchronous delivery.
--
-- Author
--   CBL HSE Database Architecture
--
-- Version
--   1.0.0 | Training Management Extension | MySQL 8
-- ==================================================

USE cbl_hse;

CREATE TABLE IF NOT EXISTS tm_training_notifications (
    notification_id      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    training_session_id  BIGINT UNSIGNED NULL,
    employee_id          CHAR(36) NULL,
    notification_type    ENUM('employee_assigned', 'reminder', 'overdue', 'certificate_expiry', 'upcoming_training', 'missed_training', 'escalation') NOT NULL,
    recipient_user_id    BIGINT UNSIGNED NULL,
    recipient_address    VARCHAR(255) NOT NULL,
    subject              VARCHAR(300) NULL,
    message              TEXT NOT NULL,
    delivery_status      ENUM('pending', 'sent', 'delivered', 'failed') NOT NULL DEFAULT 'pending',
    retry_count          SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    sent_at              DATETIME(3) NULL,
    read_at              DATETIME(3) NULL,
    created_by           BIGINT UNSIGNED NOT NULL,
    updated_by           BIGINT UNSIGNED NOT NULL,
    created_at           DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at           DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at           DATETIME(3) NULL,
    PRIMARY KEY (notification_id),
    CONSTRAINT chk_tm_notification_source CHECK (training_session_id IS NOT NULL OR employee_id IS NOT NULL),
    CONSTRAINT fk_tm_notification_session FOREIGN KEY (training_session_id) REFERENCES tm_training_sessions (training_session_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_tm_notification_employee FOREIGN KEY (employee_id) REFERENCES employees (employee_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_tm_notification_recipient FOREIGN KEY (recipient_user_id) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_tm_notification_created_by FOREIGN KEY (created_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_tm_notification_updated_by FOREIGN KEY (updated_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_tm_notification_session_employee_type (training_session_id, employee_id, notification_type),
    INDEX idx_tm_notification_queue (delivery_status, retry_count, created_at),
    INDEX idx_tm_notification_sent_read (sent_at, read_at),
    INDEX idx_tm_notification_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Training Management notification delivery and reminder log.';

INSERT INTO tm_training_notifications (training_session_id, employee_id, notification_type, recipient_user_id, recipient_address, subject, message, delivery_status, retry_count, sent_at, read_at, created_by, updated_by)
VALUES
 (14,'EMP-ENG-002','employee_assigned',3,'hamza.qureshi@cbl.com.pk','Working at Height Assigned','You are assigned to the Working at Height session on 20 August 2026.','delivered',0,'2026-08-10 09:00:00.000','2026-08-10 09:01:00.000',1,1),
 (15,'EMP-ENG-002','upcoming_training',3,'hamza.qureshi@cbl.com.pk','LOTO Refresher Upcoming','LOTO refresher is scheduled for 25 August 2026.','sent',0,'2026-08-20 09:00:00.000',NULL,1,1),
 (NULL,'EMP-PROD-002','certificate_expiry',4,'tariq.mehmood@cbl.com.pk','Certificate Expiry','Your food safety certificate requires renewal.','delivered',0,'2026-07-01 08:00:00.000','2026-07-01 08:02:00.000',1,1),
 (NULL,'EMP-ENG-001','reminder',7,'zafar.iqbal@cbl.com.pk','TNA Reminder','Please review your outstanding electrical competency assessment.','pending',1,NULL,NULL,1,1),
 (2,'EMP-ENG-002','missed_training',7,'hamza.qureshi@cbl.com.pk','Attendance Follow-up','Please provide the reason for missed participation in the fire training session.','failed',2,NULL,NULL,1,1),
 (3,'EMP-ENG-002','escalation',1,'ahmed.raza@cbl.com.pk','LOTO Attendance Escalation','LOTO session attendance requires HSE Manager review.','delivered',0,'2026-07-10 08:00:00.000','2026-07-10 08:10:00.000',1,1);

SELECT notification_id, training_session_id, employee_id, notification_type, delivery_status, retry_count FROM tm_training_notifications WHERE deleted_at IS NULL ORDER BY notification_id;
