-- ==================================================
-- TABLE NAME
--   training_feedback
--
-- Purpose
--   Learner evaluation of trainer, content, presentation, practical value,
--   knowledge gain, recommendations, and improvement suggestions.
--
-- Relationships
--   training_sessions, employees, trainers, and users.
--
-- Indexes
--   Session/rating, trainer/rating, employee history, recommendation, anonymous flag.
--
-- Workflow
--   Submitted after session -> analyzed for trainer performance and effectiveness trends.
--
-- Author
--   CBL HSE Database Architecture
--
-- Version
--   1.0.0 | Phase 6 | MySQL 8
-- ==================================================

USE cbl_hse;

CREATE TABLE IF NOT EXISTS training_feedback (
    feedback_id       BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    training_session_id BIGINT UNSIGNED NOT NULL,
    employee_id       CHAR(36) NULL COMMENT 'NULL when anonymous option is selected.',
    trainer_id        BIGINT UNSIGNED NOT NULL,
    rating            TINYINT UNSIGNED NOT NULL,
    knowledge_gain    TINYINT UNSIGNED NOT NULL,
    presentation      TINYINT UNSIGNED NOT NULL,
    content           TINYINT UNSIGNED NOT NULL,
    practical         TINYINT UNSIGNED NOT NULL,
    suggestions      TEXT NULL,
    comments         TEXT NULL,
    recommendation   ENUM('not_recommend', 'neutral', 'recommend') NOT NULL DEFAULT 'recommend',
    anonymous_option BOOLEAN NOT NULL DEFAULT FALSE,
    created_by       BIGINT UNSIGNED NOT NULL,
    updated_by       BIGINT UNSIGNED NOT NULL,
    created_at       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at       DATETIME(3) NULL,

    PRIMARY KEY (feedback_id),
    CONSTRAINT chk_training_feedback_scores CHECK (rating BETWEEN 1 AND 5 AND knowledge_gain BETWEEN 1 AND 5 AND presentation BETWEEN 1 AND 5 AND content BETWEEN 1 AND 5 AND practical BETWEEN 1 AND 5),
    CONSTRAINT chk_training_feedback_anonymous CHECK (anonymous_option = TRUE OR employee_id IS NOT NULL),
    CONSTRAINT fk_training_feedback_session FOREIGN KEY (training_session_id) REFERENCES training_sessions (training_session_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_training_feedback_employee FOREIGN KEY (employee_id) REFERENCES employees (employee_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_training_feedback_trainer FOREIGN KEY (trainer_id) REFERENCES trainers (trainer_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_training_feedback_created_by FOREIGN KEY (created_by) REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_training_feedback_updated_by FOREIGN KEY (updated_by) REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_training_feedback_session_rating (training_session_id, rating),
    INDEX idx_training_feedback_trainer_rating (trainer_id, rating),
    INDEX idx_training_feedback_employee (employee_id, training_session_id),
    INDEX idx_training_feedback_recommendation (recommendation),
    INDEX idx_training_feedback_anonymous (anonymous_option),
    INDEX idx_training_feedback_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Training effectiveness and learner feedback record.';

INSERT INTO training_feedback
    (training_session_id, employee_id, trainer_id, rating, knowledge_gain, presentation, content, practical, suggestions, comments, recommendation, anonymous_option, created_by, updated_by)
VALUES
    (1, 'EMP-PROD-003', 1, 5, 5, 5, 5, 4, 'Add more examples from the packing line.', 'Clear and relevant induction.', 'recommend', FALSE, 4, 4),
    (2, 'EMP-HSE-003', 2, 4, 4, 5, 4, 5, 'Repeat the extinguisher practical annually.', 'Practical drill was very useful.', 'recommend', FALSE, 2, 2),
    (3, 'EMP-ENG-002', 3, 5, 5, 4, 5, 5, 'Provide a second MCC practice panel.', 'Strong technical delivery.', 'recommend', FALSE, 3, 3),
    (4, NULL, 5, 4, 4, 4, 4, 5, 'Increase the rescue scenario time.', 'External equipment was appropriate.', 'recommend', TRUE, 1, 1),
    (5, 'EMP-PROD-002', 2, 4, 4, 4, 5, 3, 'Include allergen-label examples.', 'Content aligned with production needs.', 'recommend', FALSE, 4, 4);

SELECT feedback_id, training_session_id, trainer_id, rating, knowledge_gain, recommendation, anonymous_option
FROM training_feedback WHERE deleted_at IS NULL ORDER BY feedback_id;
