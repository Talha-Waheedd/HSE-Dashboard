-- ==================================================
-- TABLE NAME
--   inspection_checklists
--
-- Purpose
--   Stores inspection-level checklist results, observed conditions, evidence flags,
--   and comments for pass/fail/NA compliance analysis.
--
-- Relationships
--   inspections, audit_checklist_items, and users.
--
-- Indexes
--   Inspection/result, checklist item, photo-required queue, and deletion.
--
-- Workflow
--   Item assigned -> Observed -> Pass/Fail/NA -> evidence reviewed.
--
-- Author
--   CBL HSE Database Architecture
--
-- Version
--   1.0.0 | Phase 7 | MySQL 8
-- ==================================================

USE cbl_hse;

CREATE TABLE IF NOT EXISTS inspection_checklists (
    inspection_checklist_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    inspection_id           BIGINT UNSIGNED NOT NULL,
    checklist_item_id       BIGINT UNSIGNED NULL,
    checklist_item          TEXT NOT NULL,
    expected_condition      TEXT NOT NULL,
    observed_condition      TEXT NULL,
    result                  ENUM('pass', 'fail', 'na') NOT NULL,
    photo_required          BOOLEAN NOT NULL DEFAULT FALSE,
    comments                TEXT NULL,
    created_by              BIGINT UNSIGNED NOT NULL,
    updated_by              BIGINT UNSIGNED NOT NULL,
    created_at              DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at              DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at              DATETIME(3) NULL,
    PRIMARY KEY (inspection_checklist_id),
    CONSTRAINT chk_inspection_checklist_observation CHECK (result = 'na' OR observed_condition IS NOT NULL),
    CONSTRAINT fk_inspection_checklist_inspection FOREIGN KEY (inspection_id) REFERENCES inspections (inspection_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_inspection_checklist_item FOREIGN KEY (checklist_item_id) REFERENCES audit_checklist_items (checklist_item_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_inspection_checklist_created_by FOREIGN KEY (created_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_inspection_checklist_updated_by FOREIGN KEY (updated_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_inspection_checklist_result (inspection_id, result),
    INDEX idx_inspection_checklist_item (checklist_item_id),
    INDEX idx_inspection_checklist_photo (photo_required, result),
    INDEX idx_inspection_checklist_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Inspection checklist observations and pass/fail results.';

INSERT INTO inspection_checklists
    (inspection_id, checklist_item_id, checklist_item, expected_condition, observed_condition, result, photo_required, comments, created_by, updated_by)
VALUES
    (1, NULL, 'Emergency exits clear', 'Exit route is unobstructed and marked.', 'Exit route clear and marked.', 'pass', FALSE, NULL, 2, 2),
    (2, NULL, 'Machine guard secured', 'Guard is fitted, interlocked, and free of damage.', 'Guard fitted but one fastener loose.', 'fail', TRUE, 'Finding raised for maintenance correction.', 3, 3),
    (3, NULL, 'Extinguisher access', 'Extinguisher is accessible, tagged, and within inspection date.', 'All sampled extinguishers accessible and tagged.', 'pass', TRUE, NULL, 2, 2),
    (4, NULL, 'Forklift pedestrian segregation', 'Marked route is maintained and unobstructed.', 'Temporary pallet reduced aisle width.', 'fail', TRUE, 'Link to warehouse audit finding.', 3, 3),
    (5, NULL, 'Handwashing station', 'Station has water, soap, and disposable towels.', 'Water and soap available; towels replenished during inspection.', 'pass', FALSE, NULL, 2, 2);

SELECT inspection_checklist_id, inspection_id, checklist_item, result, photo_required
FROM inspection_checklists WHERE deleted_at IS NULL ORDER BY inspection_id, inspection_checklist_id;
