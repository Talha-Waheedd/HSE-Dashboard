-- ==============================================================================
-- File: 155_webhooks.sql
-- Description: Outgoing webhooks configuration for event-driven integrations
-- ==============================================================================

CREATE TABLE IF NOT EXISTS webhooks (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary Key',
    name VARCHAR(150) NOT NULL COMMENT 'Descriptive name (e.g., SAP Hazard Sync)',
    target_url TEXT NOT NULL COMMENT 'Destination URL',
    http_method ENUM('POST', 'PUT', 'PATCH') NOT NULL DEFAULT 'POST' COMMENT 'Method to use',
    
    event_triggers JSON NOT NULL COMMENT 'Events that trigger this webhook (e.g., ["HAZARD_CLOSED", "INCIDENT_CREATED"])',
    
    auth_type ENUM('NONE', 'BASIC', 'BEARER', 'CUSTOM_HEADER') NOT NULL DEFAULT 'NONE' COMMENT 'Authentication required by destination',
    auth_credentials TEXT COMMENT 'Encrypted credentials or token',
    custom_headers JSON COMMENT 'Any additional static headers required',
    
    payload_template JSON COMMENT 'Optional transformation template for the JSON payload',
    
    max_retries INT UNSIGNED NOT NULL DEFAULT 3 COMMENT 'Max attempts on failure',
    timeout_seconds INT UNSIGNED NOT NULL DEFAULT 10 COMMENT 'Timeout limit for the webhook call',
    
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Whether this webhook is active',
    consecutive_failures INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Count of failures; may auto-disable if too high',
    last_triggered_at TIMESTAMP NULL COMMENT 'When it was last fired',
    
    -- Enterprise Audit Fields
    created_by BIGINT UNSIGNED COMMENT 'User ID who created the record',
    updated_by BIGINT UNSIGNED COMMENT 'User ID who last updated the record',
    deleted_by BIGINT UNSIGNED COMMENT 'User ID who deleted the record',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft delete timestamp',
    
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Configurations for outgoing webhooks';

-- ==============================================================================
-- Seed Data
-- ==============================================================================
INSERT INTO webhooks (name, target_url, http_method, event_triggers, is_active) VALUES 
('SAP Incident Sync', 'https://api.sap-example.com/v1/ehs/incident', 'POST', '["INCIDENT_CLOSED"]', FALSE);

-- ==============================================================================
-- Verification
-- ==============================================================================
SELECT 'webhooks' AS table_name, COUNT(*) AS record_count FROM webhooks;
