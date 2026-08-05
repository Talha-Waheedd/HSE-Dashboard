-- ==================================================
-- TABLE NAME
--   ra_saved_reports
--
-- Purpose
--   Stores user-created, reusable reporting definitions and saved filters.
--
-- Relationships
--   Owned by users and optionally scoped to a department.
--
-- Indexes
--   Report name, owner, type, department, visibility, and soft deletion.
--
-- Workflow
--   Draft -> save filters -> execute/export -> optionally schedule.
--
-- Author
--   CBL HSE Database Architecture
--
-- Version
--   1.0.0 | Reporting and Analytics Extension | MySQL 8
-- ==================================================

USE cbl_hse;

CREATE TABLE IF NOT EXISTS ra_saved_reports (
    report_id       BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    report_name     VARCHAR(180) NOT NULL,
    report_type     ENUM('executive','hazard','near_miss','incident','training','audit','capa','compliance','employee','department','custom') NOT NULL,
    owner_user_id   BIGINT UNSIGNED NOT NULL,
    department_id   CHAR(36) NULL,
    filters_json    JSON NULL,
    chart_type      ENUM('table','line','bar','pie','area','gauge','heatmap','scatter') NOT NULL DEFAULT 'table',
    export_format   ENUM('PDF','Excel','CSV','JSON') NOT NULL DEFAULT 'PDF',
    visibility      ENUM('private','department','plant','enterprise') NOT NULL DEFAULT 'private',
    created_by      BIGINT UNSIGNED NOT NULL,
    updated_by      BIGINT UNSIGNED NOT NULL,
    created_at      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at      DATETIME(3) NULL,
    PRIMARY KEY (report_id),
    CONSTRAINT fk_ra_report_owner FOREIGN KEY (owner_user_id) REFERENCES users(user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_ra_report_department FOREIGN KEY (department_id) REFERENCES departments(department_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_ra_report_created_by FOREIGN KEY (created_by) REFERENCES users(user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_ra_report_updated_by FOREIGN KEY (updated_by) REFERENCES users(user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_ra_report_name (report_name),
    INDEX idx_ra_report_owner (owner_user_id,visibility),
    INDEX idx_ra_report_department (department_id),
    INDEX idx_ra_report_type (report_type),
    INDEX idx_ra_report_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Saved report definitions and filter payloads.';

INSERT INTO ra_saved_reports
    (report_name,report_type,owner_user_id,department_id,filters_json,chart_type,export_format,visibility,created_by,updated_by)
VALUES
 ('Monthly Plant HSE Scorecard','executive',1,NULL,'{"year":2026,"plant":"PLT-CBL-SKR-001"}','table','PDF','enterprise',1,1),
 ('Open Hazards by Department','hazard',2,'DEP-HSE-001','{"status":"open","risk":["HIGH","EXTREME"]}','bar','Excel','department',2,2),
 ('Near Miss Closure Trend','near_miss',2,NULL,'{"from":"2026-01-01","to":"2026-12-31"}','line','PDF','plant',2,2),
 ('Incident Cost Analysis','incident',1,NULL,'{"year":2026,"include_production_loss":true}','area','Excel','enterprise',1,1),
 ('LTI and TRIR Review','incident',1,NULL,'{"severity":["serious","critical","catastrophic"]}','gauge','PDF','enterprise',1,1),
 ('Mandatory Training Compliance','training',4,'DEP-PROD-001','{"mandatory":true,"as_of":"2026-08-01"}','gauge','Excel','department',4,4),
 ('Training Manhours by Month','training',4,NULL,'{"year":2026}','line','CSV','plant',4,4),
 ('Audit Findings Aging','audit',2,NULL,'{"open_only":true,"age_days":30}','bar','PDF','plant',2,2),
 ('Department Audit Scorecard','audit',1,NULL,'{"year":2026}','heatmap','Excel','enterprise',1,1),
 ('CAPA Overdue Register','capa',2,NULL,'{"overdue_only":true}','table','Excel','plant',2,2),
 ('Regulatory Compliance Register','compliance',1,NULL,'{"mandatory":true}','table','PDF','enterprise',1,1),
 ('Employee Safety Participation','employee',2,NULL,'{"year":2026,"min_events":1}','bar','Excel','enterprise',2,2),
 ('Department Leading Indicators','department',1,NULL,'{"period":"monthly"}','line','PDF','enterprise',1,1),
 ('Risk Heat Map - Sukkur','custom',2,NULL,'{"probability":5,"severity":5}','heatmap','PDF','plant',2,2),
 ('Executive Yearly Comparison','executive',1,NULL,'{"years":[2024,2025,2026]}','bar','PDF','enterprise',1,1),
 ('Fire and Emergency Events','incident',2,'DEP-HSE-001','{"categories":["Fire","Emergency"]}','pie','Excel','department',2,2),
 ('Food Safety HSE Dashboard','audit',4,'DEP-QC-001','{"standard":"HACCP"}','gauge','PDF','department',4,4),
 ('Contractor Safety Performance','custom',2,NULL,'{"contractor_involved":true}','table','Excel','plant',2,2),
 ('Inspection and Audit Effectiveness','audit',1,NULL,'{"year":2026}','line','PDF','enterprise',1,1),
 ('HSE Cost and Loss Report','custom',1,NULL,'{"year":2026}','area','Excel','enterprise',1,1);
