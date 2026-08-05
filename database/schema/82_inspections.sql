-- ==================================================
-- TABLE NAME
--   am_inspections
--
-- Purpose
--   Main inspection schedule and execution register for 25 operational inspections.
--
-- Relationships
--   am_inspection_types, plants, departments, locations, employees, users.
--
-- Indexes
--   Inspection/next due dates, type, plant, department, inspector, status, score, deletion.
--
-- Workflow
--   Planned -> In Progress -> Completed or Cancelled.
--
-- Author
--   CBL HSE Database Architecture
--
-- Version
--   1.0.0 | Audit and Inspection Extension | MySQL 8
-- ==================================================

USE cbl_hse;

CREATE TABLE IF NOT EXISTS am_inspections (
    inspection_id       BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    inspection_number   VARCHAR(30) GENERATED ALWAYS AS (CONCAT('AM-INS-',YEAR(inspection_date),'-',LPAD(inspection_id,5,'0'))) STORED,
    inspection_type_id  BIGINT UNSIGNED NOT NULL,
    plant_id            CHAR(36) NOT NULL,
    department_id       CHAR(36) NULL,
    location_id         CHAR(36) NULL,
    inspector_id        CHAR(36) NOT NULL,
    inspection_date     DATE NOT NULL,
    next_due_date       DATE NULL,
    status              ENUM('planned','in_progress','completed','cancelled') NOT NULL DEFAULT 'planned',
    overall_result      ENUM('pass','fail','observation','not_started') NOT NULL DEFAULT 'not_started',
    score               DECIMAL(5,2) NULL,
    remarks             TEXT NULL,
    created_by          BIGINT UNSIGNED NOT NULL,
    updated_by          BIGINT UNSIGNED NOT NULL,
    created_at          DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at          DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at          DATETIME(3) NULL,
    PRIMARY KEY (inspection_id),
    UNIQUE KEY uq_am_inspection_number (inspection_number),
    CONSTRAINT chk_am_inspection_score CHECK (score IS NULL OR score BETWEEN 0 AND 100),
    CONSTRAINT chk_am_inspection_next_due CHECK (next_due_date IS NULL OR next_due_date >= inspection_date),
    CONSTRAINT fk_am_inspection_type FOREIGN KEY (inspection_type_id) REFERENCES am_inspection_types (inspection_type_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_am_inspection_plant FOREIGN KEY (plant_id) REFERENCES plants (plant_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_am_inspection_department FOREIGN KEY (department_id) REFERENCES departments (department_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_am_inspection_location FOREIGN KEY (location_id) REFERENCES locations (location_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_am_inspection_inspector FOREIGN KEY (inspector_id) REFERENCES employees (employee_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_am_inspection_created_by FOREIGN KEY (created_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_am_inspection_updated_by FOREIGN KEY (updated_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_am_inspection_date_due (inspection_date, next_due_date),
    INDEX idx_am_inspection_type (inspection_type_id, inspection_date),
    INDEX idx_am_inspection_plant_department (plant_id, department_id),
    INDEX idx_am_inspection_inspector (inspector_id, inspection_date),
    INDEX idx_am_inspection_status_score (status, score),
    INDEX idx_am_inspection_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Operational inspection calendar and execution register.';

INSERT INTO am_inspections (inspection_id,inspection_type_id,plant_id,department_id,location_id,inspector_id,inspection_date,next_due_date,status,overall_result,score,remarks,created_by,updated_by)
SELECT i.inspection_type_id, i.inspection_type_id,'PLT-CBL-SKR-001',i.responsible_department_id,
       CASE WHEN i.inspection_type_id IN (1,2,12,13,16,17,19,22,24,25) THEN 'LOC-ADMIN' WHEN i.inspection_type_id IN (8,10,18) THEN 'LOC-WH' WHEN i.inspection_type_id IN (20) THEN 'LOC-PROD-L1' ELSE 'LOC-WORKSHOP' END,
       CASE WHEN MOD(i.inspection_type_id,3)=0 THEN 'EMP-HSE-003' WHEN MOD(i.inspection_type_id,3)=1 THEN 'EMP-HSE-002' ELSE 'EMP-HSE-001' END,
       DATE_ADD('2026-07-01',INTERVAL i.inspection_type_id DAY), DATE_ADD('2026-07-01',INTERVAL (i.inspection_type_id+30) DAY),
       CASE WHEN i.inspection_type_id <= 18 THEN 'completed' ELSE 'planned' END,
       CASE WHEN i.inspection_type_id <= 18 AND MOD(i.inspection_type_id,5)=0 THEN 'fail' WHEN i.inspection_type_id <= 18 THEN 'pass' ELSE 'not_started' END,
       CASE WHEN i.inspection_type_id <= 18 THEN 70 + MOD(i.inspection_type_id*7,31) ELSE NULL END,
       CONCAT('Seeded inspection for ',i.name,'.'),1,1
FROM am_inspection_types i;

SELECT COUNT(*) AS inspection_count FROM am_inspections WHERE deleted_at IS NULL;
