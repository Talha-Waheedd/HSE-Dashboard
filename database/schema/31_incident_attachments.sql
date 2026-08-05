-- ==================================================
-- TABLE NAME
--   incident_attachments
--
-- Purpose
--   Unlimited incident evidence metadata for photographs, videos, medical,
--   police, fire, insurance, environmental, PDF, Excel, DOCX, and investigation files.
--
-- Relationships
--   incidents and users as uploaders/verifiers.
--
-- Indexes
--   Incident/type, checksum, verification queue, upload time, and soft deletion.
--
-- Workflow
--   Pending verification -> Verified or Rejected. Files remain in cloud storage.
--
-- Author
--   CBL HSE Database Architecture
--
-- Version
--   1.0.0 | Phase 5 | MySQL 8
-- ==================================================

USE cbl_hse;

CREATE TABLE IF NOT EXISTS incident_attachments (
    attachment_id       BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    incident_id         BIGINT UNSIGNED NOT NULL,
    attachment_type     ENUM('photo', 'video', 'medical_report', 'police_report', 'fire_report', 'insurance_document', 'environmental_report', 'before_image', 'after_image', 'evidence_file', 'other') NOT NULL,
    file_name           VARCHAR(255) NOT NULL,
    file_extension      VARCHAR(12) NOT NULL,
    mime_type           VARCHAR(100) NOT NULL,
    file_size_bytes     BIGINT UNSIGNED NOT NULL,
    cloud_path          VARCHAR(1000) NOT NULL,
    file_checksum       CHAR(64) NOT NULL COMMENT 'SHA-256 checksum.',
    uploaded_by         BIGINT UNSIGNED NOT NULL,
    uploaded_at         DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    verification_status ENUM('pending', 'verified', 'rejected') NOT NULL DEFAULT 'pending',
    verified_by         BIGINT UNSIGNED NULL,
    verified_at         DATETIME(3) NULL,
    verification_notes  VARCHAR(1000) NULL,
    created_by          BIGINT UNSIGNED NOT NULL,
    updated_by          BIGINT UNSIGNED NOT NULL,
    created_at          DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at          DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at          DATETIME(3) NULL,

    PRIMARY KEY (attachment_id),
    UNIQUE KEY uq_incident_attachment_checksum (incident_id, file_checksum),
    CONSTRAINT chk_incident_attachment_size CHECK (file_size_bytes > 0),
    CONSTRAINT chk_incident_attachment_verification CHECK ((verification_status = 'pending' AND verified_by IS NULL AND verified_at IS NULL) OR (verification_status IN ('verified', 'rejected') AND verified_by IS NOT NULL AND verified_at IS NOT NULL)),
    CONSTRAINT fk_incident_attachment_incident FOREIGN KEY (incident_id) REFERENCES incidents (incident_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_incident_attachment_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_incident_attachment_verified_by FOREIGN KEY (verified_by) REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_incident_attachment_created_by FOREIGN KEY (created_by) REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_incident_attachment_updated_by FOREIGN KEY (updated_by) REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_incident_attachment_type (incident_id, attachment_type),
    INDEX idx_incident_attachment_verification (verification_status, uploaded_at),
    INDEX idx_incident_attachment_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Cloud evidence metadata and verification audit for incidents.';

INSERT INTO incident_attachments
    (incident_id, attachment_type, file_name, file_extension, mime_type, file_size_bytes, cloud_path, file_checksum, uploaded_by, verification_status, verified_by, verified_at, created_by, updated_by)
VALUES
    (1, 'medical_report', 'first-aid-assessment.pdf', 'pdf', 'application/pdf', 182440, 'hse/incidents/INC-2026-000001/medical/first-aid-assessment.pdf', 'a111111111111111111111111111111111111111111111111111111111111111', 2, 'verified', 2, '2026-07-14 12:00:00.000', 2, 2),
    (2, 'photo', 'mcc-panel-before.jpg', 'jpg', 'image/jpeg', 331207, 'hse/incidents/INC-2026-000002/photos/mcc-panel-before.jpg', 'a222222222222222222222222222222222222222222222222222222222222222', 3, 'verified', 2, '2026-07-20 18:00:00.000', 3, 2),
    (3, 'fire_report', 'boiler-fire-report.docx', 'docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 562981, 'hse/incidents/INC-2026-000003/fire/boiler-fire-report.docx', 'a333333333333333333333333333333333333333333333333333333333333333', 3, 'pending', NULL, NULL, 3, 3),
    (4, 'insurance_document', 'rack-damage-claim.xlsx', 'xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 740118, 'hse/incidents/INC-2026-000004/insurance/rack-damage-claim.xlsx', 'a444444444444444444444444444444444444444444444444444444444444444', 2, 'pending', NULL, NULL, 2, 2),
    (5, 'before_image', 'pump-damage-before.jpg', 'jpg', 'image/jpeg', 292551, 'hse/incidents/INC-2026-000005/photos/pump-damage-before.jpg', 'a555555555555555555555555555555555555555555555555555555555555555', 3, 'verified', 2, '2026-08-02 15:00:00.000', 3, 2);

SELECT attachment_id, incident_id, attachment_type, file_name, verification_status
FROM incident_attachments WHERE deleted_at IS NULL ORDER BY attachment_id;
