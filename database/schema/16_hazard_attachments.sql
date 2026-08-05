-- =============================================================================
-- 16_hazard_attachments.sql
-- CBL HSE Management System — Phase 3: Hazard Management Module
-- Table: hazard_attachments
--
-- Purpose:
--   Stores all file attachments linked to a hazard record.
--   A single hazard can have MANY attachments across multiple types:
--   Before/After photos, evidence documents, review images, videos, etc.
--
--   Attachment types are controlled by an ENUM to drive UI grouping:
--     - before_photo   → shown in "Before" gallery during hazard reporting
--     - after_photo    → shown in "After" gallery after corrective action
--     - evidence       → supporting evidence uploaded by any party
--     - review_image   → image uploaded by HSE during review
--     - document       → PDF, Word, Excel reports or permits
--     - video          → video evidence
--
--   File paths stored as relative paths to allow flexible storage backends
--   (Local disk → AWS S3 → Azure Blob without schema changes).
--
-- Relationships:
--   hazards (1) → hazard_attachments (many)
--   users   (1) → hazard_attachments (uploader)
--
-- Depends on: 15_hazards.sql, 09_users.sql
-- Run: SOURCE database/schema/16_hazard_attachments.sql;
-- =============================================================================

USE cbl_hse;

-- -----------------------------------------------------------------------------
-- Table Definition
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS hazard_attachments (

    -- ── Identity ──────────────────────────────────────────────────────────────
    attachment_id       BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT          COMMENT 'Surrogate PK.',

    -- ── Relationship ──────────────────────────────────────────────────────────
    hazard_id           BIGINT UNSIGNED     NOT NULL                         COMMENT 'FK → hazards.hazard_id — the hazard this attachment belongs to.',

    -- ── Attachment Classification ─────────────────────────────────────────────
    attachment_type     ENUM(
                            'before_photo',     -- Photo taken before corrective action
                            'after_photo',      -- Photo taken after corrective action (closure proof)
                            'evidence',         -- Supporting evidence
                            'review_image',     -- Image uploaded by HSE reviewer
                            'rejected_evidence',-- Evidence marked invalid by reviewer
                            'document',         -- PDF, Word, Excel, permit
                            'video',            -- Video evidence
                            'other'             -- Miscellaneous
                        )                   NOT NULL DEFAULT 'evidence'      COMMENT 'Classification of the attachment. Drives UI gallery grouping.',

    -- ── File Details ──────────────────────────────────────────────────────────
    file_name           VARCHAR(300)        NOT NULL                         COMMENT 'Original filename as uploaded by the user. e.g. boiler_room_wire.jpg',
    file_path           VARCHAR(1000)       NOT NULL                         COMMENT 'Relative storage path (not full URL). e.g. uploads/hazards/2026/07/HAZ-SKR-00001/before_photo_001.jpg. Allows storage backend migration.',
    storage_key         VARCHAR(1000)       NULL                             COMMENT 'Cloud storage object key (AWS S3 / Azure Blob). NULL for local storage.',
    mime_type           VARCHAR(100)        NOT NULL                         COMMENT 'MIME type of the file. e.g. image/jpeg, application/pdf, video/mp4. Used for rendering decisions.',
    file_size_bytes     BIGINT UNSIGNED     NOT NULL DEFAULT 0               COMMENT 'File size in bytes. Used for storage quota reporting.',
    file_extension      VARCHAR(10)         NULL                             COMMENT 'Normalized lowercase file extension. e.g. jpg, pdf, mp4.',
    thumbnail_path      VARCHAR(1000)       NULL                             COMMENT 'Path to generated thumbnail image. NULL for non-image files.',
    checksum_sha256     VARCHAR(64)         NULL                             COMMENT 'SHA-256 hash of the file for integrity verification and duplicate detection.',

    -- ── Upload Metadata ───────────────────────────────────────────────────────
    uploaded_by         BIGINT UNSIGNED     NOT NULL                         COMMENT 'FK → users.user_id — the system user who uploaded this file.',
    uploaded_at         DATETIME(3)         NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'Exact timestamp of upload.',
    remarks             VARCHAR(500)        NULL                             COMMENT 'Optional notes about this attachment. e.g. "After photo showing completed repair by engineer".',

    -- ── Review State ──────────────────────────────────────────────────────────
    is_verified         BOOLEAN             NOT NULL DEFAULT FALSE           COMMENT 'TRUE = HSE reviewer has verified this file as valid evidence.',
    is_rejected         BOOLEAN             NOT NULL DEFAULT FALSE           COMMENT 'TRUE = HSE reviewer has rejected this file as insufficient evidence.',
    rejection_reason    VARCHAR(500)        NULL                             COMMENT 'Reason provided by HSE reviewer for rejecting this attachment.',
    verified_by         BIGINT UNSIGNED     NULL                             COMMENT 'FK → users.user_id — reviewer who verified/rejected this attachment.',
    verified_at         DATETIME(3)         NULL                             COMMENT 'Timestamp of verification.',

    -- ── Soft Delete ───────────────────────────────────────────────────────────
    deleted_at          DATETIME(3)         NULL                             COMMENT 'Soft-delete timestamp. Physical file deletion should happen asynchronously after this.',
    created_at          DATETIME(3)         NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at          DATETIME(3)         NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    -- ── Constraints ───────────────────────────────────────────────────────────
    PRIMARY KEY (attachment_id),

    CONSTRAINT chk_attachment_file_size
        CHECK (file_size_bytes >= 0)                                         COMMENT 'File size must be non-negative.',

    -- ── Foreign Keys ──────────────────────────────────────────────────────────
    CONSTRAINT fk_hatt_hazard
        FOREIGN KEY (hazard_id)     REFERENCES hazards (hazard_id)
        ON UPDATE CASCADE ON DELETE CASCADE,                                 -- Deleting hazard removes all attachments

    CONSTRAINT fk_hatt_uploaded_by
        FOREIGN KEY (uploaded_by)   REFERENCES users   (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,

    CONSTRAINT fk_hatt_verified_by
        FOREIGN KEY (verified_by)   REFERENCES users   (user_id)
        ON UPDATE CASCADE ON DELETE SET NULL,

    -- ── Indexes ───────────────────────────────────────────────────────────────
    INDEX idx_hatt_hazard_id            (hazard_id)                         COMMENT 'Primary lookup — all attachments for a hazard.',
    INDEX idx_hatt_hazard_type          (hazard_id, attachment_type)        COMMENT 'Gallery queries — before photos, after photos separately.',
    INDEX idx_hatt_uploaded_by          (uploaded_by),
    INDEX idx_hatt_is_verified          (is_verified),
    INDEX idx_hatt_deleted_at           (deleted_at),
    INDEX idx_hatt_checksum             (checksum_sha256)                   COMMENT 'Duplicate file detection.'

) ENGINE=InnoDB
  AUTO_INCREMENT=1
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Attachments for hazard records. Supports photos, documents, videos. Flexible storage backend paths.';


-- =============================================================================
-- Verification
-- =============================================================================

SELECT
    ha.attachment_id,
    h.hazard_number,
    ha.attachment_type,
    ha.file_name,
    ha.mime_type,
    ha.file_size_bytes,
    ha.is_verified,
    ha.uploaded_at
FROM hazard_attachments ha
JOIN hazards h ON ha.hazard_id = h.hazard_id
WHERE ha.deleted_at IS NULL
ORDER BY ha.hazard_id, ha.attachment_type;

-- Count attachments per type per hazard
SELECT
    h.hazard_number,
    ha.attachment_type,
    COUNT(*) AS count
FROM hazard_attachments ha
JOIN hazards h ON ha.hazard_id = h.hazard_id
WHERE ha.deleted_at IS NULL
GROUP BY ha.hazard_id, ha.attachment_type;
