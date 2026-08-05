-- ==================================================
-- TABLE NAME
--   injury_details
--
-- Purpose
--   Medical and occupational injury facts used for TRIR, LTIR, lost-time days,
--   restricted-duty days, treatment analysis, and return-to-work tracking.
--
-- Relationships
--   incidents, employees or contractors as injured persons, and users.
--
-- Indexes
--   Incident/person, treatment type, hospitalization, lost days, recovery, deletion.
--
-- Workflow
--   Initial medical entry -> treatment updates -> fitness certificate -> return to work.
--
-- Author
--   CBL HSE Database Architecture
--
-- Version
--   1.0.0 | Phase 5 | MySQL 8
-- ==================================================

USE cbl_hse;

CREATE TABLE IF NOT EXISTS injury_details (
    injury_detail_id       BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    incident_id            BIGINT UNSIGNED NOT NULL,
    injured_employee_id    CHAR(36) NULL,
    injured_contractor_id  CHAR(36) NULL,
    body_part              VARCHAR(150) NOT NULL,
    nature_of_injury       VARCHAR(250) NOT NULL,
    treatment_type         ENUM('first_aid', 'medical_treatment', 'hospitalization', 'fatality', 'none') NOT NULL,
    hospital               VARCHAR(255) NULL,
    doctor                 VARCHAR(200) NULL,
    hospitalization        BOOLEAN NOT NULL DEFAULT FALSE,
    days_lost              DECIMAL(8,2) NOT NULL DEFAULT 0.00,
    restricted_duty_days   DECIMAL(8,2) NOT NULL DEFAULT 0.00,
    medical_expenses       DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    recovery_date          DATE NULL,
    return_to_work_date    DATE NULL,
    fitness_certificate    VARCHAR(1000) NULL COMMENT 'Cloud path or certificate reference.',
    created_by             BIGINT UNSIGNED NOT NULL,
    updated_by             BIGINT UNSIGNED NOT NULL,
    created_at             DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at             DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at             DATETIME(3) NULL,

    PRIMARY KEY (injury_detail_id),
    CONSTRAINT chk_injury_person CHECK ((injured_employee_id IS NOT NULL AND injured_contractor_id IS NULL) OR (injured_employee_id IS NULL AND injured_contractor_id IS NOT NULL)),
    CONSTRAINT chk_injury_metrics CHECK (days_lost >= 0 AND restricted_duty_days >= 0 AND medical_expenses >= 0),
    CONSTRAINT chk_injury_return_date CHECK (return_to_work_date IS NULL OR recovery_date IS NULL OR return_to_work_date >= recovery_date),
    CONSTRAINT fk_injury_incident FOREIGN KEY (incident_id) REFERENCES incidents (incident_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_injury_employee FOREIGN KEY (injured_employee_id) REFERENCES employees (employee_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_injury_contractor FOREIGN KEY (injured_contractor_id) REFERENCES contractors (contractor_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_injury_created_by FOREIGN KEY (created_by) REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_injury_updated_by FOREIGN KEY (updated_by) REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_injury_case_person (incident_id, injured_employee_id, injured_contractor_id),
    INDEX idx_injury_treatment (treatment_type, hospitalization),
    INDEX idx_injury_lost_days (days_lost, restricted_duty_days),
    INDEX idx_injury_recovery (return_to_work_date),
    INDEX idx_injury_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Medical injury details supporting OSHA and enterprise HSE injury KPIs.';

INSERT INTO injury_details
    (incident_id, injured_employee_id, injured_contractor_id, body_part, nature_of_injury, treatment_type, hospital, doctor, hospitalization, days_lost, restricted_duty_days, medical_expenses, recovery_date, return_to_work_date, fitness_certificate, created_by, updated_by)
VALUES
    (1, 'EMP-PROD-003', NULL, 'Left hand', 'Laceration', 'first_aid', 'CBL Plant Medical Room', 'Nurse Ayesha Malik', FALSE, 0.00, 0.00, 450.00, '2026-07-14', '2026-07-14', 'hse/incidents/INC-2026-000001/medical/fitness-first-aid.pdf', 2, 2),
    (2, 'EMP-ENG-002', NULL, 'Right hand and forearm', 'Electrical shock and contact burn', 'medical_treatment', 'Sukkur Civil Hospital', 'Dr. Hamid Ali', FALSE, 0.00, 3.00, 18500.00, '2026-07-24', '2026-07-25', 'hse/incidents/INC-2026-000002/medical/fitness-certificate.pdf', 3, 3),
    (3, NULL, 'CON-005', 'Face and hands', 'Smoke exposure', 'first_aid', 'CBL Plant Medical Room', 'Nurse Ayesha Malik', FALSE, 0.00, 0.00, 700.00, '2026-07-26', '2026-07-26', 'hse/incidents/INC-2026-000003/medical/contractor-fitness.pdf', 3, 3),
    (4, NULL, 'CON-001', 'Right knee', 'Contusion from rack impact', 'medical_treatment', 'Sukkur Civil Hospital', 'Dr. Hamid Ali', FALSE, 0.00, 5.00, 7200.00, '2026-08-02', '2026-08-03', 'hse/incidents/INC-2026-000004/medical/fitness-certificate.pdf', 2, 2),
    (5, 'EMP-ENG-002', NULL, 'Left foot', 'Minor crush injury', 'first_aid', 'CBL Plant Medical Room', 'Nurse Ayesha Malik', FALSE, 0.00, 1.00, 350.00, '2026-08-03', '2026-08-04', 'hse/incidents/INC-2026-000005/medical/fitness-certificate.pdf', 3, 3);

SELECT injury_detail_id, incident_id, body_part, nature_of_injury, treatment_type, days_lost, restricted_duty_days
FROM injury_details WHERE deleted_at IS NULL ORDER BY incident_id;
