-- ==================================================
-- TABLE NAME
--   training_sessions
--
-- Purpose
--   Main training event register supporting the full calendar, cost, duration,
--   delivery mode, trainer, attendance, certification, and compliance lifecycle.
--
-- Relationships
--   training_types, trainers, plants, departments, locations, statuses, and users.
--
-- Indexes
--   Generated training number, date calendar, type/date, department/date,
--   trainer/date, status, mode, mandatory reporting, and soft deletion.
--
-- Workflow
--   Planned -> In Progress -> Completed or Cancelled. Attendance and feedback attach to sessions.
--
-- Author
--   CBL HSE Database Architecture
--
-- Version
--   1.0.0 | Phase 6 | MySQL 8
-- ==================================================

USE cbl_hse;

CREATE TABLE IF NOT EXISTS training_sessions (
    training_session_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    training_number     VARCHAR(24) GENERATED ALWAYS AS (
                            CONCAT('TRN-', YEAR(start_date), '-', LPAD(training_session_id, 5, '0'))
                        ) STORED,
    training_type_id    BIGINT UNSIGNED NOT NULL,
    title               VARCHAR(250) NOT NULL,
    description         TEXT NULL,
    plant_id            CHAR(36) NOT NULL,
    department_id       CHAR(36) NULL,
    location_id         CHAR(36) NULL,
    trainer_id          BIGINT UNSIGNED NOT NULL,
    training_mode       ENUM('classroom', 'online', 'practical', 'hybrid') NOT NULL,
    delivery_scope      ENUM('internal', 'external') NOT NULL,
    start_date          DATETIME(3) NOT NULL,
    end_date            DATETIME(3) NOT NULL,
    duration_hours      DECIMAL(8,2) NOT NULL,
    participants_limit  SMALLINT UNSIGNED NOT NULL DEFAULT 1,
    cost                DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    training_material   TEXT NULL COMMENT 'Cloud folder or material reference.',
    status_id           BIGINT UNSIGNED NOT NULL DEFAULT 37 COMMENT 'FK -> statuses.status_id; training module.',
    remarks             TEXT NULL,
    created_by          BIGINT UNSIGNED NOT NULL,
    updated_by          BIGINT UNSIGNED NOT NULL,
    created_at          DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at          DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at          DATETIME(3) NULL,

    PRIMARY KEY (training_session_id),
    UNIQUE KEY uq_training_session_number (training_number),
    CONSTRAINT chk_training_session_dates CHECK (end_date >= start_date),
    CONSTRAINT chk_training_session_duration CHECK (duration_hours > 0 AND cost >= 0 AND participants_limit > 0),
    CONSTRAINT fk_training_session_type FOREIGN KEY (training_type_id) REFERENCES training_types (training_type_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_training_session_trainer FOREIGN KEY (trainer_id) REFERENCES trainers (trainer_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_training_session_plant FOREIGN KEY (plant_id) REFERENCES plants (plant_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_training_session_department FOREIGN KEY (department_id) REFERENCES departments (department_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_training_session_location FOREIGN KEY (location_id) REFERENCES locations (location_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_training_session_status FOREIGN KEY (status_id) REFERENCES statuses (status_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_training_session_created_by FOREIGN KEY (created_by) REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_training_session_updated_by FOREIGN KEY (updated_by) REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_training_session_calendar (start_date, end_date, status_id),
    INDEX idx_training_session_type_date (training_type_id, start_date),
    INDEX idx_training_session_department_date (department_id, start_date),
    INDEX idx_training_session_trainer_date (trainer_id, start_date),
    INDEX idx_training_session_mode_scope (training_mode, delivery_scope),
    INDEX idx_training_session_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Enterprise HSE training session calendar and cost register.';

INSERT INTO training_sessions
    (training_type_id, title, description, plant_id, department_id, location_id, trainer_id, training_mode, delivery_scope, start_date, end_date, duration_hours, participants_limit, cost, training_material, status_id, remarks, created_by, updated_by)
VALUES
    (1, 'CBL LU Sukkur HSE Induction - August Cohort', 'Mandatory induction for new employees and contractors.', 'PLT-CBL-SKR-001', 'DEP-HSE-001', 'LOC-ADMIN', 1, 'classroom', 'internal', '2026-08-05 09:00:00.000', '2026-08-05 16:00:00.000', 7.00, 30, 15000.00, 'hse/training/TRN-2026-00001/materials/hse-induction', 39, 'Completed with practical site walk.', 1, 1),
    (2, 'Annual Fire Safety and Evacuation Drill', 'Fire prevention, extinguisher selection, alarm response, and evacuation.', 'PLT-CBL-SKR-001', 'DEP-HSE-001', 'LOC-ADMIN', 2, 'practical', 'internal', '2026-08-12 10:00:00.000', '2026-08-12 14:00:00.000', 4.00, 60, 22000.00, 'hse/training/TRN-2026-00002/materials/fire-safety', 37, 'Plant-wide annual refresher.', 1, 1),
    (8, 'LOTO Authorized Person Workshop', 'Energy isolation, verification, group lockout, and permit interfaces.', 'PLT-CBL-SKR-001', 'DEP-ENG-001', 'LOC-ELEC', 3, 'hybrid', 'internal', '2026-08-18 08:30:00.000', '2026-08-19 16:30:00.000', 16.00, 18, 48000.00, 'hse/training/TRN-2026-00003/materials/loto', 37, 'Practical assessment required.', 1, 1),
    (9, 'Working at Height Competency', 'Harness inspection, anchor selection, rescue, and fall prevention.', 'PLT-CBL-SKR-001', 'DEP-ENG-001', 'LOC-WORKSHOP', 5, 'practical', 'external', '2026-08-22 09:00:00.000', '2026-08-22 17:00:00.000', 8.00, 20, 125000.00, 'hse/training/TRN-2026-00004/materials/working-at-height', 37, 'External vendor equipment supplied.', 1, 1),
    (12, 'Food Safety and Hygiene Refresher', 'Food hygiene, allergen control, contamination prevention, and GMP behaviors.', 'PLT-CBL-SKR-001', 'DEP-PROD-001', 'LOC-PROD-L1', 2, 'classroom', 'internal', '2026-07-10 09:00:00.000', '2026-07-10 13:00:00.000', 4.00, 25, 12000.00, 'hse/training/TRN-2026-00005/materials/food-safety', 39, 'Annual production refresher completed.', 1, 1);

SELECT training_session_id, training_number, title, start_date, status_id, delivery_scope, cost
FROM training_sessions WHERE deleted_at IS NULL ORDER BY start_date;
