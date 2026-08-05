-- ==================================================
-- TABLE NAME
--   incident_corrective_actions
--
-- Purpose
--   Unlimited corrective and preventive actions (CAPA) for an incident. Each
--   action closes independently; the incident closes only after mandatory actions
--   are verified by the application workflow.
--
-- Relationships
--   incidents, departments, employees as assignees/reviewers, statuses, and users.
--
-- Indexes
--   Incident/status, assignee/target date, department, verification queue, deletion.
--
-- Workflow
--   Open -> In Progress -> Completed -> Verified. Overdue is system-calculated.
--
-- Author
--   CBL HSE Database Architecture
--
-- Version
--   1.0.0 | Phase 5 | MySQL 8
-- ==================================================

USE cbl_hse;

CREATE TABLE IF NOT EXISTS incident_corrective_actions (
    action_id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    incident_id           BIGINT UNSIGNED NOT NULL,
    action_description    TEXT NOT NULL,
    action_type           ENUM('corrective', 'preventive', 'containment', 'management_system') NOT NULL,
    assigned_department_id CHAR(36) NOT NULL,
    assigned_employee_id  CHAR(36) NOT NULL,
    priority              ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'medium',
    target_date           DATE NOT NULL,
    completion_date       DATE NULL,
    completion_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    status_id             BIGINT UNSIGNED NOT NULL DEFAULT 24 COMMENT 'FK -> statuses.status_id; corrective_actions module.',
    evidence              TEXT NULL COMMENT 'Cloud paths, attachment references, or verification evidence summary.',
    reviewer_id           CHAR(36) NULL,
    verification_date     DATETIME(3) NULL,
    remarks               TEXT NULL,
    mandatory_for_closure BOOLEAN NOT NULL DEFAULT TRUE,
    created_by            BIGINT UNSIGNED NOT NULL,
    updated_by            BIGINT UNSIGNED NOT NULL,
    created_at            DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at            DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at            DATETIME(3) NULL,

    PRIMARY KEY (action_id),
    CONSTRAINT chk_incident_action_completion CHECK (completion_percentage BETWEEN 0.00 AND 100.00),
    CONSTRAINT chk_incident_action_verified CHECK (status_id <> 27 OR (reviewer_id IS NOT NULL AND verification_date IS NOT NULL)),
    CONSTRAINT fk_incident_action_incident FOREIGN KEY (incident_id) REFERENCES incidents (incident_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_incident_action_department FOREIGN KEY (assigned_department_id) REFERENCES departments (department_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_incident_action_assignee FOREIGN KEY (assigned_employee_id) REFERENCES employees (employee_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_incident_action_reviewer FOREIGN KEY (reviewer_id) REFERENCES employees (employee_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_incident_action_status FOREIGN KEY (status_id) REFERENCES statuses (status_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_incident_action_created_by FOREIGN KEY (created_by) REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_incident_action_updated_by FOREIGN KEY (updated_by) REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_incident_action_case_status (incident_id, status_id),
    INDEX idx_incident_action_assignee_target (assigned_employee_id, target_date),
    INDEX idx_incident_action_department_status (assigned_department_id, status_id),
    INDEX idx_incident_action_verification (mandatory_for_closure, status_id),
    INDEX idx_incident_action_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Independent incident corrective and preventive actions.';

ALTER TABLE incidents
    ADD CONSTRAINT fk_incident_linked_capa
    FOREIGN KEY (linked_capa_action_id) REFERENCES incident_corrective_actions (action_id)
    ON UPDATE CASCADE ON DELETE RESTRICT;

INSERT INTO incident_corrective_actions
    (incident_id, action_description, action_type, assigned_department_id, assigned_employee_id, priority, target_date, completion_date, completion_percentage, status_id, evidence, reviewer_id, verification_date, remarks, mandatory_for_closure, created_by, updated_by)
VALUES
    (1, 'Replace the damaged film edge protector and verify the guard before restart.', 'corrective', 'DEP-PROD-001', 'EMP-PROD-001', 'high', '2026-07-18', '2026-07-17', 100.00, 27, 'hse/incidents/INC-2026-000001/actions/edge-protector-closeout.jpg', 'EMP-HSE-002', '2026-07-18 09:00:00.000', 'Verified during line walk.', TRUE, 2, 2),
    (2, 'Install independent electrical isolation verification at MCC work points.', 'corrective', 'DEP-ENG-001', 'EMP-ENG-001', 'critical', '2026-08-10', NULL, 45.00, 25, 'hse/incidents/INC-2026-000002/actions/isolation-procedure-draft.docx', NULL, NULL, 'Procedure revision in approval.', TRUE, 3, 3),
    (3, 'Create a dedicated fire-watch assignment on every hot-work permit.', 'preventive', 'DEP-ENG-001', 'EMP-ENG-001', 'high', '2026-08-05', '2026-08-04', 100.00, 27, 'hse/incidents/INC-2026-000003/actions/hot-work-permit-v3.pdf', 'EMP-HSE-001', '2026-08-05 10:00:00.000', 'Permit audit completed.', TRUE, 3, 3),
    (4, 'Remove temporary pallets and issue a signed warehouse traffic-layout approval.', 'corrective', 'DEP-STORES-001', 'EMP-PROD-001', 'high', '2026-08-07', NULL, 30.00, 25, 'hse/incidents/INC-2026-000004/actions/temporary-layout-plan.pdf', NULL, NULL, 'Layout plan awaiting contractor sign-off.', TRUE, 2, 2),
    (5, 'Mark approved lifting points on portable pumps and add a lift-plan check to the job card.', 'preventive', 'DEP-ENG-001', 'EMP-ENG-001', 'medium', '2026-08-15', NULL, 0.00, 24, NULL, NULL, NULL, 'Action assigned to maintenance planning.', FALSE, 3, 3);

SELECT action_id, incident_id, action_type, priority, completion_percentage, status_id, reviewer_id
FROM incident_corrective_actions WHERE deleted_at IS NULL ORDER BY incident_id, action_id;
