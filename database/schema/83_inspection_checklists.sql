-- ==================================================
-- TABLE NAME
--   am_inspection_checklists
--
-- Purpose
--   Master checklist items for inspection types. Ten controlled requirements per
--   type provide 250 reusable items for the manufacturing plant.
--
-- Relationships
--   am_inspection_types and users.
--
-- Indexes
--   Type/sequence, active/mandatory, requirement text, deletion.
--
-- Workflow
--   Active item -> used in inspection results -> retired through soft deletion.
--
-- Author
--   CBL HSE Database Architecture
--
-- Version
--   1.0.0 | Audit and Inspection Extension | MySQL 8
-- ==================================================

USE cbl_hse;

CREATE TABLE IF NOT EXISTS am_inspection_checklists (
    checklist_item_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    inspection_type_id BIGINT UNSIGNED NOT NULL,
    checklist_name    VARCHAR(200) NOT NULL,
    sequence_number   SMALLINT UNSIGNED NOT NULL,
    requirement       TEXT NOT NULL,
    mandatory         BOOLEAN NOT NULL DEFAULT TRUE,
    active            BOOLEAN NOT NULL DEFAULT TRUE,
    created_by        BIGINT UNSIGNED NOT NULL,
    updated_by        BIGINT UNSIGNED NOT NULL,
    created_at        DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at        DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at        DATETIME(3) NULL,
    PRIMARY KEY (checklist_item_id),
    UNIQUE KEY uq_am_checklist_type_sequence (inspection_type_id, sequence_number),
    CONSTRAINT fk_am_checklist_type FOREIGN KEY (inspection_type_id) REFERENCES am_inspection_types (inspection_type_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_am_checklist_created_by FOREIGN KEY (created_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_am_checklist_updated_by FOREIGN KEY (updated_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_am_checklist_type_active (inspection_type_id, active),
    INDEX idx_am_checklist_sequence (sequence_number),
    INDEX idx_am_checklist_mandatory (mandatory, active),
    INDEX idx_am_checklist_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Reusable inspection checklist master items.';

INSERT INTO am_inspection_checklists (inspection_type_id,checklist_name,sequence_number,requirement,mandatory,active,created_by,updated_by)
SELECT t.inspection_type_id,t.name,n.seq,
       CASE n.seq WHEN 1 THEN 'Equipment or area is identified and accessible.' WHEN 2 THEN 'Required guards, seals, or barriers are present.' WHEN 3 THEN 'Labels, signs, and instructions are legible.' WHEN 4 THEN 'Emergency controls are available and functional.' WHEN 5 THEN 'No leakage, damage, or unsafe deterioration is observed.' WHEN 6 THEN 'Inspection or maintenance record is current.' WHEN 7 THEN 'Required PPE or response equipment is available.' WHEN 8 THEN 'Housekeeping and access are acceptable.' WHEN 9 THEN 'Responsible person and follow-up actions are recorded.' ELSE 'Evidence is captured for any failed condition.' END,
       CASE WHEN n.seq IN (1,2,4,5,6,9) THEN TRUE ELSE FALSE END,TRUE,1,1
FROM am_inspection_types t CROSS JOIN (SELECT 1 seq UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10) n;

SELECT COUNT(*) AS checklist_item_count FROM am_inspection_checklists WHERE deleted_at IS NULL;
