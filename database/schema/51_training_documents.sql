-- ==================================================
-- TABLE NAME
--   training_documents
--
-- Purpose
--   Versioned cloud document metadata for attendance sheets, materials,
--   certificates, assessments, quizzes, images, videos, SOPs, and slides.
--
-- Relationships
--   training_sessions, users as uploaders/verifiers, and audit owners.
--
-- Indexes
--   Session/type/version, checksum, verification queue, document format, deletion.
--
-- Workflow
--   Uploaded -> Pending Verification -> Verified or Rejected; versions remain auditable.
--
-- Author
--   CBL HSE Database Architecture
--
-- Version
--   1.0.0 | Phase 6 | MySQL 8
-- ==================================================

USE cbl_hse;

CREATE TABLE IF NOT EXISTS training_documents (
    training_document_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    training_session_id  BIGINT UNSIGNED NULL,
    document_type        ENUM('attendance_sheet', 'training_material', 'certificate', 'assessment_paper', 'quiz_result', 'image', 'video', 'sop_reference', 'presentation_slide', 'other') NOT NULL,
    document_title       VARCHAR(255) NOT NULL,
    file_extension       ENUM('pdf', 'excel', 'word', 'jpg', 'png', 'mp4', 'pptx', 'other') NOT NULL,
    version_number       DECIMAL(5,2) NOT NULL DEFAULT 1.00,
    file_checksum        CHAR(64) NOT NULL,
    cloud_path           VARCHAR(1000) NOT NULL,
    uploaded_by          BIGINT UNSIGNED NOT NULL,
    verified_by          BIGINT UNSIGNED NULL,
    verification_status  ENUM('pending', 'verified', 'rejected') NOT NULL DEFAULT 'pending',
    verified_at          DATETIME(3) NULL,
    remarks              TEXT NULL,
    created_by           BIGINT UNSIGNED NOT NULL,
    updated_by           BIGINT UNSIGNED NOT NULL,
    created_at           DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at           DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at           DATETIME(3) NULL,

    PRIMARY KEY (training_document_id),
    UNIQUE KEY uq_training_document_version (training_session_id, document_title, version_number),
    UNIQUE KEY uq_training_document_checksum (file_checksum),
    CONSTRAINT chk_training_document_version CHECK (version_number > 0),
    CONSTRAINT chk_training_document_verification CHECK ((verification_status = 'pending' AND verified_by IS NULL AND verified_at IS NULL) OR (verification_status IN ('verified', 'rejected') AND verified_by IS NOT NULL AND verified_at IS NOT NULL)),
    CONSTRAINT fk_training_document_session FOREIGN KEY (training_session_id) REFERENCES training_sessions (training_session_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_training_document_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_training_document_verified_by FOREIGN KEY (verified_by) REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_training_document_created_by FOREIGN KEY (created_by) REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_training_document_updated_by FOREIGN KEY (updated_by) REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_training_document_session_type (training_session_id, document_type),
    INDEX idx_training_document_verification (verification_status, verified_at),
    INDEX idx_training_document_format (file_extension),
    INDEX idx_training_document_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Versioned training document and evidence repository metadata.';

INSERT INTO training_documents
    (training_session_id, document_type, document_title, file_extension, version_number, file_checksum, cloud_path, uploaded_by, verified_by, verification_status, verified_at, remarks, created_by, updated_by)
VALUES
    (1, 'attendance_sheet', 'HSE Induction Attendance Sheet', 'excel', 1.00, 'b111111111111111111111111111111111111111111111111111111111111111', 'hse/training/TRN-2026-00001/attendance.xlsx', 1, 1, 'verified', '2026-08-06 10:00:00.000', 'Signed attendance reconciled.', 1, 1),
    (2, 'training_material', 'Fire Safety Presentation', 'pptx', 2.00, 'b222222222222222222222222222222222222222222222222222222222222222', 'hse/training/TRN-2026-00002/materials/fire-safety-v2.pptx', 2, NULL, 'pending', NULL, 'Updated evacuation route slide pending verification.', 2, 2),
    (3, 'assessment_paper', 'LOTO Practical Assessment', 'pdf', 1.00, 'b333333333333333333333333333333333333333333333333333333333333333', 'hse/training/TRN-2026-00003/assessment/loto-practical.pdf', 3, 1, 'verified', '2026-08-20 10:00:00.000', 'Assessment template controlled by HSE.', 3, 1),
    (4, 'certificate', 'Working at Height Certificate Template', 'word', 1.00, 'b444444444444444444444444444444444444444444444444444444444444444', 'hse/training/TRN-2026-00004/certificates/template.docx', 5, NULL, 'pending', NULL, 'Vendor template awaiting document control review.', 1, 1),
    (5, 'sop_reference', 'Food Hygiene SOP Reference', 'pdf', 3.00, 'b555555555555555555555555555555555555555555555555555555555555555', 'hse/training/TRN-2026-00005/references/food-hygiene-sop-v3.pdf', 2, 1, 'verified', '2026-07-11 10:00:00.000', 'Controlled SOP linked to quality document register.', 2, 1);

SELECT training_document_id, training_session_id, document_type, document_title, version_number, verification_status
FROM training_documents WHERE deleted_at IS NULL ORDER BY training_document_id;
