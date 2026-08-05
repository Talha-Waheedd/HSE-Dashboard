-- ==================================================
-- TABLE NAME
--   incidents
--
-- Purpose
--   Enterprise incident and accident register from initial reporting through
--   permanent closure. Supports ISO 45001, OSHA metrics, SAP EHS workflow,
--   contractor reporting, cost analysis, and executive dashboards.
--
-- Relationships
--   plants, departments, locations, employees, contractors, incident_categories,
--   hazard_categories, risk_ratings, statuses, hazards, near_misses, and users.
--   Corrective actions are linked in 34_incident_corrective_actions.sql.
--
-- Indexes
--   Generated number, plant/date, department/date, status/plant, category/date,
--   severity/date, employee/contractor reporting, and dashboard dimensions.
--
-- Workflow
--   Draft -> Reported -> Under Investigation -> Pending Approval -> Approved
--   -> Closed. Status transitions are recorded in 36_incident_status_history.sql.
--
-- Author
--   CBL HSE Database Architecture
--
-- Version
--   1.0.0 | Phase 5 | MySQL 8
-- ==================================================

USE cbl_hse;

CREATE TABLE IF NOT EXISTS incidents (
    incident_id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    incident_number             VARCHAR(24) GENERATED ALWAYS AS (
                                    CONCAT('INC-', YEAR(event_datetime), '-', LPAD(incident_id, 6, '0'))
                                ) STORED,
    event_datetime              DATETIME(3) NOT NULL,
    plant_id                    CHAR(36) NOT NULL,
    department_id               CHAR(36) NULL,
    location_id                 CHAR(36) NULL,
    shift_code                  ENUM('day', 'evening', 'night', 'rotating', 'unknown') NOT NULL DEFAULT 'unknown',
    reported_by                 CHAR(36) NOT NULL,
    affected_employee_id        CHAR(36) NULL,
    affected_contractor_id      CHAR(36) NULL,
    primary_witness_employee_id CHAR(36) NULL COMMENT 'Optional primary witness; unlimited witnesses are stored in 38_incident_witnesses.sql.',
    incident_category_id        BIGINT UNSIGNED NOT NULL,
    hazard_category_id          BIGINT UNSIGNED NULL,
    risk_rating_id              BIGINT UNSIGNED NULL,
    severity                    ENUM('minor', 'moderate', 'serious', 'critical', 'catastrophic') NOT NULL,
    description                 TEXT NOT NULL,
    immediate_actions           TEXT NULL,
    body_part_injured           VARCHAR(150) NULL,
    nature_of_injury            VARCHAR(250) NULL,
    property_damage             BOOLEAN NOT NULL DEFAULT FALSE,
    estimated_cost              DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    production_loss             DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    environmental_impact        TEXT NULL,
    linked_hazard_id            BIGINT UNSIGNED NULL,
    linked_near_miss_id         BIGINT UNSIGNED NULL,
    linked_capa_action_id       BIGINT UNSIGNED NULL COMMENT 'Logical link to 34_incident_corrective_actions.action_id; FK is added after that table exists.',
    requires_investigation      BOOLEAN NOT NULL DEFAULT FALSE,
    requires_rca                BOOLEAN NOT NULL DEFAULT FALSE,
    status_id                   BIGINT UNSIGNED NOT NULL DEFAULT 18 COMMENT 'FK -> statuses.status_id; incidents module.',
    remarks                     TEXT NULL,
    created_by                  BIGINT UNSIGNED NOT NULL,
    updated_by                  BIGINT UNSIGNED NOT NULL,
    created_at                  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at                  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at                  DATETIME(3) NULL,

    PRIMARY KEY (incident_id),
    UNIQUE KEY uq_incidents_number (incident_number),
    CONSTRAINT chk_incident_costs CHECK (estimated_cost >= 0.00 AND production_loss >= 0.00),
    CONSTRAINT chk_incident_person_scope CHECK (affected_employee_id IS NOT NULL OR affected_contractor_id IS NOT NULL OR body_part_injured IS NULL),
    CONSTRAINT fk_incident_plant FOREIGN KEY (plant_id) REFERENCES plants (plant_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_incident_department FOREIGN KEY (department_id) REFERENCES departments (department_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_incident_location FOREIGN KEY (location_id) REFERENCES locations (location_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_incident_reported_by FOREIGN KEY (reported_by) REFERENCES employees (employee_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_incident_affected_employee FOREIGN KEY (affected_employee_id) REFERENCES employees (employee_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_incident_affected_contractor FOREIGN KEY (affected_contractor_id) REFERENCES contractors (contractor_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_incident_primary_witness FOREIGN KEY (primary_witness_employee_id) REFERENCES employees (employee_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_incident_category FOREIGN KEY (incident_category_id) REFERENCES incident_categories (incident_category_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_incident_hazard_category FOREIGN KEY (hazard_category_id) REFERENCES hazard_categories (category_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_incident_risk_rating FOREIGN KEY (risk_rating_id) REFERENCES risk_ratings (risk_rating_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_incident_status FOREIGN KEY (status_id) REFERENCES statuses (status_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_incident_hazard FOREIGN KEY (linked_hazard_id) REFERENCES hazards (hazard_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_incident_near_miss FOREIGN KEY (linked_near_miss_id) REFERENCES near_misses (near_miss_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_incident_created_by FOREIGN KEY (created_by) REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_incident_updated_by FOREIGN KEY (updated_by) REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_incident_plant_event (plant_id, event_datetime),
    INDEX idx_incident_department_event (department_id, event_datetime),
    INDEX idx_incident_status_plant (status_id, plant_id),
    INDEX idx_incident_category_event (incident_category_id, event_datetime),
    INDEX idx_incident_severity_event (severity, event_datetime),
    INDEX idx_incident_employee_event (affected_employee_id, event_datetime),
    INDEX idx_incident_contractor_event (affected_contractor_id, event_datetime),
    INDEX idx_incident_linked_hazard (linked_hazard_id),
    INDEX idx_incident_linked_near_miss (linked_near_miss_id),
    INDEX idx_incident_linked_capa (linked_capa_action_id),
    INDEX idx_incident_investigation_rca (requires_investigation, requires_rca, status_id),
    INDEX idx_incident_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Enterprise incident and accident lifecycle hub.';

INSERT INTO incidents
    (event_datetime, plant_id, department_id, location_id, shift_code, reported_by, affected_employee_id,
     affected_contractor_id, primary_witness_employee_id, incident_category_id, hazard_category_id,
     risk_rating_id, severity, description, immediate_actions, body_part_injured, nature_of_injury,
     property_damage, estimated_cost, production_loss, environmental_impact, linked_hazard_id,
     linked_near_miss_id, requires_investigation, requires_rca, status_id, remarks, created_by, updated_by)
VALUES
    ('2026-07-14 10:25:00.000', 'PLT-CBL-SKR-001', 'DEP-PROD-001', 'LOC-PROD-L1', 'day', 'EMP-PROD-003', 'EMP-PROD-003', NULL, 'EMP-PROD-002', 2, 17, 3, 'moderate', 'An operator sustained a minor hand laceration while clearing a sharp film edge from the packing machine.', 'Line stopped, first aid applied, guard checked, and the edge was removed under supervisor control.', 'Left hand', 'Laceration', FALSE, 0.00, 12500.00, NULL, NULL, NULL, TRUE, FALSE, 23, 'Returned to normal duty after first aid and supervisor review.', 2, 2),
    ('2026-07-20 16:40:00.000', 'PLT-CBL-SKR-001', 'DEP-ENG-001', 'LOC-ELEC', 'day', 'EMP-ENG-002', 'EMP-ENG-002', NULL, 'EMP-HSE-002', 15, 1, 2, 'serious', 'An electrician received an electrical shock during troubleshooting of an energized MCC compartment.', 'Power isolated, emergency response initiated, employee sent for medical evaluation, and the panel locked out.', 'Right hand', 'Electrical shock and minor contact burn', FALSE, 18500.00, 42000.00, NULL, NULL, NULL, TRUE, TRUE, 21, 'Pending formal plant manager review and regulatory assessment.', 3, 3),
    ('2026-07-25 22:10:00.000', 'PLT-CBL-SKR-001', 'DEP-ENG-001', 'LOC-BOILER', 'night', 'EMP-ENG-002', NULL, 'CON-005', 'EMP-HSE-003', 7, 4, 3, 'moderate', 'A small oil flame developed at a boiler-area maintenance tray during contractor hot work preparation.', 'Hot work stopped, extinguisher used, area isolated, and fire watch re-established.', NULL, NULL, TRUE, 95000.00, 65000.00, 'No release beyond the contained maintenance tray.', NULL, 3, TRUE, FALSE, 22, 'Fire report and permit-to-work review completed.', 3, 3),
    ('2026-07-29 08:15:00.000', 'PLT-CBL-SKR-001', 'DEP-STORES-001', 'LOC-WH', 'day', 'EMP-PROD-002', NULL, 'CON-001', 'EMP-PROD-001', 12, 12, 2, 'serious', 'A contractor forklift struck a warehouse rack upright while reversing, damaging stored packaging material and the rack guard.', 'Area cordoned off, forklift removed from service, rack inspected, and inventory quarantined.', NULL, NULL, TRUE, 275000.00, 180000.00, NULL, NULL, NULL, TRUE, TRUE, 20, 'Contractor driving assessment and traffic management review required.', 2, 2),
    ('2026-08-02 13:05:00.000', 'PLT-CBL-SKR-001', 'DEP-ENG-001', 'LOC-WORKSHOP', 'day', 'EMP-ENG-002', NULL, NULL, 'EMP-HSE-002', 10, 2, 3, 'moderate', 'A maintenance technician dropped a portable pump, damaging the casing and causing a short shutdown of the workshop task.', 'Equipment isolated, damaged pump tagged, and lifting method reviewed with the maintenance team.', NULL, NULL, TRUE, 68000.00, 24000.00, NULL, NULL, 1, TRUE, FALSE, 19, 'Linked to the earlier vehicle and pedestrian control review for shared workshop traffic.', 3, 3);

SELECT incident_id, incident_number, event_datetime, incident_category_id, severity, status_id
FROM incidents WHERE deleted_at IS NULL ORDER BY event_datetime;
