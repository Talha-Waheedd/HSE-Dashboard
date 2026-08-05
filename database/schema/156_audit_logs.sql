-- ==============================================================================
-- File: 156_audit_logs.sql
-- Description: Centralized Enterprise Audit Logging (Tracks everything)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary Key',
    user_id BIGINT UNSIGNED NULL COMMENT 'User who performed action (NULL for system)',
    
    action_type ENUM(
        'LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 
        'DOWNLOAD', 'EXPORT', 'PERMISSION_CHANGE', 'ROLE_CHANGE', 'WORKFLOW_ACTION', 'SYSTEM_SETTINGS'
    ) NOT NULL COMMENT 'Category of action performed',
    
    module_name VARCHAR(100) NOT NULL COMMENT 'Affected module (e.g., HSE, Admin)',
    table_name VARCHAR(100) COMMENT 'Affected DB table (e.g., hazards)',
    record_id BIGINT UNSIGNED COMMENT 'ID of the affected record',
    
    old_value JSON COMMENT 'Snapshot of data before change',
    new_value JSON COMMENT 'Snapshot of data after change',
    
    description VARCHAR(255) COMMENT 'Human readable summary of action',
    
    -- Telemetry
    ip_address VARCHAR(45) COMMENT 'IP of the user',
    user_agent TEXT COMMENT 'Browser/Client string',
    os_name VARCHAR(50) COMMENT 'Operating System extracted from User Agent',
    browser_name VARCHAR(50) COMMENT 'Browser extracted from User Agent',
    latitude DECIMAL(10, 8) COMMENT 'GPS Lat (if mobile/geo enabled)',
    longitude DECIMAL(11, 8) COMMENT 'GPS Lng (if mobile/geo enabled)',
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'When the action occurred',
    
    PRIMARY KEY (id),
    INDEX idx_audit_user (user_id),
    INDEX idx_audit_action (action_type),
    INDEX idx_audit_module (module_name, table_name, record_id),
    INDEX idx_audit_time (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Enterprise audit log tracking every significant action';

-- ==============================================================================
-- Seed Data
-- ==============================================================================
-- Transaction table, no seed data.

-- ==============================================================================
-- Verification
-- ==============================================================================
SELECT 'audit_logs' AS table_name, COUNT(*) AS record_count FROM audit_logs;
