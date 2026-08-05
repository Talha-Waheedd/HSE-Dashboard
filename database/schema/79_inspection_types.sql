-- ==================================================
-- TABLE NAME
--   am_inspection_types
--
-- Purpose
--   Configurable inspection master for fire, equipment, workplace, environmental,
--   food safety, contractor, visitor, and emergency inspections.
--
-- Relationships
--   Referenced by am_inspections and am_inspection_checklists; departments own responsibility.
--
-- Indexes
--   Unique name/code, interval/priority, responsible department, active status, deletion.
--
-- Workflow
--   Active inspection types drive recurring inspection schedules.
--
-- Author
--   CBL HSE Database Architecture
--
-- Version
--   1.0.0 | Audit and Inspection Extension | MySQL 8
-- ==================================================

USE cbl_hse;

CREATE TABLE IF NOT EXISTS am_inspection_types (
    inspection_type_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name              VARCHAR(150) NOT NULL,
    inspection_interval ENUM('daily','weekly','monthly','quarterly','annual','ad_hoc') NOT NULL,
    priority          ENUM('low','medium','high','critical') NOT NULL DEFAULT 'medium',
    responsible_department_id CHAR(36) NOT NULL,
    active            BOOLEAN NOT NULL DEFAULT TRUE,
    description       VARCHAR(500) NULL,
    created_by        BIGINT UNSIGNED NOT NULL,
    updated_by        BIGINT UNSIGNED NOT NULL,
    created_at        DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at        DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at        DATETIME(3) NULL,
    PRIMARY KEY (inspection_type_id),
    UNIQUE KEY uq_am_inspection_type_name (name),
    CONSTRAINT fk_am_inspection_type_department FOREIGN KEY (responsible_department_id) REFERENCES departments (department_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_am_inspection_type_created_by FOREIGN KEY (created_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_am_inspection_type_updated_by FOREIGN KEY (updated_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_am_inspection_type_interval_priority (inspection_interval, priority),
    INDEX idx_am_inspection_type_department (responsible_department_id, active),
    INDEX idx_am_inspection_type_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Inspection scheduling and responsibility master.';

INSERT INTO am_inspection_types (inspection_type_id,name,inspection_interval,priority,responsible_department_id,active,description,created_by,updated_by) VALUES
 (1,'Fire Extinguisher','monthly','critical','DEP-HSE-001',TRUE,'Extinguisher condition and access.',1,1),(2,'Emergency Exit','monthly','critical','DEP-HSE-001',TRUE,'Exit access, lighting, and signage.',1,1),(3,'PPE','weekly','medium','DEP-HSE-001',TRUE,'PPE availability and condition.',1,1),(4,'Machine Guard','monthly','high','DEP-ENG-001',TRUE,'Guards, interlocks, and emergency stops.',3,3),(5,'Electrical Panel','quarterly','critical','DEP-ENG-001',TRUE,'Panel condition, labeling, and isolation.',3,3),(6,'Boiler','monthly','critical','DEP-ENG-001',TRUE,'Boiler operating and protection controls.',3,3),(7,'Compressor','monthly','high','DEP-ENG-001',TRUE,'Compressor safety and maintenance.',3,3),(8,'Warehouse','weekly','high','DEP-STORES-001',TRUE,'Storage, traffic, and racking.',2,2),(9,'Housekeeping','daily','medium','DEP-HSE-001',TRUE,'Workplace housekeeping condition.',2,2),(10,'Forklift','daily','high','DEP-STORES-001',TRUE,'Pre-use forklift checks.',2,2),(11,'Chemical Storage','weekly','high','DEP-HSE-001',TRUE,'Chemical storage and SDS controls.',2,2),(12,'First Aid Box','monthly','medium','DEP-HSE-001',TRUE,'First aid stock and expiry.',2,2),(13,'Spill Kit','monthly','high','DEP-HSE-001',TRUE,'Spill kit availability and readiness.',2,2),(14,'Confined Space','quarterly','critical','DEP-ENG-001',TRUE,'Entry equipment and rescue readiness.',3,3),(15,'Working at Height','monthly','critical','DEP-ENG-001',TRUE,'Anchors, harnesses, and rescue equipment.',3,3),(16,'Fire Hydrant','monthly','critical','DEP-HSE-001',TRUE,'Hydrant pressure and access.',1,1),(17,'Emergency Shower','monthly','high','DEP-ENG-001',TRUE,'Emergency shower and eyewash readiness.',3,3),(18,'Vehicle','daily','high','DEP-STORES-001',TRUE,'Vehicle roadworthiness.',2,2),(19,'Environmental','monthly','high','DEP-HSE-001',TRUE,'Waste, spill, and emissions controls.',2,2),(20,'Food Safety','weekly','high','DEP-PROD-001',TRUE,'Food hygiene and GMP controls.',4,4),(21,'Contractor','weekly','high','DEP-HSE-001',TRUE,'Contractor worksite controls.',2,2),(22,'Visitor','ad_hoc','low','DEP-HSE-001',TRUE,'Visitor route and induction controls.',2,2),(23,'Pressure Vessel','quarterly','critical','DEP-ENG-001',TRUE,'Pressure equipment inspection.',3,3),(24,'Building','quarterly','medium','DEP-ADMIN-001',TRUE,'Building condition and egress.',1,1),(25,'Monthly Walkthrough','monthly','medium','DEP-HSE-001',TRUE,'Management workplace walkthrough.',1,1);

SELECT inspection_type_id,name,inspection_interval,priority,responsible_department_id FROM am_inspection_types WHERE deleted_at IS NULL ORDER BY inspection_type_id;
