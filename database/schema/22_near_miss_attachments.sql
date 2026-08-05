-- ==================================================
-- TABLE NAME
--   near_miss_attachments
--
-- Purpose
--   Stores unlimited evidence files for a near miss, including before/after
--   images, videos, PDF, DOCX, Excel, and investigation evidence.
--
-- Relationships
--   near_misses (1) -> near_miss_attachments (many); users verify and upload.
--
-- Indexes
--   Near miss/type, checksum, verification status, upload timestamp, deletion.
--
-- Workflow
--   Uploaded -> Pending Verification -> Verified or Rejected.
--
-- Author
--   CBL HSE Database Architecture
--
-- Version
--   1.0.0 | Phase 4 | MySQL 8
-- ==================================================

USE cbl_hse;

CREATE TABLE IF NOT EXISTS near_miss_attachments (
    attachment_id       BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    near_miss_id        BIGINT UNSIGNED NOT NULL COMMENT 'FK -> near_misses.near_miss_id.',
    attachment_type     ENUM('before_image', 'after_image', 'investigation_evidence', 'video', 'document', 'other')
                            NOT NULL COMMENT 'Business purpose of the evidence file.',
    file_name           VARCHAR(255) NOT NULL,
    file_extension      VARCHAR(12) NOT NULL,
    mime_type           VARCHAR(100) NOT NULL COMMENT 'Validated MIME type from the upload service.',
    file_size_bytes     BIGINT UNSIGNED NOT NULL,
    file_checksum       CHAR(64) NOT NULL COMMENT 'SHA-256 checksum for integrity and duplicate detection.',
    cloud_path          VARCHAR(1000) NOT NULL COMMENT 'Object-storage path; binary content is not stored in MySQL.',
    uploaded_by         BIGINT UNSIGNED NOT NULL COMMENT 'FK -> users.user_id.',
    uploaded_at         DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    verification_status ENUM('pending', 'verified', 'rejected') NOT NULL DEFAULT 'pending',
    verified_by         BIGINT UNSIGNED NULL COMMENT 'FK -> users.user_id.',
    verified_at         DATETIME(3) NULL,
    verification_notes  VARCHAR(1000) NULL,
    created_by          BIGINT UNSIGNED NOT NULL,
    updated_by          BIGINT UNSIGNED NOT NULL,
    created_at          DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at          DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at          DATETIME(3) NULL,

    PRIMARY KEY (attachment_id),
    UNIQUE KEY uq_nm_attachment_checksum (near_miss_id, file_checksum),
    CONSTRAINT chk_nm_attachment_size CHECK (file_size_bytes > 0),
    CONSTRAINT chk_nm_attachment_verification CHECK (
        (verification_status = 'pending' AND verified_by IS NULL AND verified_at IS NULL)
        OR (verification_status IN ('verified', 'rejected') AND verified_by IS NOT NULL AND verified_at IS NOT NULL)
    ),
    CONSTRAINT fk_nm_attachment_near_miss FOREIGN KEY (near_miss_id) REFERENCES near_misses (near_miss_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_nm_attachment_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_nm_attachment_verified_by FOREIGN KEY (verified_by) REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_nm_attachment_created_by FOREIGN KEY (created_by) REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_nm_attachment_updated_by FOREIGN KEY (updated_by) REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_nm_attachment_type (near_miss_id, attachment_type),
    INDEX idx_nm_attachment_verification (verification_status, uploaded_at),
    INDEX idx_nm_attachment_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Evidence repository metadata for near miss records.';

INSERT INTO near_miss_attachments
    (near_miss_id, attachment_type, file_name, file_extension, mime_type, file_size_bytes, file_checksum,
     cloud_path, uploaded_by, uploaded_at, verification_status, verified_by, verified_at, verification_notes,
     created_by, updated_by)
VALUES
    (1, 'before_image', 'pedestrian-route-before.jpg', 'jpg', 'image/jpeg', 248731,
     '1111111111111111111111111111111111111111111111111111111111111111',
     'hse/near-misses/NM-2026-0001/before/pedestrian-route-before.jpg', 2, '2026-07-28 09:28:00.000', 'verified', 2, '2026-07-28 09:35:00.000', 'Image clearly shows the route obstruction.', 2, 2),
    (1, 'after_image', 'pedestrian-route-after.jpg', 'jpg', 'image/jpeg', 264902,
     '2222222222222222222222222222222222222222222222222222222222222222',
     'hse/near-misses/NM-2026-0001/after/pedestrian-route-after.jpg', 2, '2026-07-28 09:29:00.000', 'verified', 2, '2026-07-28 09:36:00.000', 'Segregation marking restored and visible.', 2, 2),
    (3, 'investigation_evidence', 'workshop-housekeeping-review.pdf', 'pdf', 'application/pdf', 782144,
     '3333333333333333333333333333333333333333333333333333333333333333',
     'hse/near-misses/NM-2026-0003/investigation/workshop-housekeeping-review.pdf', 4, '2026-08-01 22:05:00.000', 'pending', NULL, NULL, NULL, 4, 4);

SELECT attachment_id, near_miss_id, attachment_type, file_name, verification_status
FROM near_miss_attachments WHERE deleted_at IS NULL ORDER BY attachment_id;
