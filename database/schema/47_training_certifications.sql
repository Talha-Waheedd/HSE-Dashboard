-- ==================================================
-- TABLE NAME
--   training_certifications
--
-- Purpose
--   Tracks employee certificates, validity, evidence, verification, and renewal
--   obligations for mandatory and competency-based training.
--
-- Relationships
--   employees, training_sessions, users as verifiers/audit owners.
--
-- Indexes
--   Employee/expiry, training/expiry, verification queue, renewal queue, certificate number.
--
-- Workflow
--   Issued -> Verified -> Active -> Renewal Required/Expired.
--
-- Author
--   CBL HSE Database Architecture
--
-- Version
--   1.0.0 | Phase 6 | MySQL 8
-- ==================================================

USE cbl_hse;

CREATE TABLE IF NOT EXISTS training_certifications (
    certification_id     BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    employee_id          CHAR(36) NOT NULL,
    training_session_id  BIGINT UNSIGNED NOT NULL,
    certificate_number   VARCHAR(120) NOT NULL,
    issue_date           DATE NOT NULL,
    expiry_date          DATE NULL,
    certification_body   VARCHAR(255) NOT NULL,
    certificate_file     VARCHAR(1000) NULL COMMENT 'Cloud path or document reference.',
    verification_status  ENUM('pending', 'verified', 'rejected', 'expired') NOT NULL DEFAULT 'pending',
    verified_by          BIGINT UNSIGNED NULL,
    verified_at          DATETIME(3) NULL,
    renewal_required     BOOLEAN NOT NULL DEFAULT FALSE,
    renewal_date         DATE NULL,
    remarks              TEXT NULL,
    created_by           BIGINT UNSIGNED NOT NULL,
    updated_by           BIGINT UNSIGNED NOT NULL,
    created_at           DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at           DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at           DATETIME(3) NULL,

    PRIMARY KEY (certification_id),
    UNIQUE KEY uq_training_certificate_number (certificate_number),
    CONSTRAINT chk_training_certificate_dates CHECK (expiry_date IS NULL OR expiry_date >= issue_date),
    CONSTRAINT chk_training_certificate_renewal CHECK (renewal_required = FALSE OR renewal_date IS NOT NULL),
    CONSTRAINT chk_training_certificate_verification CHECK (verification_status NOT IN ('verified', 'expired') OR verified_by IS NOT NULL),
    CONSTRAINT fk_training_certification_employee FOREIGN KEY (employee_id) REFERENCES employees (employee_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_training_certification_session FOREIGN KEY (training_session_id) REFERENCES training_sessions (training_session_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_training_certification_verifier FOREIGN KEY (verified_by) REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_training_certification_created_by FOREIGN KEY (created_by) REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_training_certification_updated_by FOREIGN KEY (updated_by) REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_training_certification_employee_expiry (employee_id, expiry_date),
    INDEX idx_training_certification_training_expiry (training_session_id, expiry_date),
    INDEX idx_training_certification_verification (verification_status, expiry_date),
    INDEX idx_training_certification_renewal (renewal_required, renewal_date),
    INDEX idx_training_certification_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Employee training certification and renewal compliance register.';

INSERT INTO training_certifications
    (employee_id, training_session_id, certificate_number, issue_date, expiry_date, certification_body, certificate_file, verification_status, verified_by, verified_at, renewal_required, renewal_date, remarks, created_by, updated_by)
VALUES
    ('EMP-PROD-003', 1, 'CBL-HSE-IND-2026-0001', '2026-08-05', '2028-08-04', 'CBL Industries HSE Department', 'hse/training/certificates/CBL-HSE-IND-2026-0001.pdf', 'verified', 1, '2026-08-06 10:00:00.000', FALSE, NULL, 'Induction certificate verified.', 1, 1),
    ('EMP-HSE-003', 2, 'CBL-FIRE-2026-0017', '2026-08-12', '2027-08-11', 'CBL Industries HSE Department', 'hse/training/certificates/CBL-FIRE-2026-0017.pdf', 'verified', 1, '2026-08-13 09:00:00.000', FALSE, NULL, 'Fire refresher certificate issued.', 1, 1),
    ('EMP-ENG-002', 3, 'LOTO-EXT-2026-0042', '2026-08-19', '2027-08-18', 'CBL Industries Engineering', 'hse/training/certificates/LOTO-EXT-2026-0042.pdf', 'pending', NULL, NULL, FALSE, NULL, 'Practical assessment awaiting verification.', 3, 3),
    ('EMP-PROD-002', 5, 'FOOD-CBL-2025-0098', '2025-07-10', '2026-07-09', 'CBL Quality Department', 'hse/training/certificates/FOOD-CBL-2025-0098.pdf', 'expired', 1, '2025-07-12 10:00:00.000', TRUE, '2026-09-15', 'Renewal scheduled after expiry.', 1, 1),
    ('EMP-ENG-001', 4, 'WAH-VEND-2026-0103', '2026-08-22', '2027-08-21', 'Industrial Skills Pakistan', 'hse/training/certificates/WAH-VEND-2026-0103.pdf', 'verified', 2, '2026-08-23 10:00:00.000', FALSE, NULL, 'External competency evidence verified.', 1, 2);

SELECT certification_id, employee_id, certificate_number, expiry_date, verification_status, renewal_required, renewal_date
FROM training_certifications WHERE deleted_at IS NULL ORDER BY expiry_date;
