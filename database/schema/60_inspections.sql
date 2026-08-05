-- ==================================================
-- TABLE NAME
--   inspections
--
-- Purpose
--   Main inspection execution register supporting routine calendars, scores,
--   compliance percentages, findings, and action tracking.
--
-- Relationships
--   inspection_types, plants, departments, locations, employees, statuses, and users.
--
-- Indexes
--   Generated number, type/date, plant/date, department/date, inspector/date,
--   status/score, location/date, and deletion.
--
-- Workflow
--   Scheduled -> In Progress -> Closed. Findings and non-conformities may remain open.
--
-- Author
--   CBL HSE Database Architecture
--
-- Version
--   1.0.0 | Phase 7 | MySQL 8
-- ==================================================

USE cbl_hse;

CREATE TABLE IF NOT EXISTS inspections (
    inspection_id       BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    inspection_number   VARCHAR(24) GENERATED ALWAYS AS (CONCAT('INS-', YEAR(inspection_date), '-', LPAD(inspection_id, 5, '0'))) STORED,
    inspection_type_id  BIGINT UNSIGNED NOT NULL,
    plant_id            CHAR(36) NOT NULL,
    department_id       CHAR(36) NULL,
    location_id         CHAR(36) NULL,
    inspector_id        CHAR(36) NOT NULL,
    inspection_date     DATE NOT NULL,
    inspection_time     TIME NOT NULL,
    score               DECIMAL(5,2) NULL,
    compliance_percent  DECIMAL(5,2) NULL,
    status_id            BIGINT UNSIGNED NOT NULL DEFAULT 34 COMMENT 'FK -> statuses.status_id; inspections module.',
    remarks             TEXT NULL,
    created_by          BIGINT UNSIGNED NOT NULL,
    updated_by          BIGINT UNSIGNED NOT NULL,
    created_at          DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at          DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at          DATETIME(3) NULL,
    PRIMARY KEY (inspection_id),
    UNIQUE KEY uq_inspection_number (inspection_number),
    CONSTRAINT chk_inspection_scores CHECK ((score IS NULL OR score BETWEEN 0 AND 100) AND (compliance_percent IS NULL OR compliance_percent BETWEEN 0 AND 100)),
    CONSTRAINT fk_inspection_type FOREIGN KEY (inspection_type_id) REFERENCES inspection_types (inspection_type_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_inspection_plant FOREIGN KEY (plant_id) REFERENCES plants (plant_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_inspection_department FOREIGN KEY (department_id) REFERENCES departments (department_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_inspection_location FOREIGN KEY (location_id) REFERENCES locations (location_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_inspection_inspector FOREIGN KEY (inspector_id) REFERENCES employees (employee_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_inspection_status FOREIGN KEY (status_id) REFERENCES statuses (status_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_inspection_created_by FOREIGN KEY (created_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_inspection_updated_by FOREIGN KEY (updated_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_inspection_type_date (inspection_type_id, inspection_date),
    INDEX idx_inspection_plant_date (plant_id, inspection_date),
    INDEX idx_inspection_department_date (department_id, inspection_date),
    INDEX idx_inspection_inspector_date (inspector_id, inspection_date),
    INDEX idx_inspection_status_score (status_id, compliance_percent),
    INDEX idx_inspection_location_date (location_id, inspection_date),
    INDEX idx_inspection_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Enterprise inspection schedule and execution register.';

INSERT INTO inspections
    (inspection_type_id, plant_id, department_id, location_id, inspector_id, inspection_date, inspection_time, score, compliance_percent, status_id, remarks, created_by, updated_by)
VALUES
    (1, 'PLT-CBL-SKR-001', 'DEP-PROD-001', 'LOC-PROD-L1', 'EMP-HSE-002', '2026-08-01', '09:00:00', 94.00, 94.00, 36, 'Daily production area inspection completed.', 2, 2),
    (6, 'PLT-CBL-SKR-001', 'DEP-ENG-001', 'LOC-WORKSHOP', 'EMP-HSE-003', '2026-08-02', '10:00:00', 81.00, 81.00, 36, 'Machine guarding observations raised.', 3, 3),
    (8, 'PLT-CBL-SKR-001', 'DEP-HSE-001', 'LOC-ADMIN', 'EMP-HSE-002', '2026-08-03', '11:00:00', 100.00, 100.00, 36, 'All extinguishers accessible and tagged.', 2, 2),
    (14, 'PLT-CBL-SKR-001', 'DEP-STORES-001', 'LOC-WH', 'EMP-HSE-003', '2026-08-04', '08:30:00', 76.00, 76.00, 35, 'Inspection in progress with rack and traffic checks.', 3, 3),
    (17, 'PLT-CBL-SKR-001', 'DEP-PROD-001', 'LOC-PROD-L1', 'EMP-HSE-002', '2026-08-05', '13:00:00', 91.00, 91.00, 36, 'Food hygiene inspection completed with two observations.', 2, 2);

SELECT inspection_id, inspection_number, inspection_type_id, inspection_date, score, compliance_percent, status_id
FROM inspections WHERE deleted_at IS NULL ORDER BY inspection_date;
