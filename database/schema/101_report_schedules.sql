-- ==================================================
-- TABLE NAME
--   ra_report_schedules and ra_report_schedule_recipients
--
-- Purpose
--   Schedules report generation while keeping recipient rows normalized.
--
-- Relationships
--   A saved report has many schedules and each schedule has many recipients.
--
-- Indexes
--   Report/frequency, next run, active queue, and recipient delivery lookup.
--
-- Workflow
--   Configure -> queue at next_run -> generate -> update last_run -> calculate next run.
--
-- Author
--   CBL HSE Database Architecture
--
-- Version
--   1.0.0 | Reporting and Analytics Extension | MySQL 8
-- ==================================================

USE cbl_hse;

CREATE TABLE IF NOT EXISTS ra_report_schedules (
    schedule_id     BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    report_id       BIGINT UNSIGNED NOT NULL,
    frequency       ENUM('Daily','Weekly','Monthly','Quarterly','Yearly') NOT NULL,
    next_run        DATETIME(3) NOT NULL,
    last_run        DATETIME(3) NULL,
    active          BOOLEAN NOT NULL DEFAULT TRUE,
    created_by      BIGINT UNSIGNED NOT NULL,
    updated_by      BIGINT UNSIGNED NOT NULL,
    created_at      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at      DATETIME(3) NULL,
    PRIMARY KEY (schedule_id),
    CONSTRAINT fk_ra_schedule_report FOREIGN KEY (report_id) REFERENCES ra_saved_reports(report_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_ra_schedule_created_by FOREIGN KEY (created_by) REFERENCES users(user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_ra_schedule_updated_by FOREIGN KEY (updated_by) REFERENCES users(user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_ra_schedule_queue (active,next_run),
    INDEX idx_ra_schedule_report (report_id,frequency),
    INDEX idx_ra_schedule_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Scheduled report generation queue.';

CREATE TABLE IF NOT EXISTS ra_report_schedule_recipients (
    recipient_id    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    schedule_id     BIGINT UNSIGNED NOT NULL,
    employee_id     CHAR(36) NULL,
    recipient_email VARCHAR(255) NULL,
    created_by      BIGINT UNSIGNED NOT NULL,
    updated_by      BIGINT UNSIGNED NOT NULL,
    created_at      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at      DATETIME(3) NULL,
    PRIMARY KEY (recipient_id),
    CONSTRAINT chk_ra_recipient_target CHECK (employee_id IS NOT NULL OR recipient_email IS NOT NULL),
    CONSTRAINT fk_ra_recipient_schedule FOREIGN KEY (schedule_id) REFERENCES ra_report_schedules(schedule_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_ra_recipient_employee FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_ra_recipient_created_by FOREIGN KEY (created_by) REFERENCES users(user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_ra_recipient_updated_by FOREIGN KEY (updated_by) REFERENCES users(user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    UNIQUE KEY uq_ra_schedule_recipient_email (schedule_id,recipient_email),
    INDEX idx_ra_recipient_schedule (schedule_id),
    INDEX idx_ra_recipient_employee (employee_id),
    INDEX idx_ra_recipient_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Normalized report schedule recipient list.';

INSERT INTO ra_report_schedules
    (report_id,frequency,next_run,last_run,active,created_by,updated_by)
VALUES
 (1,'Monthly','2026-09-01 07:00:00', '2026-08-01 07:00:00',TRUE,1,1),
 (2,'Weekly','2026-08-03 08:00:00', '2026-07-27 08:00:00',TRUE,2,2),
 (3,'Monthly','2026-09-01 08:30:00', '2026-08-01 08:30:00',TRUE,2,2),
 (4,'Quarterly','2026-10-01 09:00:00', '2026-07-01 09:00:00',TRUE,1,1),
 (5,'Monthly','2026-09-01 09:15:00', '2026-08-01 09:15:00',TRUE,1,1),
 (6,'Weekly','2026-08-03 09:30:00', '2026-07-27 09:30:00',TRUE,4,4),
 (7,'Monthly','2026-09-01 10:00:00', '2026-08-01 10:00:00',TRUE,4,4),
 (8,'Weekly','2026-08-03 10:30:00', '2026-07-27 10:30:00',TRUE,2,2),
 (9,'Monthly','2026-09-01 11:00:00', '2026-08-01 11:00:00',TRUE,1,1),
 (10,'Weekly','2026-08-03 11:30:00', '2026-07-27 11:30:00',TRUE,2,2),
 (11,'Quarterly','2026-10-01 12:00:00', '2026-07-01 12:00:00',TRUE,1,1),
 (12,'Monthly','2026-09-01 12:30:00', '2026-08-01 12:30:00',TRUE,2,2),
 (13,'Monthly','2026-09-01 13:00:00', '2026-08-01 13:00:00',TRUE,1,1),
 (14,'Weekly','2026-08-03 13:30:00', '2026-07-27 13:30:00',TRUE,2,2),
 (15,'Yearly','2027-01-02 07:00:00', '2026-01-02 07:00:00',TRUE,1,1);

INSERT INTO ra_report_schedule_recipients
    (schedule_id,employee_id,recipient_email,created_by,updated_by)
VALUES
 (1,'EMP-HSE-001',NULL,1,1),(1,NULL,'plant.manager@cbl.com.pk',1,1),
 (2,'EMP-HSE-002',NULL,2,2),(2,'EMP-PROD-001',NULL,2,2),
 (3,'EMP-HSE-003',NULL,2,2),(3,NULL,'hse@cbl.com.pk',2,2),
 (4,'EMP-HSE-001',NULL,1,1),(4,NULL,'directors@cbl.com.pk',1,1),
 (5,'EMP-HSE-001',NULL,1,1),(5,'EMP-HSE-002',NULL,1,1),
 (6,'EMP-PROD-001',NULL,4,4),(6,'EMP-HSE-002',NULL,4,4),
 (7,'EMP-HSE-003',NULL,4,4),(7,NULL,'training@cbl.com.pk',4,4),
 (8,'EMP-HSE-002',NULL,2,2),(8,'EMP-ENG-001',NULL,2,2),
 (9,'EMP-HSE-001',NULL,1,1),(9,NULL,'quality@cbl.com.pk',1,1),
 (10,'EMP-HSE-002',NULL,2,2),(10,'EMP-ENG-001',NULL,2,2),
 (11,'EMP-HSE-001',NULL,1,1),(11,NULL,'plant.manager@cbl.com.pk',1,1),
 (12,'EMP-HSE-002',NULL,2,2),(12,'EMP-QC-001',NULL,2,2),
 (13,'EMP-HSE-001',NULL,1,1),(13,NULL,'finance@cbl.com.pk',1,1),
 (14,'EMP-HSE-003',NULL,2,2),(14,'EMP-PROD-002',NULL,2,2),
 (15,'EMP-HSE-001',NULL,1,1),(15,NULL,'directors@cbl.com.pk',1,1);
