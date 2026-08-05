-- ==================================================
-- TABLE NAME
--   training_status_history
--
-- Purpose
--   Immutable audit trail for every training session status transition, including
--   elapsed duration in the previous status and approval/SLA analysis support.
--
-- Relationships
--   training_sessions, statuses, and users.
--
-- Indexes
--   Session/timestamp, new status/timestamp, actor/timestamp, and duration analysis.
--
-- Workflow
--   Append-only when a training session status changes. Updates and deletes are rejected.
--
-- Author
--   CBL HSE Database Architecture
--
-- Version
--   1.0.0 | Phase 6 | MySQL 8
-- ==================================================

USE cbl_hse;

CREATE TABLE IF NOT EXISTS training_status_history (
    history_id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    training_session_id         BIGINT UNSIGNED NOT NULL,
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
    deleted_at                  DATETIME(3) NULL COMMENT 'Always NULL; immutable audit history is never deleted.',

    PRIMARY KEY (history_id),
    CONSTRAINT fk_training_history_session FOREIGN KEY (training_session_id) REFERENCES training_sessions (training_session_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_training_history_old_status FOREIGN KEY (old_status_id) REFERENCES statuses (status_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_training_history_new_status FOREIGN KEY (new_status_id) REFERENCES statuses (status_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_training_history_changed_by FOREIGN KEY (changed_by) REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_training_history_created_by FOREIGN KEY (created_by) REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_training_history_updated_by FOREIGN KEY (updated_by) REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_training_history_session_time (training_session_id, changed_at),
    INDEX idx_training_history_status_time (new_status_id, changed_at),
    INDEX idx_training_history_actor_time (changed_by, changed_at),
    INDEX idx_training_history_duration (duration_in_previous_status),
    INDEX idx_training_history_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Immutable training session status transition history.';

DROP TRIGGER IF EXISTS trg_training_history_no_update;
DROP TRIGGER IF EXISTS trg_training_history_no_delete;

DELIMITER $$
CREATE TRIGGER trg_training_history_no_update
BEFORE UPDATE ON training_status_history
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Training status history is immutable';
END$$
CREATE TRIGGER trg_training_history_no_delete
BEFORE DELETE ON training_status_history
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Training status history cannot be deleted';
END$$
DELIMITER ;

INSERT INTO training_status_history
    (training_session_id, old_status_id, new_status_id, changed_by, reason, changed_at, comments, duration_in_previous_status, created_by, updated_by)
VALUES
    (1, NULL, 37, 1, 'Session scheduled.', '2026-07-01 09:00:00.000', 'Mandatory induction cohort created.', NULL, 1, 1),
    (1, 37, 38, 1, 'Session started.', '2026-08-05 09:00:00.000', 'Classroom and site walk started.', 3024000, 1, 1),
    (1, 38, 39, 1, 'Attendance completed.', '2026-08-05 16:10:00.000', 'All required learning activities completed.', 25800, 1, 1),
    (2, NULL, 37, 1, 'Session scheduled.', '2026-07-10 10:00:00.000', 'Annual refresher planned.', NULL, 1, 1),
    (3, NULL, 37, 1, 'Session scheduled.', '2026-07-15 10:00:00.000', 'Authorized-person workshop planned.', NULL, 1, 1),
    (4, NULL, 37, 1, 'Session scheduled.', '2026-07-20 10:00:00.000', 'External practical session planned.', NULL, 1, 1),
    (5, NULL, 37, 1, 'Session scheduled.', '2026-07-01 10:00:00.000', 'Annual food safety refresher planned.', NULL, 1, 1);

SELECT history_id, training_session_id, old_status_id, new_status_id, duration_in_previous_status, changed_at
FROM training_status_history ORDER BY training_session_id, changed_at;
