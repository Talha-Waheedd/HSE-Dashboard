-- ==================================================
-- TABLE NAME
--   tm_training_types
--
-- Purpose
--   Training Management module master catalog for internal, external, mandatory,
--   refresher, induction, emergency, ISO, food, process, and behavioral training.
--
-- Relationships
--   Referenced by tm_training_topics and tm_training_sessions; users audit changes.
--
-- Indexes
--   Unique code/name, active status, mandatory flag, and soft-delete filtering.
--
-- Workflow
--   Active -> Inactive; historical sessions retain their type reference.
--
-- Author
--   CBL HSE Database Architecture
--
-- Version
--   1.0.0 | Training Management Extension | MySQL 8
-- ==================================================

USE cbl_hse;

CREATE TABLE IF NOT EXISTS tm_training_types (
    training_type_id   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    training_type_name VARCHAR(150) NOT NULL,
    description        VARCHAR(500) NULL,
    validity_months    SMALLINT UNSIGNED NULL,
    mandatory_flag     BOOLEAN NOT NULL DEFAULT FALSE,
    status             ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    created_by         BIGINT UNSIGNED NULL,
    updated_by         BIGINT UNSIGNED NULL,
    created_at         DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at         DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at         DATETIME(3) NULL,
    PRIMARY KEY (training_type_id),
    UNIQUE KEY uq_tm_training_type_name (training_type_name),
    CONSTRAINT chk_tm_training_type_validity CHECK (validity_months IS NULL OR validity_months > 0),
    CONSTRAINT fk_tm_training_type_created_by FOREIGN KEY (created_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_tm_training_type_updated_by FOREIGN KEY (updated_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_tm_training_type_status (status, mandatory_flag),
    INDEX idx_tm_training_type_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Training Management extension type master.';

INSERT INTO tm_training_types (training_type_id, training_type_name, description, validity_months, mandatory_flag, created_by, updated_by)
VALUES
 (1,'Internal','CBL employee-led training.',NULL,FALSE,1,1),(2,'External','Training delivered by an approved external provider.',NULL,FALSE,1,1),(3,'Mandatory','Required by role, law, or company standard.',12,TRUE,1,1),(4,'Refresher','Periodic renewal of an existing competence.',12,TRUE,1,1),(5,'Awareness','General awareness and orientation.',24,FALSE,1,1),(6,'Emergency Drill','Practical emergency preparedness exercise.',12,TRUE,1,1),(7,'Toolbox Talk','Short task-focused safety discussion.',1,TRUE,1,1),(8,'ISO','ISO management-system training.',24,FALSE,1,1),(9,'HACCP','Hazard analysis and critical control point training.',12,TRUE,1,1),(10,'Food Safety','Food hygiene and food safety competence.',12,TRUE,1,1),(11,'Behavioral','Behavior-based safety and leadership.',24,FALSE,1,1),(12,'Electrical','Electrical safety and isolation training.',12,TRUE,1,1),(13,'Mechanical','Mechanical and machine safety training.',24,TRUE,1,1),(14,'Chemical','Chemical handling and spill response.',12,TRUE,1,1),(15,'Fire','Fire prevention, response, and evacuation.',12,TRUE,1,1),(16,'Contractor','Contractor site induction and controls.',12,TRUE,1,1),(17,'Visitor','Visitor safety briefing.',1,TRUE,1,1),(18,'Induction','New starter and site induction.',24,TRUE,1,1),(19,'Emergency Response','Emergency command and response roles.',12,TRUE,1,1),(20,'Environmental','Environmental aspects and controls.',12,TRUE,1,1);

SELECT training_type_id, training_type_name, validity_months, mandatory_flag, status FROM tm_training_types WHERE deleted_at IS NULL ORDER BY training_type_id;
