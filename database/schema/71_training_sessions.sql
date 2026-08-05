-- ==================================================
-- TABLE NAME
--   tm_training_sessions
--
-- Purpose
--   Training Management event register. One row represents one conducted or
--   scheduled training event with provider, location, capacity, cost, and status.
--
-- Relationships
--   tm_training_topics, tm_training_types, tm_training_providers, plants,
--   departments, locations, employees as trainer/coordinator, and users.
--
-- Indexes
--   Generated number, date, topic/type/provider, department, plant, status, expiry, deletion.
--
-- Workflow
--   Planned -> In Progress -> Completed or Cancelled.
--
-- Author
--   CBL HSE Database Architecture
--
-- Version
--   1.0.0 | Training Management Extension | MySQL 8
-- ==================================================

USE cbl_hse;

CREATE TABLE IF NOT EXISTS tm_training_sessions (
    training_session_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    training_number     VARCHAR(24) GENERATED ALWAYS AS (CONCAT('TM-TRN-', YEAR(training_date), '-', LPAD(training_session_id, 5, '0'))) STORED,
    training_topic_id   BIGINT UNSIGNED NOT NULL,
    training_type_id    BIGINT UNSIGNED NOT NULL,
    training_provider_id BIGINT UNSIGNED NOT NULL,
    plant_id            CHAR(36) NOT NULL,
    department_id       CHAR(36) NULL,
    location_id         CHAR(36) NULL,
    training_date       DATE NOT NULL,
    start_time          TIME NOT NULL,
    end_time            TIME NOT NULL,
    duration_minutes    SMALLINT UNSIGNED NOT NULL,
    venue               VARCHAR(255) NULL,
    mode                ENUM('online', 'offline', 'hybrid') NOT NULL,
    trainer_employee_id CHAR(36) NULL,
    coordinator_id      CHAR(36) NOT NULL,
    maximum_capacity    SMALLINT UNSIGNED NOT NULL,
    actual_attendance   SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    cost                DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    certificate_required BOOLEAN NOT NULL DEFAULT FALSE,
    certificate_expiry  DATE NULL,
    remarks             TEXT NULL,
    status              ENUM('planned', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'planned',
    created_by          BIGINT UNSIGNED NOT NULL,
    updated_by          BIGINT UNSIGNED NOT NULL,
    created_at          DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at          DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at          DATETIME(3) NULL,
    PRIMARY KEY (training_session_id),
    UNIQUE KEY uq_tm_training_number (training_number),
    CONSTRAINT chk_tm_session_time CHECK (end_time > start_time AND duration_minutes > 0),
    CONSTRAINT chk_tm_session_capacity CHECK (maximum_capacity > 0 AND actual_attendance <= maximum_capacity AND cost >= 0),
    CONSTRAINT chk_tm_session_certificate CHECK (certificate_required = FALSE OR certificate_expiry IS NOT NULL),
    CONSTRAINT fk_tm_session_topic FOREIGN KEY (training_topic_id) REFERENCES tm_training_topics (training_topic_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_tm_session_type FOREIGN KEY (training_type_id) REFERENCES tm_training_types (training_type_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_tm_session_provider FOREIGN KEY (training_provider_id) REFERENCES tm_training_providers (training_provider_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_tm_session_plant FOREIGN KEY (plant_id) REFERENCES plants (plant_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_tm_session_department FOREIGN KEY (department_id) REFERENCES departments (department_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_tm_session_location FOREIGN KEY (location_id) REFERENCES locations (location_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_tm_session_trainer FOREIGN KEY (trainer_employee_id) REFERENCES employees (employee_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_tm_session_coordinator FOREIGN KEY (coordinator_id) REFERENCES employees (employee_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_tm_session_created_by FOREIGN KEY (created_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_tm_session_updated_by FOREIGN KEY (updated_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_tm_session_date (training_date, status),
    INDEX idx_tm_session_topic_type (training_topic_id, training_type_id),
    INDEX idx_tm_session_provider_date (training_provider_id, training_date),
    INDEX idx_tm_session_department_date (department_id, training_date),
    INDEX idx_tm_session_plant_date (plant_id, training_date),
    INDEX idx_tm_session_certificate_expiry (certificate_expiry),
    INDEX idx_tm_session_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Training Management session register and calendar.';

INSERT INTO tm_training_sessions
    (training_session_id, training_topic_id, training_type_id, training_provider_id, plant_id, department_id, location_id, training_date, start_time, end_time, duration_minutes, venue, mode, trainer_employee_id, coordinator_id, maximum_capacity, actual_attendance, cost, certificate_required, certificate_expiry, remarks, status, created_by, updated_by)
VALUES
 (1,1,18,1,'PLT-CBL-SKR-001','DEP-HSE-001','LOC-ADMIN','2026-07-02','09:00:00','13:00:00',240,'Admin Training Room','offline','EMP-HSE-001','EMP-HSE-002',30,10,12000,TRUE,'2028-07-01','New starter induction.','completed',1,1),
 (2,3,15,6,'PLT-CBL-SKR-001','DEP-HSE-001','LOC-ADMIN','2026-07-05','09:00:00','13:00:00',240,'Admin Training Room','offline',NULL,'EMP-HSE-002',40,10,22000,TRUE,'2027-07-04','Fire brigade practical.','completed',1,1),
 (3,11,12,3,'PLT-CBL-SKR-001','DEP-ENG-001','LOC-ELEC','2026-07-09','08:30:00','14:30:00',360,'Electrical Room Training Bay','hybrid','EMP-ENG-001','EMP-HSE-003',20,10,18000,TRUE,'2027-07-08','Authorized LOTO cohort.','completed',1,1),
 (4,18,9,10,'PLT-CBL-SKR-001','DEP-PROD-001','LOC-PROD-L1','2026-07-12','09:00:00','15:00:00',360,'Production Training Room','offline',NULL,'EMP-HSE-002',25,10,35000,TRUE,'2027-07-11','HACCP team training.','completed',1,1),
 (5,20,8,7,'PLT-CBL-SKR-001','DEP-HSE-001','LOC-ADMIN','2026-07-15','10:00:00','13:00:00',180,'Admin Training Room','online',NULL,'EMP-HSE-001',50,10,25000,FALSE,NULL,'ISO awareness session.','completed',1,1),
 (6,13,13,3,'PLT-CBL-SKR-001','DEP-ENG-001','LOC-WORKSHOP','2026-07-18','09:00:00','13:00:00',240,'Mechanical Workshop','offline','EMP-ENG-001','EMP-HSE-003',20,10,14000,FALSE,NULL,NULL,'completed',1,1),
 (7,15,14,4,'PLT-CBL-SKR-001','DEP-ENG-001','LOC-WORKSHOP','2026-07-21','09:00:00','13:00:00',240,'Chemical Store','offline',NULL,'EMP-HSE-002',20,10,30000,TRUE,'2027-07-20',NULL,'completed',1,1),
 (8,23,11,1,'PLT-CBL-SKR-001','DEP-HSE-001','LOC-ADMIN','2026-07-24','10:00:00','13:00:00',180,'Admin Training Room','hybrid','EMP-HSE-001','EMP-HSE-002',30,10,8000,FALSE,NULL,NULL,'completed',1,1),
 (9,5,19,5,'PLT-CBL-SKR-001','DEP-HSE-001','LOC-PARKING','2026-07-27','09:00:00','12:00:00',180,'Plant Assembly Area','offline',NULL,'EMP-HSE-002',80,10,18000,FALSE,NULL,'Emergency evacuation drill.','completed',1,1),
 (10,17,10,2,'PLT-CBL-SKR-001','DEP-PROD-001','LOC-PROD-L1','2026-08-01','09:00:00','12:00:00',180,'Production Line 1','offline',NULL,'EMP-HSE-002',30,10,10000,TRUE,'2027-07-31',NULL,'completed',1,1),
 (11,25,5,2,'PLT-CBL-SKR-001','DEP-PROD-001','LOC-PROD-L2','2026-08-04','09:00:00','11:00:00',120,'Production Line 2','offline',NULL,'EMP-HSE-002',30,10,7000,FALSE,NULL,NULL,'completed',1,1),
 (12,26,3,4,'PLT-CBL-SKR-001','DEP-HSE-001','LOC-ADMIN','2026-08-07','09:00:00','15:00:00',360,'Medical Room','offline',NULL,'EMP-HSE-001',15,10,42000,TRUE,'2028-08-06',NULL,'completed',1,1),
 (13,30,20,2,'PLT-CBL-SKR-001','DEP-HSE-001','LOC-BOILER','2026-08-10','09:00:00','12:00:00',180,'Boiler Training Area','offline',NULL,'EMP-HSE-002',25,10,12000,FALSE,NULL,NULL,'completed',1,1),
 (14,36,3,9,'PLT-CBL-SKR-001','DEP-ENG-001','LOC-WORKSHOP','2026-08-20','08:30:00','14:30:00',360,'Workshop Practical Bay','offline',NULL,'EMP-HSE-003',20,0,95000,TRUE,'2027-08-19','External height safety program.','planned',1,1),
 (15,34,4,3,'PLT-CBL-SKR-001','DEP-ENG-001','LOC-ELEC','2026-08-25','09:00:00','12:00:00',180,'Electrical Room Training Bay','hybrid','EMP-ENG-001','EMP-HSE-003',20,0,12000,TRUE,'2027-08-24','LOTO refresher.','planned',1,1);

SELECT training_session_id, training_number, training_date, training_type_id, training_provider_id, status FROM tm_training_sessions WHERE deleted_at IS NULL ORDER BY training_date;
