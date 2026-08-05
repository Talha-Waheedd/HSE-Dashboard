-- ==================================================
-- TABLE NAME
--   audit_checklist_items
--
-- Purpose
--   Unlimited questions and requirements belonging to reusable audit checklists.
--
-- Relationships
--   audit_checklist_templates and users.
--
-- Indexes
--   Template/sequence, mandatory/evidence queues, standard reference, deletion.
--
-- Workflow
--   Items are answered during audit execution; revisions create a new template version.
--
-- Author
--   CBL HSE Database Architecture
--
-- Version
--   1.0.0 | Phase 7 | MySQL 8
-- ==================================================

USE cbl_hse;

CREATE TABLE IF NOT EXISTS audit_checklist_items (
    checklist_item_id      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    checklist_template_id  BIGINT UNSIGNED NOT NULL,
    question               TEXT NOT NULL,
    requirement            TEXT NOT NULL,
    standard_reference     VARCHAR(150) NULL,
    expected_answer        VARCHAR(500) NOT NULL,
    weight                 DECIMAL(8,2) NOT NULL DEFAULT 1.00,
    sequence_number        SMALLINT UNSIGNED NOT NULL,
    mandatory              BOOLEAN NOT NULL DEFAULT TRUE,
    evidence_required      BOOLEAN NOT NULL DEFAULT FALSE,
    created_by             BIGINT UNSIGNED NOT NULL,
    updated_by             BIGINT UNSIGNED NOT NULL,
    created_at             DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at             DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at             DATETIME(3) NULL,
    PRIMARY KEY (checklist_item_id),
    UNIQUE KEY uq_audit_checklist_sequence (checklist_template_id, sequence_number),
    CONSTRAINT chk_audit_checklist_weight CHECK (weight > 0),
    CONSTRAINT fk_audit_checklist_item_template FOREIGN KEY (checklist_template_id) REFERENCES audit_checklist_templates (checklist_template_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_audit_checklist_item_created_by FOREIGN KEY (created_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_audit_checklist_item_updated_by FOREIGN KEY (updated_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_audit_checklist_sequence (checklist_template_id, sequence_number),
    INDEX idx_audit_checklist_mandatory_evidence (mandatory, evidence_required),
    INDEX idx_audit_checklist_standard (standard_reference),
    INDEX idx_audit_checklist_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Reusable audit checklist questions and requirements.';

INSERT INTO audit_checklist_items
    (checklist_template_id, question, requirement, standard_reference, expected_answer, weight, sequence_number, mandatory, evidence_required, created_by, updated_by)
VALUES
    (1, 'Are HSE objectives established and monitored?', 'Objectives must be measurable, communicated, and reviewed.', 'ISO 45001:6.2', 'Documented objective with current evidence', 3.00, 1, TRUE, TRUE, 1, 1),
    (1, 'Are incident investigations completed for significant events?', 'Investigations identify immediate, underlying, and system causes.', 'ISO 45001:10.2', 'Investigation and actions available', 4.00, 2, TRUE, TRUE, 1, 1),
    (2, 'Are production personnel following hygiene requirements?', 'Personnel practices must prevent product contamination.', 'GMP Personnel Hygiene', 'Compliant observation', 3.00, 1, TRUE, TRUE, 1, 1),
    (3, 'Is lockout verification documented before electrical work?', 'Isolation must be verified at the point of work.', 'OSHA 1910.147', 'Permit and verification record', 5.00, 1, TRUE, TRUE, 3, 3),
    (4, 'Are environmental legal requirements reviewed on schedule?', 'Register review must identify changes and action owners.', 'ISO 14001:6.1.3', 'Current register and review evidence', 4.00, 1, TRUE, TRUE, 2, 2),
    (5, 'Are pedestrian and forklift routes physically segregated?', 'Traffic routes must be marked, maintained, and controlled.', 'ISO 45001:8.1', 'Effective segregation observed', 5.00, 1, TRUE, TRUE, 3, 3);

SELECT checklist_item_id, checklist_template_id, sequence_number, standard_reference, mandatory, evidence_required
FROM audit_checklist_items WHERE deleted_at IS NULL ORDER BY checklist_template_id, sequence_number;
