-- ==================================================
-- TABLE NAME
--   tm_training_topics
--
-- Purpose
--   Normalized topic catalog. Every topic belongs to one Training Management type.
--
-- Relationships
--   tm_training_types parent; tm_training_sessions child; users audit changes.
--
-- Indexes
--   Type/status, duration, topic name, and soft-delete filtering.
--
-- Workflow
--   Active topics are selectable for sessions; inactive topics remain historical.
--
-- Author
--   CBL HSE Database Architecture
--
-- Version
--   1.0.0 | Training Management Extension | MySQL 8
-- ==================================================

USE cbl_hse;

CREATE TABLE IF NOT EXISTS tm_training_topics (
    training_topic_id      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    training_type_id       BIGINT UNSIGNED NOT NULL,
    topic_name             VARCHAR(200) NOT NULL,
    estimated_duration_min SMALLINT UNSIGNED NOT NULL,
    description            VARCHAR(600) NULL,
    training_material_link VARCHAR(1000) NULL,
    status                 ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    created_by             BIGINT UNSIGNED NOT NULL,
    updated_by             BIGINT UNSIGNED NOT NULL,
    created_at             DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at             DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at             DATETIME(3) NULL,
    PRIMARY KEY (training_topic_id),
    UNIQUE KEY uq_tm_training_topic_type_name (training_type_id, topic_name),
    CONSTRAINT chk_tm_training_topic_duration CHECK (estimated_duration_min > 0),
    CONSTRAINT fk_tm_training_topic_type FOREIGN KEY (training_type_id) REFERENCES tm_training_types (training_type_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_tm_training_topic_created_by FOREIGN KEY (created_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_tm_training_topic_updated_by FOREIGN KEY (updated_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_tm_training_topic_type_status (training_type_id, status),
    INDEX idx_tm_training_topic_duration (estimated_duration_min),
    INDEX idx_tm_training_topic_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Training Management topic catalog.';

INSERT INTO tm_training_topics (training_topic_id, training_type_id, topic_name, estimated_duration_min, description, status, created_by, updated_by)
VALUES
 (1,18,'Site Induction',240,'Plant rules, hazards, emergency routes, and reporting.', 'active',1,1),(2,18,'Contractor Site Induction',180,'Contractor rules and permit expectations.', 'active',1,1),(3,15,'Fire Fighting',240,'Extinguisher selection and practical response.', 'active',1,1),(4,15,'Fire Prevention',120,'Ignition control and fire risk reduction.', 'active',1,1),(5,19,'Emergency Evacuation',180,'Alarm, assembly, accountability, and evacuation.', 'active',1,1),(6,19,'Emergency Command System',240,'Emergency roles and communications.', 'active',1,1),(7,7,'Daily Toolbox Talk',30,'Short task-specific safety briefing.', 'active',1,1),(8,7,'Permit to Work Briefing',45,'Permit interfaces and field verification.', 'active',1,1),(9,6,'Emergency Drill Coordination',240,'Plan and execute a response drill.', 'active',1,1),(10,12,'Electrical Safety',240,'Electrical hazards, boundaries, and safe work.', 'active',1,1),(11,12,'LOTO',360,'Energy isolation and verification.', 'active',1,1),(12,12,'Arc Flash Awareness',180,'Arc flash boundaries and PPE.', 'active',1,1),(13,13,'Machine Guarding',240,'Guarding, interlocks, and inspections.', 'active',1,1),(14,13,'Mechanical Maintenance Safety',240,'Stored energy and mechanical hazards.', 'active',1,1),(15,14,'Chemical Handling',240,'SDS, storage, PPE, and transfer.', 'active',1,1),(16,14,'Chemical Spill Response',180,'Containment, notification, and cleanup.', 'active',1,1),(17,10,'Food Hygiene',180,'Personal hygiene and contamination prevention.', 'active',1,1),(18,9,'HACCP Principles',360,'Hazard analysis and critical control points.', 'active',1,1),(19,10,'GMP Practices',240,'Good manufacturing practices.', 'active',1,1),(20,8,'ISO 45001 Awareness',180,'OH&S management-system awareness.', 'active',1,1),(21,8,'ISO 9001 Awareness',180,'Quality management-system awareness.', 'active',1,1),(22,8,'ISO 14001 Awareness',180,'Environmental management-system awareness.', 'active',1,1),(23,11,'Behavior Based Safety',180,'Observation, coaching, and feedback.', 'active',1,1),(24,11,'Safety Leadership',240,'Visible leadership and accountability.', 'active',1,1),(25,5,'PPE Awareness',120,'Selection, use, care, and limitations.', 'active',1,1),(26,3,'First Aid',360,'Basic first aid and initial response.', 'active',1,1),(27,3,'CPR and AED',360,'CPR and AED practical certification.', 'active',1,1),(28,16,'Contractor HSE Controls',180,'Contractor planning and supervision.', 'active',1,1),(29,17,'Visitor Safety Briefing',30,'Visitor routes and emergency actions.', 'active',1,1),(30,20,'Environmental Awareness',180,'Aspects, impacts, waste, and prevention.', 'active',1,1),(31,20,'Waste Segregation',120,'Segregation, storage, and disposal.', 'active',1,1),(32,20,'Spill Prevention',120,'Environmental spill controls.', 'active',1,1),(33,4,'Fire Refresher',120,'Annual fire refresher.', 'active',1,1),(34,4,'LOTO Refresher',180,'Annual isolation refresher.', 'active',1,1),(35,4,'First Aid Refresher',180,'Renewal of first-aid competence.', 'active',1,1),(36,3,'Working at Height',360,'Fall prevention and rescue.', 'active',1,1),(37,3,'Confined Space',360,'Entry, testing, and rescue.', 'active',1,1),(38,13,'Forklift Safety',240,'Forklift operation and pedestrian controls.', 'active',1,1),(39,13,'Boiler Safety',240,'Boiler operation and emergency controls.', 'active',1,1),(40,13,'Pressure Vessel Safety',240,'Pressure equipment risk controls.', 'active',1,1),(41,6,'Emergency First Responder',240,'Initial emergency medical response.', 'active',1,1),(42,2,'External Auditor Skills',480,'Auditing methods and evidence evaluation.', 'active',1,1),(43,1,'Incident Investigation',360,'Causal analysis and corrective actions.', 'active',1,1),(44,1,'Risk Assessment',240,'Hazard identification and risk controls.', 'active',1,1),(45,5,'Stop Work Authority',90,'Recognition and intervention.', 'active',1,1),(46,20,'Environmental Legal Register',180,'Legal obligations and review.', 'active',1,1),(47,10,'Allergen Control',180,'Allergen prevention and labeling.', 'active',1,1),(48,9,'Critical Control Point Monitoring',240,'CCP monitoring and verification.', 'active',1,1),(49,11,'Safety Observation Quality',120,'Quality observations and learning.', 'active',1,1),(50,2,'Trainer Development',240,'Adult learning and assessment design.', 'active',1,1);

SELECT COUNT(*) AS topic_count FROM tm_training_topics WHERE deleted_at IS NULL;
