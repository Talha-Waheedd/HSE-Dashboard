-- ==================================================
-- TABLE NAME
--   incident_witnesses
--
-- Purpose
--   Unlimited witness registry and statements for incident investigations.
--   Supports employees, contractors, and external visitors without duplicating
--   master-person records.
--
-- Relationships
--   incidents, employees, contractors, and users.
--
-- Indexes
--   Incident/statement date, employee, contractor, visitor, and deletion.
--
-- Workflow
--   Witness identified -> statement captured -> optional digital signature retained.
--
-- Author
--   CBL HSE Database Architecture
--
-- Version
--   1.0.0 | Phase 5 | MySQL 8
-- ==================================================

USE cbl_hse;

CREATE TABLE IF NOT EXISTS incident_witnesses (
    witness_id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    incident_id                BIGINT UNSIGNED NOT NULL,
    employee_id                CHAR(36) NULL,
    contractor_id              CHAR(36) NULL,
    visitor_name               VARCHAR(200) NULL,
    visitor_company            VARCHAR(255) NULL,
    witness_statement          TEXT NOT NULL,
    contact_number             VARCHAR(30) NULL,
    email                      VARCHAR(255) NULL,
    statement_date             DATETIME(3) NOT NULL,
    digital_signature_placeholder VARCHAR(255) NULL,
    created_by                 BIGINT UNSIGNED NOT NULL,
    updated_by                 BIGINT UNSIGNED NOT NULL,
    created_at                 DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at                 DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at                 DATETIME(3) NULL,

    PRIMARY KEY (witness_id),
    CONSTRAINT chk_incident_witness_person CHECK ((employee_id IS NOT NULL AND contractor_id IS NULL AND visitor_name IS NULL) OR (employee_id IS NULL AND contractor_id IS NOT NULL AND visitor_name IS NULL) OR (employee_id IS NULL AND contractor_id IS NULL AND visitor_name IS NOT NULL)),
    CONSTRAINT fk_incident_witness_incident FOREIGN KEY (incident_id) REFERENCES incidents (incident_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_incident_witness_employee FOREIGN KEY (employee_id) REFERENCES employees (employee_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_incident_witness_contractor FOREIGN KEY (contractor_id) REFERENCES contractors (contractor_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_incident_witness_created_by FOREIGN KEY (created_by) REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_incident_witness_updated_by FOREIGN KEY (updated_by) REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_incident_witness_case_date (incident_id, statement_date),
    INDEX idx_incident_witness_employee (employee_id),
    INDEX idx_incident_witness_contractor (contractor_id),
    INDEX idx_incident_witness_visitor (visitor_name),
    INDEX idx_incident_witness_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Incident witnesses and signed statement metadata.';

INSERT INTO incident_witnesses
    (incident_id, employee_id, contractor_id, visitor_name, visitor_company, witness_statement, contact_number, email, statement_date, digital_signature_placeholder, created_by, updated_by)
VALUES
    (1, 'EMP-PROD-002', NULL, NULL, NULL, 'I saw the operator stop the line and report the hand laceration immediately.', '0304-5678901', 'usman.farooq@cbl.com.pk', '2026-07-14 11:00:00.000', 'SIG-WITNESS-INC000001-01', 2, 2),
    (2, 'EMP-HSE-002', NULL, NULL, NULL, 'The panel was opened during troubleshooting and the employee contacted an energized component.', '0301-2345678', 'sara.ali@cbl.com.pk', '2026-07-20 18:30:00.000', 'SIG-WITNESS-INC000002-01', 3, 3),
    (3, NULL, 'CON-005', NULL, NULL, 'I observed the small flame and used the extinguisher while the permit holder called the supervisor.', '0355-5555555', 'mustafa@sukkurmech.com', '2026-07-25 22:45:00.000', NULL, 3, 3),
    (4, NULL, NULL, 'Imran Shah', 'Sukkur Logistics Services', 'The forklift was reversing into the warehouse aisle when the rack guard was struck.', '0312-8888888', 'imran@sukkurlogistics.example', '2026-07-29 09:15:00.000', NULL, 2, 2),
    (5, 'EMP-ENG-001', NULL, NULL, NULL, 'The pump was lifted as a routine task and the sling shifted before the pump dropped.', '0306-7890123', 'zafar.iqbal@cbl.com.pk', '2026-08-02 14:00:00.000', 'SIG-WITNESS-INC000005-01', 3, 3);

SELECT witness_id, incident_id, employee_id, contractor_id, visitor_name, statement_date
FROM incident_witnesses WHERE deleted_at IS NULL ORDER BY incident_id, witness_id;
