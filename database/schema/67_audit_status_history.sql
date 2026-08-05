-- ==================================================
-- TABLE NAME
--   audit_status_history
--
-- Purpose
--   Immutable audit lifecycle history for schedule, execution, reporting,
--   approval, and closure transitions, including elapsed duration.
--
-- Relationships
--   audits, statuses, and users.
--
-- Indexes
--   Audit/timestamp, new status/timestamp, actor/timestamp, duration analysis.
--
-- Workflow
--   Append-only when audit status changes. Database triggers reject updates/deletes.
--
-- Author
--   CBL HSE Database Architecture
--
-- Version
--   1.0.0 | Phase 7 | MySQL 8
-- ==================================================

USE cbl_hse;

CREATE TABLE IF NOT EXISTS audit_status_history (
    history_id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    audit_id                    BIGINT UNSIGNED NOT NULL,
    old_status_id               BIGINT UNSIGNED NULL,
    new_status_id               BIGINT UNSIGNED NOT NULL,
    changed_by                  BIGINT UNSIGNED NOT NULL,
    reason                      VARCHAR(500) NULL,
    changed_at                  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    comments                    TEXT NULL,
    duration_in_previous_status BIGINT UNSIGNED NULL COMMENT 'Elapsed seconds in previous status.',
    created_by                  BIGINT UNSIGNED NOT NULL,
    updated_by                  BIGINT UNSIGNED NOT NULL,
    created_at                  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at                  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    deleted_at                  DATETIME(3) NULL COMMENT 'Always NULL; immutable history is never deleted.',
    PRIMARY KEY (history_id),
    CONSTRAINT fk_audit_history_audit FOREIGN KEY (audit_id) REFERENCES audits (audit_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_audit_history_old_status FOREIGN KEY (old_status_id) REFERENCES statuses (status_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_audit_history_new_status FOREIGN KEY (new_status_id) REFERENCES statuses (status_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_audit_history_changed_by FOREIGN KEY (changed_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_audit_history_created_by FOREIGN KEY (created_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_audit_history_updated_by FOREIGN KEY (updated_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_audit_history_audit_time (audit_id, changed_at),
    INDEX idx_audit_history_status_time (new_status_id, changed_at),
    INDEX idx_audit_history_actor_time (changed_by, changed_at),
    INDEX idx_audit_history_duration (duration_in_previous_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Immutable audit status transition history.';

DROP TRIGGER IF EXISTS trg_audit_history_no_update;
DROP TRIGGER IF EXISTS trg_audit_history_no_delete;

DELIMITER $$
CREATE TRIGGER trg_audit_history_no_update
BEFORE UPDATE ON audit_status_history
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Audit status history is immutable';
END$$
CREATE TRIGGER trg_audit_history_no_delete
BEFORE DELETE ON audit_status_history
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Audit status history cannot be deleted';
END$$
DELIMITER ;

INSERT INTO audit_status_history
    (audit_id, old_status_id, new_status_id, changed_by, reason, changed_at, comments, duration_in_previous_status, created_by, updated_by)
VALUES
    (1, NULL, 29, 1, 'Audit scheduled.', '2026-07-01 09:00:00.000', 'Internal audit calendar entry created.', NULL, 1, 1),
    (1, 29, 30, 1, 'Audit commenced.', '2026-07-18 09:00:00.000', 'Opening meeting completed.', 1468800, 1, 1),
    (1, 30, 31, 1, 'Fieldwork complete.', '2026-07-18 16:30:00.000', 'Report prepared with findings.', 27000, 1, 1),
    (2, NULL, 29, 2, 'Audit scheduled.', '2026-07-20 09:00:00.000', NULL, NULL, 2, 2),
    (3, NULL, 29, 3, 'Audit scheduled.', '2026-07-25 09:00:00.000', NULL, NULL, 3, 3),
    (4, NULL, 29, 2, 'Audit scheduled.', '2026-08-01 09:00:00.000', NULL, NULL, 2, 2),
    (5, NULL, 29, 3, 'Audit scheduled.', '2026-07-15 09:00:00.000', NULL, NULL, 3, 3);

SELECT history_id, audit_id, old_status_id, new_status_id, duration_in_previous_status, changed_at
FROM audit_status_history ORDER BY audit_id, changed_at;
