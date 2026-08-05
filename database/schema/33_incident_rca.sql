-- ==================================================
-- TABLE NAME
--   incident_rca
--
-- Purpose
--   Versioned root cause analysis for incidents requiring systemic learning,
--   corrective action, and management review.
--
-- Relationships
--   incidents, incident_investigations, employees as approvers, and users.
--
-- Indexes
--   Incident/version, methodology, approval queue, approval date, and deletion.
--
-- Workflow
--   Draft -> Pending Approval -> Approved or Rejected. New versions preserve history.
--
-- Author
--   CBL HSE Database Architecture
--
-- Version
--   1.0.0 | Phase 5 | MySQL 8
-- ==================================================

USE cbl_hse;

CREATE TABLE IF NOT EXISTS incident_rca (
    rca_id                    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    incident_id               BIGINT UNSIGNED NOT NULL,
    investigation_id          BIGINT UNSIGNED NOT NULL,
    version_no                SMALLINT UNSIGNED NOT NULL DEFAULT 1,
    methodology               ENUM('five_why', 'fishbone', 'fault_tree_analysis', 'bow_tie_analysis', 'taproot', 'tripod_beta', 'custom') NOT NULL,
    problem_statement         TEXT NOT NULL,
    root_cause_level_1        TEXT NOT NULL,
    root_cause_level_2        TEXT NULL,
    root_cause_level_3        TEXT NULL,
    root_cause_level_4        TEXT NULL,
    root_cause_level_5        TEXT NULL,
    immediate_cause           TEXT NOT NULL,
    underlying_cause          TEXT NOT NULL,
    system_cause              TEXT NOT NULL,
    final_root_cause          TEXT NOT NULL,
    corrective_recommendation TEXT NOT NULL,
    preventive_recommendation TEXT NOT NULL,
    management_review         TEXT NULL,
    approval_status           ENUM('draft', 'pending_approval', 'approved', 'rejected') NOT NULL DEFAULT 'draft',
    approved_by               CHAR(36) NULL,
    approved_at               DATETIME(3) NULL,
    comments                  TEXT NULL,
    created_by                BIGINT UNSIGNED NOT NULL,
    updated_by                BIGINT UNSIGNED NOT NULL,
    created_at                DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at                DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at                DATETIME(3) NULL,

    PRIMARY KEY (rca_id),
    UNIQUE KEY uq_incident_rca_version (incident_id, version_no),
    CONSTRAINT chk_incident_rca_approval CHECK ((approval_status IN ('draft', 'pending_approval') AND approved_by IS NULL AND approved_at IS NULL) OR (approval_status IN ('approved', 'rejected') AND approved_by IS NOT NULL AND approved_at IS NOT NULL)),
    CONSTRAINT fk_incident_rca_incident FOREIGN KEY (incident_id) REFERENCES incidents (incident_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_incident_rca_investigation FOREIGN KEY (investigation_id) REFERENCES incident_investigations (investigation_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_incident_rca_approver FOREIGN KEY (approved_by) REFERENCES employees (employee_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_incident_rca_created_by FOREIGN KEY (created_by) REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_incident_rca_updated_by FOREIGN KEY (updated_by) REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_incident_rca_method (methodology),
    INDEX idx_incident_rca_approval_queue (approval_status, created_at),
    INDEX idx_incident_rca_approval_date (approved_at),
    INDEX idx_incident_rca_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Versioned incident root cause analysis and management approval.';

INSERT INTO incident_rca
    (incident_id, investigation_id, version_no, methodology, problem_statement, root_cause_level_1, root_cause_level_2, root_cause_level_3, root_cause_level_4, root_cause_level_5, immediate_cause, underlying_cause, system_cause, final_root_cause, corrective_recommendation, preventive_recommendation, management_review, approval_status, approved_by, approved_at, comments, created_by, updated_by)
VALUES
    (1, 1, 1, 'five_why', 'Operator hand contacted a sharp film edge.', 'Sharp edge accessible.', 'Edge protector was damaged.', 'Start-up checklist did not verify edge protection.', 'Maintenance defect escalation was informal.', 'Machine safeguarding ownership was not defined.', 'Hand contacted sharp edge.', 'Damaged edge protector remained in service.', 'Safeguarding inspection was incomplete.', 'Safeguarding inspection ownership was not embedded in the production standard.', 'Replace edge protector and revise start-up checks.', 'Monthly safeguarding audit and defect escalation SLA.', 'HSE review requested.', 'pending_approval', NULL, NULL, NULL, 2, 2),
    (2, 2, 1, 'fault_tree_analysis', 'Electrical shock occurred during MCC troubleshooting.', 'Energized component contacted.', 'Isolation was not independently verified.', 'Panel labeling and test-before-touch controls were weak.', 'Electrical work permit assurance was inconsistent.', 'Electrical safety governance lacked field verification.', 'Contact with energized MCC component.', 'Lockout verification step was missed.', 'Electrical permit assurance was ineffective.', 'The electrical safety management system did not ensure independent verification.', 'Upgrade labels and require a second-person isolation check.', 'Quarterly electrical safety assurance audits.', 'Plant Manager review pending.', 'pending_approval', NULL, NULL, 'Hold action assignment until approval.', 3, 3),
    (3, 3, 1, 'bow_tie_analysis', 'Small boiler-area fire developed during hot-work preparation.', 'Oil residue ignited.', 'Fire-watch continuity was lost.', 'Final pre-job inspection was not completed.', 'Permit handover controls were informal.', 'Hot-work governance did not define fire-watch accountability.', 'Ignition of oil residue.', 'Insufficient final area inspection.', 'Permit-to-work assurance gap.', 'Permit-to-work controls lacked accountable fire-watch continuity.', 'Require documented final inspection and dedicated fire watch.', 'Monthly permit-to-work audit and competency refresh.', 'Approved for CAPA.', 'approved', 'EMP-HSE-001', '2026-07-28 12:00:00.000', 'Approved by HSE Manager.', 3, 2),
    (4, 4, 1, 'tripod_beta', 'Forklift struck a warehouse rack.', 'Forklift contacted rack.', 'Temporary pallets reduced aisle width.', 'Temporary layout was not approved.', 'Contractor induction did not cover the temporary layout.', 'Warehouse change management was weak.', 'Reversing forklift contacted rack.', 'Aisle control was not maintained.', 'Temporary storage governance was ineffective.', 'Warehouse change management did not control temporary traffic conditions.', 'Remove temporary pallets and mark the revised route.', 'Require signed temporary-layout approval.', 'Returned for stronger contractor control evidence.', 'rejected', 'EMP-HSE-001', '2026-08-01 09:00:00.000', 'RCA revision required.', 2, 2),
    (5, 5, 1, 'custom', 'Portable pump dropped during manual handling.', 'Sling shifted.', 'Pump had no marked lifting point.', 'Lift plan was not prepared.', 'Routine work was not risk assessed.', 'Manual handling assurance was not integrated into maintenance planning.', 'Pump dropped during lift.', 'Incorrect sling selection.', 'Maintenance lift planning was incomplete.', 'Routine maintenance tasks lacked a standard lifting-point assessment.', 'Identify lifting points and issue a lift check.', 'Include manual handling in maintenance job plans.', 'Awaiting HSE review.', 'pending_approval', NULL, NULL, NULL, 2, 2);

SELECT rca_id, incident_id, version_no, methodology, approval_status
FROM incident_rca WHERE deleted_at IS NULL ORDER BY incident_id, version_no;
