-- ==============================================================================
-- File: 138_system_settings.sql
-- Description: Stores global application settings (Enterprise Administration)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS system_settings (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary Key',
    setting_key VARCHAR(100) NOT NULL COMMENT 'Unique identifier for the setting (e.g., COMPANY_NAME)',
    setting_value TEXT COMMENT 'Value of the setting',
    setting_group VARCHAR(50) NOT NULL COMMENT 'Group/Category (e.g., General, Localization, Security, Email)',
    data_type VARCHAR(20) NOT NULL DEFAULT 'string' COMMENT 'Type of data: string, integer, boolean, json, enum',
    is_encrypted BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'If true, value is stored encrypted',
    is_editable BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'If false, cannot be modified via UI',
    is_visible BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'If false, hidden from the UI entirely',
    validation_rules JSON COMMENT 'Validation rules (regex, min, max, etc.)',
    description VARCHAR(255) COMMENT 'Description of the setting',
    
    -- Enterprise Audit Fields
    created_by BIGINT UNSIGNED COMMENT 'User ID who created the record',
    updated_by BIGINT UNSIGNED COMMENT 'User ID who last updated the record',
    deleted_by BIGINT UNSIGNED COMMENT 'User ID who deleted the record',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft delete timestamp',
    
    PRIMARY KEY (id),
    UNIQUE KEY uk_setting_key (setting_key, deleted_at),
    INDEX idx_setting_group (setting_group),
    
    CHECK (data_type IN ('string', 'integer', 'boolean', 'json', 'enum'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Global application configuration settings';

-- ==============================================================================
-- Seed Data
-- ==============================================================================
INSERT INTO system_settings 
    (setting_key, setting_value, setting_group, data_type, is_encrypted, is_editable, description)
VALUES 
    ('COMPANY_NAME', 'Continental Biscuits Limited', 'General', 'string', FALSE, TRUE, 'Official company name'),
    ('PLANT_LOGO_URL', '/assets/images/logo.png', 'General', 'string', FALSE, TRUE, 'URL to the primary plant logo'),
    ('TIMEZONE', 'Asia/Karachi', 'Localization', 'string', FALSE, TRUE, 'System default timezone'),
    ('WORKING_DAYS', '["Monday","Tuesday","Wednesday","Thursday","Friday"]', 'Localization', 'json', FALSE, TRUE, 'Standard working days array'),
    ('CURRENCY', 'PKR', 'Localization', 'string', FALSE, TRUE, 'Default system currency'),
    ('DATE_FORMAT', 'DD-MM-YYYY', 'Localization', 'string', FALSE, TRUE, 'Default date display format'),
    ('TIME_FORMAT', '24H', 'Localization', 'enum', FALSE, TRUE, '12H or 24H time format'),
    ('LANGUAGE', 'en-US', 'Localization', 'string', FALSE, TRUE, 'Default interface language'),
    ('DEFAULT_DASHBOARD', '/dashboard/hse', 'UI', 'string', FALSE, TRUE, 'Default landing page post-login'),
    ('DEFAULT_THEME', 'LU_BRAND', 'UI', 'string', FALSE, TRUE, 'Default UI theme identifier'),
    ('SESSION_TIMEOUT', '30', 'Security', 'integer', FALSE, TRUE, 'Session timeout in minutes'),
    ('PASSWORD_EXPIRY_DAYS', '90', 'Security', 'integer', FALSE, TRUE, 'Days until password expires'),
    ('MAX_LOGIN_ATTEMPTS', '5', 'Security', 'integer', FALSE, TRUE, 'Max failed attempts before account lockout'),
    ('EMAIL_SERVER_SMTP', 'smtp.cblapp.com', 'Integration', 'string', FALSE, TRUE, 'SMTP server address'),
    ('EMAIL_SERVER_PORT', '587', 'Integration', 'integer', FALSE, TRUE, 'SMTP server port'),
    ('EMAIL_SERVER_USER', 'notifications@cblapp.com', 'Integration', 'string', FALSE, TRUE, 'SMTP username'),
    ('EMAIL_SERVER_PASS', 'encrypted_password_here', 'Integration', 'string', TRUE, TRUE, 'SMTP password'),
    ('ENABLE_PUSH_NOTIFICATIONS', 'true', 'Notifications', 'boolean', FALSE, TRUE, 'Global toggle for push notifications');

-- ==============================================================================
-- Verification
-- ==============================================================================
SELECT 'system_settings' AS table_name, COUNT(*) AS record_count FROM system_settings;
