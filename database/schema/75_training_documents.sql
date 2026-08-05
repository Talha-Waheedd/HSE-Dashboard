-- ==================================================
-- TABLE NAME
--   tm_training_documents
--
-- Purpose
--   Versioned document metadata for certificates, attendance sheets, presentations,
--   manuals, SOPs, guidelines, images, videos, and PDFs.
--
-- Relationships
--   tm_training_sessions and users as uploaders/verifiers.
--
-- Indexes
--   Session/type, checksum, verification, revision/version, and deletion.
--
-- Workflow
--   Uploaded -> Pending Verification -> Verified or Rejected.
--
-- Author
--   CBL HSE Database Architecture
--
-- Version
--   1.0.0 | Training Management Extension | MySQL 8
-- ==================================================

USE cbl_hse;

CREATE TABLE IF NOT EXISTS tm_training_documents (
    training_document_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    training_session_id  BIGINT UNSIGNED NOT NULL,
    document_type        ENUM('certificate', 'attendance_sheet', 'presentation', 'pdf', 'video', 'image', 'manual', 'sop', 'guideline', 'other') NOT NULL,
    file_name            VARCHAR(255) NOT NULL,
    storage_path         VARCHAR(1000) NOT NULL,
    version_number       DECIMAL(5,2) NOT NULL DEFAULT 1.00,
    uploaded_by          BIGINT UNSIGNED NOT NULL,
    checksum             CHAR(64) NOT NULL,
    verification_status  ENUM('pending', 'verified', 'rejected') NOT NULL DEFAULT 'pending',
    verified_by          BIGINT UNSIGNED NULL,
    verified_at          DATETIME(3) NULL,
    created_by           BIGINT UNSIGNED NOT NULL,
    updated_by           BIGINT UNSIGNED NOT NULL,
    created_at           DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at           DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at           DATETIME(3) NULL,
    PRIMARY KEY (training_document_id),
    UNIQUE KEY uq_tm_document_checksum (checksum),
    UNIQUE KEY uq_tm_document_session_file_version (training_session_id, file_name, version_number),
    CONSTRAINT chk_tm_document_version CHECK (version_number > 0),
    CONSTRAINT chk_tm_document_verification CHECK ((verification_status = 'pending' AND verified_by IS NULL AND verified_at IS NULL) OR (verification_status IN ('verified','rejected') AND verified_by IS NOT NULL AND verified_at IS NOT NULL)),
    CONSTRAINT fk_tm_document_session FOREIGN KEY (training_session_id) REFERENCES tm_training_sessions (training_session_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_tm_document_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_tm_document_verified_by FOREIGN KEY (verified_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_tm_document_created_by FOREIGN KEY (created_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_tm_document_updated_by FOREIGN KEY (updated_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_tm_document_session_type (training_session_id, document_type),
    INDEX idx_tm_document_verification (verification_status, verified_at),
    INDEX idx_tm_document_version (file_name, version_number),
    INDEX idx_tm_document_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Training Management document and evidence repository.';

INSERT INTO tm_training_documents (training_session_id, document_type, file_name, storage_path, version_number, uploaded_by, checksum, verification_status, verified_by, verified_at, created_by, updated_by)
VALUES
 (1,'attendance_sheet','site-induction-attendance.xlsx','hse/training/TM-TRN-2026-00001/attendance.xlsx',1.00,1,'d111111111111111111111111111111111111111111111111111111111111111','verified',1,'2026-07-03 09:00:00.000',1,1),
 (2,'presentation','fire-fighting-presentation.pptx','hse/training/TM-TRN-2026-00002/material/fire-fighting.pptx',2.00,6,'d222222222222222222222222222222222222222222222222222222222222222','verified',1,'2026-07-06 09:00:00.000',1,1),
 (3,'manual','loto-authorized-person-manual.pdf','hse/training/TM-TRN-2026-00003/manual/loto.pdf',1.00,3,'d333333333333333333333333333333333333333333333333333333333333333','pending',NULL,NULL,3,3),
 (4,'certificate','haccp-certificate-template.pdf','hse/training/TM-TRN-2026-00004/certificates/template.pdf',1.00,10,'d444444444444444444444444444444444444444444444444444444444444444','verified',1,'2026-07-13 09:00:00.000',1,1),
 (14,'guideline','working-at-height-guideline.pdf','hse/training/TM-TRN-2026-00014/guidelines/wah.pdf',1.00,9,'d555555555555555555555555555555555555555555555555555555555555555','pending',NULL,NULL,1,1);

SELECT training_document_id, training_session_id, document_type, file_name, verification_status FROM tm_training_documents WHERE deleted_at IS NULL ORDER BY training_document_id;
