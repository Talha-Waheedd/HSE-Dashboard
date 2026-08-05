-- ==================================================
-- TABLE NAME
--   incident_investigations and incident_investigation_members
--
-- Purpose
--   Formal investigation record and normalized investigation-team membership.
--   Supports timeline reconstruction, causal analysis, findings, recommendations,
--   review status, and approval status.
--
-- Relationships
--   incidents, employees as lead investigators/team members, statuses, and users.
--
-- Indexes
--   Incident/date, investigator/status, team membership, approval queues, and deletion.
--
-- Workflow
--   Assigned -> Active -> Pending HSE Review -> Pending Approval -> Approved.
--
-- Author
--   CBL HSE Database Architecture
--
-- Version
--   1.0.0 | Phase 5 | MySQL 8
-- ==================================================

USE cbl_hse;

CREATE TABLE IF NOT EXISTS incident_investigations (
    investigation_id      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    incident_id           BIGINT UNSIGNED NOT NULL,
    lead_investigator_id  CHAR(36) NOT NULL,
    investigation_date    DATE NOT NULL,
    incident_timeline     TEXT NOT NULL,
    immediate_cause       TEXT NOT NULL,
    contributing_factors  TEXT NULL,
    unsafe_conditions     TEXT NULL,
    unsafe_acts           TEXT NULL,
    human_factors         TEXT NULL,
    equipment_failure     TEXT NULL,
    environmental_factors TEXT NULL,
    findings              TEXT NOT NULL,
    recommendations       TEXT NULL,
    review_status         ENUM('draft', 'submitted', 'pending_hse_review', 'returned', 'accepted') NOT NULL DEFAULT 'draft',
    approval_status       ENUM('not_required', 'pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    created_by            BIGINT UNSIGNED NOT NULL,
    updated_by            BIGINT UNSIGNED NOT NULL,
    created_at            DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at            DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at            DATETIME(3) NULL,

    PRIMARY KEY (investigation_id),
    CONSTRAINT fk_inc_investigation_incident FOREIGN KEY (incident_id) REFERENCES incidents (incident_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_inc_investigation_lead FOREIGN KEY (lead_investigator_id) REFERENCES employees (employee_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_inc_investigation_created_by FOREIGN KEY (created_by) REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_inc_investigation_updated_by FOREIGN KEY (updated_by) REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_inc_investigation_case_date (incident_id, investigation_date),
    INDEX idx_inc_investigation_lead_status (lead_investigator_id, review_status),
    INDEX idx_inc_investigation_review_queue (review_status, approval_status),
    INDEX idx_inc_investigation_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Formal incident investigation and causal findings.';

CREATE TABLE IF NOT EXISTS incident_investigation_members (
    member_id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    investigation_id   BIGINT UNSIGNED NOT NULL,
    employee_id        CHAR(36) NOT NULL,
    team_role          ENUM('lead', 'hse', 'department', 'technical', 'medical', 'observer') NOT NULL DEFAULT 'observer',
    created_by         BIGINT UNSIGNED NOT NULL,
    updated_by         BIGINT UNSIGNED NOT NULL,
    created_at         DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at         DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at         DATETIME(3) NULL,
    PRIMARY KEY (member_id),
    UNIQUE KEY uq_inc_investigation_member (investigation_id, employee_id),
    CONSTRAINT fk_inc_investigation_member_case FOREIGN KEY (investigation_id) REFERENCES incident_investigations (investigation_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_inc_investigation_member_employee FOREIGN KEY (employee_id) REFERENCES employees (employee_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_inc_investigation_member_created_by FOREIGN KEY (created_by) REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_inc_investigation_member_updated_by FOREIGN KEY (updated_by) REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_inc_investigation_member_employee (employee_id),
    INDEX idx_inc_investigation_member_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Normalized employees assigned to an incident investigation.';

INSERT INTO incident_investigations
    (incident_id, lead_investigator_id, investigation_date, incident_timeline, immediate_cause, contributing_factors, unsafe_conditions, unsafe_acts, human_factors, equipment_failure, environmental_factors, findings, recommendations, review_status, approval_status, created_by, updated_by)
VALUES
    (1, 'EMP-HSE-002', '2026-07-15', '10:20 line operating; 10:25 film edge contacted hand; 10:27 line isolated; 10:35 first aid completed.', 'Hand contacted an unguarded sharp film edge during clearing.', 'Guard inspection was not included in the start-up checklist.', 'Sharp edge remained accessible near the clearing point.', 'Operator reached into the machine boundary before full isolation.', 'Production urgency influenced the clearing method.', 'Film guide had a damaged edge protector.', NULL, 'The event was preventable through edge-protector maintenance and isolation verification.', 'Repair guide, revise start-up checklist, and refresh clearing training.', 'accepted', 'not_required', 2, 2),
    (2, 'EMP-HSE-003', '2026-07-22', '16:35 troubleshooting began; 16:40 contact occurred; 16:41 isolation completed; 17:10 medical transfer.', 'Contact with an energized MCC compartment.', 'Test-before-touch step was missed and panel labeling was unclear.', 'Temporary barrier did not prevent access to energized components.', 'Troubleshooting began before lockout verification.', 'Assumption that the feeder was isolated was not challenged.', 'MCC interlock and latch condition were not verified.', 'High humidity and poor panel lighting reduced visibility.', 'The electrical isolation process was not consistently verified at point of work.', 'Implement independent isolation verification and upgrade MCC signage.', 'pending_hse_review', 'pending', 3, 3),
    (3, 'EMP-HSE-002', '2026-07-26', '22:00 permit reviewed; 22:05 tray prepared; 22:10 flame observed; 22:11 extinguisher used.', 'Hot-work preparation allowed an ignition source near oil residue.', 'Fire watch was reassigned during permit preparation.', 'Oil residue remained in the maintenance tray.', 'Area was not rechecked immediately before preparation.', 'Contractor relied on an earlier housekeeping check.', 'No equipment failure identified.', 'Night lighting obscured the tray surface.', 'Permit controls and fire-watch continuity were inadequate.', 'Require final pre-job area inspection and dedicated fire watch.', 'accepted', 'approved', 2, 2),
    (4, 'EMP-HSE-003', '2026-07-30', '08:05 forklift entered aisle; 08:15 rack struck; 08:18 area isolated; 09:00 inspection started.', 'Forklift reversed into the rack upright.', 'Aisle width was reduced by temporary pallets.', 'Rack guard and pedestrian lane were not clearly segregated.', 'Forklift operator reversed without a spotter.', 'Contractor was unfamiliar with the temporary warehouse layout.', 'Reverse alarm was functional but difficult to hear.', NULL, 'Temporary storage controls were not included in the contractor induction.', 'Clear temporary-layout approval and enforce a spotter rule.', 'submitted', 'pending', 3, 3),
    (5, 'EMP-HSE-002', '2026-08-03', '13:00 pump moved; 13:05 sling shifted; 13:06 pump dropped; 13:20 area cleared.', 'Lifting sling shifted during manual handling.', 'Sling selection was not checked against the pump weight.', 'No marked lifting point was available.', 'Team lifted without a pre-task lift plan.', 'New technician was not familiar with the pump center of gravity.', 'Pump casing was weakened by previous corrosion.', NULL, 'Manual handling controls were not applied to a routine maintenance lift.', 'Add lifting-point identification and task-specific lift checks.', 'submitted', 'pending', 2, 2);

INSERT INTO incident_investigation_members (investigation_id, employee_id, team_role, created_by, updated_by)
VALUES
    (1, 'EMP-HSE-002', 'lead', 2, 2),
    (2, 'EMP-HSE-003', 'lead', 3, 3),
    (3, 'EMP-HSE-002', 'lead', 2, 2),
    (4, 'EMP-HSE-003', 'lead', 3, 3),
    (5, 'EMP-HSE-002', 'lead', 2, 2);

SELECT investigation_id, incident_id, lead_investigator_id, review_status, approval_status
FROM incident_investigations WHERE deleted_at IS NULL ORDER BY investigation_id;
