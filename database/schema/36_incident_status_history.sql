-- ==================================================
-- TABLE NAME
--   incident_status_history
--
-- Purpose
--   Immutable audit log of every incident status transition, including the
--   duration in the previous status and SLA breach indicator.
--
-- Relationships
--   incidents, statuses, and users.
--
-- Indexes
--   Incident/timestamp, current status/timestamp, actor/timestamp, SLA queue.
--
-- Workflow
--   Append-only at each status transition. Database triggers reject update/delete.
--
-- Author
--   CBL HSE Database Architecture
--
-- Version
--   1.0.0 | Phase 5 | MySQL 8
-- ==================================================

USE cbl_hse;

CREATE TABLE IF NOT EXISTS incident_status_history (
    history_id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    incident_id                BIGINT UNSIGNED NOT NULL,
    previous_status_id         BIGINT UNSIGNED NULL,
    current_status_id          BIGINT UNSIGNED NOT NULL,
    changed_by                 BIGINT UNSIGNED NOT NULL,
    reason                     VARCHAR(500) NULL,
    comments                   TEXT NULL,
    changed_at                 DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    duration_in_previous_status BIGINT UNSIGNED NULL COMMENT 'Elapsed seconds in the previous status.',
    sla_breach_flag            BOOLEAN NOT NULL DEFAULT FALSE,
    created_by                 BIGINT UNSIGNED NOT NULL,
    updated_by                 BIGINT UNSIGNED NOT NULL,
    created_at                 DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at                 DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    deleted_at                 DATETIME(3) NULL COMMENT 'Always NULL; immutable history is never soft-deleted.',

    PRIMARY KEY (history_id),
    CONSTRAINT fk_incident_history_incident FOREIGN KEY (incident_id) REFERENCES incidents (incident_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_incident_history_previous FOREIGN KEY (previous_status_id) REFERENCES statuses (status_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_incident_history_current FOREIGN KEY (current_status_id) REFERENCES statuses (status_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_incident_history_changed_by FOREIGN KEY (changed_by) REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_incident_history_created_by FOREIGN KEY (created_by) REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_incident_history_updated_by FOREIGN KEY (updated_by) REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_incident_history_case_time (incident_id, changed_at),
    INDEX idx_incident_history_status_time (current_status_id, changed_at),
    INDEX idx_incident_history_actor_time (changed_by, changed_at),
    INDEX idx_incident_history_sla (sla_breach_flag, changed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Immutable incident status transition and SLA audit history.';

DROP TRIGGER IF EXISTS trg_incident_history_no_update;
DROP TRIGGER IF EXISTS trg_incident_history_no_delete;

DELIMITER $$
CREATE TRIGGER trg_incident_history_no_update
BEFORE UPDATE ON incident_status_history
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Incident status history is immutable';
END$$
CREATE TRIGGER trg_incident_history_no_delete
BEFORE DELETE ON incident_status_history
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Incident status history cannot be deleted';
END$$
DELIMITER ;

INSERT INTO incident_status_history
    (incident_id, previous_status_id, current_status_id, changed_by, reason, comments, changed_at, duration_in_previous_status, sla_breach_flag, created_by, updated_by)
VALUES
    (1, NULL, 18, 2, 'Initial report created.', NULL, '2026-07-14 10:30:00.000', NULL, FALSE, 2, 2),
    (1, 18, 19, 2, 'Report submitted.', NULL, '2026-07-14 10:35:00.000', 300, FALSE, 2, 2),
    (1, 19, 20, 2, 'Investigation required by category.', NULL, '2026-07-14 11:00:00.000', 1500, FALSE, 2, 2),
    (2, NULL, 18, 3, 'Initial report created.', NULL, '2026-07-20 16:50:00.000', NULL, FALSE, 3, 3),
    (2, 18, 19, 3, 'Report submitted to HSE.', NULL, '2026-07-20 17:00:00.000', 600, FALSE, 3, 3),
    (3, NULL, 18, 3, 'Initial report created.', NULL, '2026-07-25 22:20:00.000', NULL, FALSE, 3, 3),
    (4, NULL, 18, 2, 'Initial report created.', NULL, '2026-07-29 08:30:00.000', NULL, FALSE, 2, 2),
    (5, NULL, 18, 3, 'Initial report created.', NULL, '2026-08-02 13:15:00.000', NULL, FALSE, 3, 3);

SELECT history_id, incident_id, previous_status_id, current_status_id, duration_in_previous_status, sla_breach_flag
FROM incident_status_history ORDER BY incident_id, changed_at;
