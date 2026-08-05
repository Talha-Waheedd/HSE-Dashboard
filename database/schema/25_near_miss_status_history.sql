-- ==================================================
-- TABLE NAME
--   near_miss_status_history
--
-- Purpose
--   Immutable audit trail of every near miss status transition.
--
-- Relationships
--   near_misses, statuses, and users.
--
-- Indexes
--   Near miss/time, new status/time, actor/time.
--
-- Workflow
--   Append one row for every transition, including initial creation. Rows are
--   protected by database triggers and must never be updated or deleted.
--
-- Author
--   CBL HSE Database Architecture
--
-- Version
--   1.0.0 | Phase 4 | MySQL 8
-- ==================================================

USE cbl_hse;

CREATE TABLE IF NOT EXISTS near_miss_status_history (
    history_id       BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    near_miss_id     BIGINT UNSIGNED NOT NULL,
    old_status_id    BIGINT UNSIGNED NULL,
    new_status_id    BIGINT UNSIGNED NOT NULL,
    changed_by       BIGINT UNSIGNED NOT NULL,
    reason           VARCHAR(500) NULL,
    comments         TEXT NULL,
    changed_at       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    created_by       BIGINT UNSIGNED NOT NULL,
    updated_by       BIGINT UNSIGNED NOT NULL,
    created_at       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    deleted_at       DATETIME(3) NULL COMMENT 'Always NULL; retained for audit-schema consistency.',

    PRIMARY KEY (history_id),
    CONSTRAINT fk_nm_history_near_miss FOREIGN KEY (near_miss_id) REFERENCES near_misses (near_miss_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_nm_history_old_status FOREIGN KEY (old_status_id) REFERENCES statuses (status_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_nm_history_new_status FOREIGN KEY (new_status_id) REFERENCES statuses (status_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_nm_history_changed_by FOREIGN KEY (changed_by) REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_nm_history_created_by FOREIGN KEY (created_by) REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_nm_history_updated_by FOREIGN KEY (updated_by) REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_nm_history_case_time (near_miss_id, changed_at),
    INDEX idx_nm_history_status_time (new_status_id, changed_at),
    INDEX idx_nm_history_actor_time (changed_by, changed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Immutable near miss status transition history.';

DROP TRIGGER IF EXISTS trg_nm_history_no_update;
DROP TRIGGER IF EXISTS trg_nm_history_no_delete;

DELIMITER $$
CREATE TRIGGER trg_nm_history_no_update
BEFORE UPDATE ON near_miss_status_history
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Near miss status history is immutable';
END$$
CREATE TRIGGER trg_nm_history_no_delete
BEFORE DELETE ON near_miss_status_history
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Near miss status history cannot be deleted';
END$$
DELIMITER ;

INSERT INTO near_miss_status_history
    (near_miss_id, old_status_id, new_status_id, changed_by, reason, comments, changed_at, created_by, updated_by)
VALUES
    (1, NULL, 13, 2, 'Initial report created.', 'Draft captured from the mobile HSE form.', '2026-07-28 09:25:00.000', 2, 2),
    (1, 13, 14, 2, 'Submitted by reporter.', 'Report submitted for HSE review.', '2026-07-28 09:30:00.000', 2, 2),
    (1, 14, 15, 2, 'Investigation required due to high potential consequence.', 'Investigator assigned to HSE.', '2026-07-28 09:40:00.000', 2, 2),
    (2, NULL, 13, 3, 'Initial report created.', NULL, '2026-07-30 14:15:00.000', 3, 3),
    (2, 13, 14, 3, 'Submitted by reporter.', NULL, '2026-07-30 14:20:00.000', 3, 3),
    (3, NULL, 13, 4, 'Initial report created.', NULL, '2026-08-01 21:45:00.000', 4, 4);

SELECT history_id, near_miss_id, old_status_id, new_status_id, changed_by, changed_at
FROM near_miss_status_history ORDER BY near_miss_id, changed_at;
