-- ==================================================
-- TABLE NAME
--   am_audits
--
-- Purpose
--   Main audit calendar and execution table for 15 realistic manufacturing audits.
--
-- Relationships
--   am_audit_types, plants, departments, locations, employees, users, and risk ratings.
--
-- Indexes
--   Audit/planned dates, plant, department, status, auditor, team leader, score, deletion.
--
-- Workflow
--   Planned -> In Progress -> Report Pending -> Approved -> Closed.
--
-- Author
--   CBL HSE Database Architecture
--
-- Version
--   1.0.0 | Audit and Inspection Extension | MySQL 8
-- ==================================================

USE cbl_hse;

CREATE TABLE IF NOT EXISTS am_audits (
    audit_id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    audit_number          VARCHAR(24) GENERATED ALWAYS AS (CONCAT('AM-AUD-',YEAR(audit_date),'-',LPAD(audit_id,5,'0'))) STORED,
    audit_type_id         BIGINT UNSIGNED NOT NULL,
    plant_id              CHAR(36) NOT NULL,
    department_id         CHAR(36) NULL,
    location_id           CHAR(36) NULL,
    audit_date            DATE NOT NULL,
    planned_date          DATE NOT NULL,
    auditor_id            CHAR(36) NOT NULL,
    audit_team_leader_id  CHAR(36) NOT NULL,
    scope                 TEXT NOT NULL,
    objective             TEXT NOT NULL,
    criteria              TEXT NOT NULL,
    standard              VARCHAR(200) NULL,
    status                ENUM('planned','in_progress','report_pending','approved','closed','cancelled') NOT NULL DEFAULT 'planned',
    overall_score         DECIMAL(5,2) NULL,
    compliance_percentage DECIMAL(5,2) NULL,
    remarks               TEXT NULL,
    created_by            BIGINT UNSIGNED NOT NULL,
    updated_by            BIGINT UNSIGNED NOT NULL,
    created_at            DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at            DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at            DATETIME(3) NULL,
    PRIMARY KEY (audit_id),
    UNIQUE KEY uq_am_audit_number (audit_number),
    CONSTRAINT chk_am_audit_scores CHECK ((overall_score IS NULL OR overall_score BETWEEN 0 AND 100) AND (compliance_percentage IS NULL OR compliance_percentage BETWEEN 0 AND 100)),
    CONSTRAINT fk_am_audit_type FOREIGN KEY (audit_type_id) REFERENCES am_audit_types (audit_type_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_am_audit_plant FOREIGN KEY (plant_id) REFERENCES plants (plant_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_am_audit_department FOREIGN KEY (department_id) REFERENCES departments (department_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_am_audit_location FOREIGN KEY (location_id) REFERENCES locations (location_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_am_audit_auditor FOREIGN KEY (auditor_id) REFERENCES employees (employee_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_am_audit_team_leader FOREIGN KEY (audit_team_leader_id) REFERENCES employees (employee_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_am_audit_created_by FOREIGN KEY (created_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_am_audit_updated_by FOREIGN KEY (updated_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_am_audit_date (audit_date, planned_date),
    INDEX idx_am_audit_plant_department (plant_id, department_id),
    INDEX idx_am_audit_status (status),
    INDEX idx_am_audit_auditor (auditor_id, audit_date),
    INDEX idx_am_audit_team_leader (audit_team_leader_id, audit_date),
    INDEX idx_am_audit_score (compliance_percentage),
    INDEX idx_am_audit_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Isolated enterprise audit calendar and execution register.';

INSERT INTO am_audits (audit_type_id,plant_id,department_id,location_id,audit_date,planned_date,auditor_id,audit_team_leader_id,scope,objective,criteria,standard,status,overall_score,compliance_percentage,remarks,created_by,updated_by)
VALUES
 (1,'PLT-CBL-SKR-001','DEP-HSE-001','LOC-ADMIN','2026-01-15','2026-01-15','EMP-HSE-002','EMP-HSE-001','Plant HSE system','Verify system implementation.','Document review and interviews.','ISO 45001','closed',88,88,'Minor documentation gaps.',1,1),
 (2,'PLT-CBL-SKR-001','DEP-HSE-001','LOC-ADMIN','2026-02-12','2026-02-12','EMP-HSE-003','EMP-HSE-001','Certification readiness','Assess external audit readiness.','Certification checklist.','ISO 45001','approved',91,91,'Ready for certification review.',1,1),
 (3,'PLT-CBL-SKR-001','DEP-QC-001','LOC-PROD-L1','2026-03-10','2026-03-10','EMP-HSE-002','EMP-HSE-001','Quality processes','Verify QMS controls.','Process sampling.','ISO 9001','closed',90,90,'Strong process control.',1,1),
 (4,'PLT-CBL-SKR-001','DEP-HSE-001','LOC-BOILER','2026-04-18','2026-04-18','EMP-HSE-002','EMP-HSE-001','Environmental controls','Review aspects and legal register.','Aspect and impact review.','ISO 14001','closed',84,84,'Waste contractor evidence pending.',2,2),
 (5,'PLT-CBL-SKR-001','DEP-HSE-001','LOC-PROD-L1','2026-05-09','2026-05-09','EMP-HSE-003','EMP-HSE-001','OH&S controls','Assess operational risk controls.','HSE audit protocol.','ISO 45001','closed',86,86,'Two findings closed.',1,1),
 (6,'PLT-CBL-SKR-001','DEP-PROD-001','LOC-PROD-L1','2026-06-05','2026-06-05','EMP-HSE-002','EMP-HSE-001','GMP practices','Verify hygiene and manufacturing controls.','GMP checklist.','GMP','approved',94,94,'Excellent housekeeping.',2,2),
 (7,'PLT-CBL-SKR-001','DEP-PROD-001','LOC-PROD-L1','2026-06-20','2026-06-20','EMP-HSE-002','EMP-HSE-001','HACCP plan','Verify CCP monitoring.','HACCP verification.','HACCP','closed',92,92,'CCP records complete.',2,2),
 (8,'PLT-CBL-SKR-001','DEP-ENG-001','LOC-ELEC','2026-07-08','2026-07-08','EMP-HSE-003','EMP-HSE-001','Electrical safety','Verify LOTO and panel controls.','Electrical safety standard.','OSHA 1910','report_pending',78,78,'Major finding on isolation verification.',3,3),
 (9,'PLT-CBL-SKR-001','DEP-ENG-001','LOC-WORKSHOP','2026-07-22','2026-07-22','EMP-HSE-002','EMP-HSE-001','Contractor safety','Review contractor controls.','Permit and induction sampling.','ISO 45001','closed',82,82,'Contractor evidence improved.',2,2),
 (10,'PLT-CBL-SKR-001','DEP-STORES-001','LOC-WH','2026-08-05','2026-08-05','EMP-HSE-003','EMP-HSE-001','Warehouse safety','Verify traffic and storage controls.','Warehouse checklist.','OSHA 1910','in_progress',76,76,'Traffic findings under action.',3,3),
 (11,'PLT-CBL-SKR-001','DEP-HSE-001','LOC-ADMIN','2026-08-15','2026-08-15','EMP-HSE-001','EMP-HSE-001','Emergency readiness','Verify drill and emergency resources.','Emergency preparedness.','ISO 45001','planned',NULL,NULL,'Scheduled after annual drill.',1,1),
 (12,'PLT-CBL-SKR-001','DEP-HSE-001','LOC-BOILER','2026-09-01','2026-09-01','EMP-HSE-002','EMP-HSE-001','Legal compliance','Review applicable legal obligations.','Legal register review.','Sindh Labour Law','planned',NULL,NULL,'Regulatory evidence requested.',2,2),
 (13,'PLT-CBL-SKR-001','DEP-ENG-001','LOC-WORKSHOP','2026-09-18','2026-09-18','EMP-HSE-003','EMP-HSE-001','Machine safety','Review guards and emergency stops.','Machine checklist.','ISO 45001','planned',NULL,NULL,'Coordinate with maintenance shutdown.',3,3),
 (14,'PLT-CBL-SKR-001','DEP-PROD-001','LOC-PROD-L1','2026-10-10','2026-10-10','EMP-HSE-002','EMP-HSE-001','Food safety','Review food safety culture and controls.','Food safety protocol.','HACCP','planned',NULL,NULL,'Annual food safety audit.',2,2),
 (15,'PLT-CBL-SKR-001','DEP-HSE-001','LOC-ADMIN','2026-11-20','2026-11-20','EMP-HSE-001','EMP-HSE-001','Management review','Review HSE performance and objectives.','Management review agenda.','ISO 45001','planned',NULL,NULL,'Executive review calendar.',1,1);

SELECT audit_id,audit_number,audit_date,audit_type_id,status,compliance_percentage FROM am_audits WHERE deleted_at IS NULL ORDER BY audit_date;
