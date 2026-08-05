-- ==================================================
-- TABLE NAME
--   audit_documents
--
-- Purpose
--   Versioned cloud document metadata for audit reports, inspection reports,
--   evidence photos, multimedia, certificates, and compliance evidence.
--
-- Relationships
--   audits, inspections, compliance_requirements, users as uploaders/verifiers.
--
-- Indexes
--   Audit/inspection/type, requirement/type, checksum, verification, version, deletion.
--
-- Workflow
--   Uploaded -> Pending Verification -> Verified or Rejected; revisions are retained.
--
-- Author
--   CBL HSE Database Architecture
--
-- Version
--   1.0.0 | Phase 7 | MySQL 8
-- ==================================================

USE cbl_hse;

CREATE TABLE IF NOT EXISTS audit_documents (
    audit_document_id    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    audit_id             BIGINT UNSIGNED NULL,
    inspection_id        BIGINT UNSIGNED NULL,
    requirement_id       BIGINT UNSIGNED NULL,
    document_type        ENUM('audit_report', 'inspection_report', 'evidence_photo', 'certificate', 'compliance_evidence', 'other') NOT NULL,
    file_format          ENUM('pdf', 'excel', 'word', 'video', 'audio', 'jpg', 'png', 'other') NOT NULL,
    document_title       VARCHAR(255) NOT NULL,
    revision_number      SMALLINT UNSIGNED NOT NULL DEFAULT 1,
    checksum             CHAR(64) NOT NULL,
    cloud_path           VARCHAR(1000) NOT NULL,
    version_number       DECIMAL(5,2) NOT NULL DEFAULT 1.00,
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
    PRIMARY KEY (audit_document_id),
    UNIQUE KEY uq_audit_document_checksum (checksum),
    UNIQUE KEY uq_audit_document_revision (document_title, revision_number),
    CONSTRAINT chk_audit_document_source CHECK (audit_id IS NOT NULL OR inspection_id IS NOT NULL OR requirement_id IS NOT NULL),
    CONSTRAINT chk_audit_document_version CHECK (version_number > 0 AND revision_number > 0),
    CONSTRAINT chk_audit_document_verification CHECK ((verification_status = 'pending' AND verified_by IS NULL AND verified_at IS NULL) OR (verification_status IN ('verified', 'rejected') AND verified_by IS NOT NULL AND verified_at IS NOT NULL)),
    CONSTRAINT fk_audit_document_audit FOREIGN KEY (audit_id) REFERENCES audits (audit_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_audit_document_inspection FOREIGN KEY (inspection_id) REFERENCES inspections (inspection_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_audit_document_requirement FOREIGN KEY (requirement_id) REFERENCES compliance_requirements (requirement_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_audit_document_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_audit_document_verified_by FOREIGN KEY (verified_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_audit_document_created_by FOREIGN KEY (created_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_audit_document_updated_by FOREIGN KEY (updated_by) REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_audit_document_audit_type (audit_id, document_type),
    INDEX idx_audit_document_inspection_type (inspection_id, document_type),
    INDEX idx_audit_document_requirement_type (requirement_id, document_type),
    INDEX idx_audit_document_verification (verification_status, verified_at),
    INDEX idx_audit_document_version (document_title, version_number),
    INDEX idx_audit_document_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Audit, inspection, and compliance evidence document metadata.';

INSERT INTO audit_documents
    (audit_id, inspection_id, requirement_id, document_type, file_format, document_title, revision_number, checksum, cloud_path, version_number, uploaded_by, verified_by, verification_status, verified_at, remarks, created_by, updated_by)
VALUES
    (1, NULL, NULL, 'audit_report', 'pdf', 'ISO 45001 Internal Audit Report', 1, 'c111111111111111111111111111111111111111111111111111111111111111', 'hse/audits/AUD-2026-00001/report.pdf', 1.00, 1, 1, 'verified', '2026-07-20 10:00:00.000', 'Approved audit report.', 1, 1),
    (NULL, 2, NULL, 'inspection_report', 'excel', 'Machine Inspection Checklist Export', 1, 'c222222222222222222222222222222222222222222222222222222222222222', 'hse/inspections/INS-2026-00002/checklist.xlsx', 1.00, 3, NULL, 'pending', NULL, 'Inspection evidence pending verification.', 3, 3),
    (NULL, NULL, 2, 'compliance_evidence', 'pdf', 'ISO 45001 Operational Control Review', 2, 'c333333333333333333333333333333333333333333333333333333333333333', 'hse/compliance/ISO45001/operational-control-review-v2.pdf', 2.00, 1, 1, 'verified', '2026-06-16 10:00:00.000', 'Controlled compliance evidence.', 1, 1),
    (5, NULL, NULL, 'evidence_photo', 'jpg', 'Warehouse Traffic Finding Photo', 1, 'c444444444444444444444444444444444444444444444444444444444444444', 'hse/audits/AUD-2026-00005/evidence/traffic-route.jpg', 1.00, 3, 2, 'verified', '2026-07-30 09:00:00.000', NULL, 3, 2),
    (NULL, 4, NULL, 'inspection_report', 'video', 'Warehouse Inspection Walkthrough', 1, 'c555555555555555555555555555555555555555555555555555555555555555', 'hse/inspections/INS-2026-00004/evidence/walkthrough.mp4', 1.00, 3, NULL, 'pending', NULL, 'Video retained for finding verification.', 3, 3);

SELECT audit_document_id, audit_id, inspection_id, requirement_id, document_type, file_format, verification_status
FROM audit_documents WHERE deleted_at IS NULL ORDER BY audit_document_id;
