-- ==============================================================================
-- File: 160_application_versions.sql
-- Description: Version history and deployment tracking
-- ==============================================================================

CREATE TABLE IF NOT EXISTS application_versions (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary Key',
    version_number VARCHAR(50) NOT NULL COMMENT 'Semantic version (e.g., v1.2.0)',
    
    frontend_version VARCHAR(50) COMMENT 'Frontend build/hash version',
    backend_version VARCHAR(50) COMMENT 'Backend build/hash version',
    database_version VARCHAR(50) COMMENT 'Highest DB migration schema applied',
    
    release_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'When this version was released to production',
    release_notes TEXT COMMENT 'Markdown or text release notes',
    
    is_current BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Is this the currently active version? (Only 1 can be true)',
    rollback_version_id BIGINT UNSIGNED COMMENT 'FK to the previous version to rollback to if needed',
    
    -- Enterprise Audit Fields
    created_by BIGINT UNSIGNED COMMENT 'User ID who created the record',
    updated_by BIGINT UNSIGNED COMMENT 'User ID who last updated the record',
    deleted_by BIGINT UNSIGNED COMMENT 'User ID who deleted the record',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft delete timestamp',
    
    PRIMARY KEY (id),
    UNIQUE KEY uk_app_version_num (version_number, deleted_at),
    
    CONSTRAINT fk_app_version_rollback FOREIGN KEY (rollback_version_id) 
        REFERENCES application_versions (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Application deployment and version history';

-- ==============================================================================
-- Seed Data
-- ==============================================================================
INSERT INTO application_versions 
    (version_number, frontend_version, backend_version, database_version, release_notes, is_current) 
VALUES 
    ('v1.0.0', '1.0.0-build.100', '1.0.0-build.85', '160_application_versions', '# Initial Release\n\n- HSE Core Modules\n- Authentication\n- Enterprise Admin Layer', TRUE);

-- ==============================================================================
-- Verification
-- ==============================================================================
SELECT 'application_versions' AS table_name, COUNT(*) AS record_count FROM application_versions;
