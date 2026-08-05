-- ==============================================================================
-- File: 159_feature_flags.sql
-- Description: Feature toggle system for safe deployments and modular rollouts
-- ==============================================================================

CREATE TABLE IF NOT EXISTS feature_flags (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary Key',
    flag_code VARCHAR(100) NOT NULL COMMENT 'Unique code (e.g., ENABLE_AI_ASSISTANT)',
    name VARCHAR(150) NOT NULL COMMENT 'Display name of the feature',
    description VARCHAR(255) COMMENT 'What this feature does',
    
    is_enabled BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Global toggle for the feature',
    is_beta BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Is this feature in Beta phase?',
    
    allowed_roles JSON COMMENT 'Array of role codes allowed to see this if enabled',
    allowed_departments JSON COMMENT 'Array of department IDs allowed to see this if enabled',
    allowed_users JSON COMMENT 'Array of specific user IDs allowed to see this (for early access)',
    
    -- Enterprise Audit Fields
    created_by BIGINT UNSIGNED COMMENT 'User ID who created the record',
    updated_by BIGINT UNSIGNED COMMENT 'User ID who last updated the record',
    deleted_by BIGINT UNSIGNED COMMENT 'User ID who deleted the record',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft delete timestamp',
    
    PRIMARY KEY (id),
    UNIQUE KEY uk_feature_flag_code (flag_code, deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Enterprise feature toggle configurations';

-- ==============================================================================
-- Seed Data
-- ==============================================================================
INSERT INTO feature_flags (flag_code, name, description, is_enabled, is_beta, allowed_roles) VALUES 
('DARK_MODE', 'Dark Mode UI', 'Enables dark mode theme toggle in the UI', TRUE, FALSE, NULL),
('AI_ASSISTANT', 'AI Chat Assistant', 'OpenAI powered HSE assistant', FALSE, TRUE, '["SUPERADMIN", "HSE_MANAGER"]'),
('POWER_BI_EMBED', 'Power BI Dashboards', 'Replaces Recharts with embedded Power BI', FALSE, FALSE, NULL),
('DOCUMENT_OCR', 'Document OCR Parsing', 'Auto-extracts text from uploaded PDF/Images', TRUE, FALSE, NULL),
('OFFLINE_MODE', 'PWA Offline Mode', 'Allows forms to be cached and submitted offline', FALSE, TRUE, NULL),
('MOBILE_APP_SYNC', 'Mobile App API Sync', 'Enables APIs used by the Android/iOS apps', TRUE, FALSE, NULL);

-- ==============================================================================
-- Verification
-- ==============================================================================
SELECT 'feature_flags' AS table_name, COUNT(*) AS record_count FROM feature_flags;
