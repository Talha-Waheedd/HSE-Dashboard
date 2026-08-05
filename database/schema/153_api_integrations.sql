-- ==============================================================================
-- File: 153_api_integrations.sql
-- Description: Third-party integration configurations (Enterprise Admin layer)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS api_integrations (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary Key',
    integration_code VARCHAR(100) NOT NULL COMMENT 'Unique code (e.g., AZURE_AD, SAP_ERP, POWER_BI)',
    name VARCHAR(150) NOT NULL COMMENT 'Display name of the integration',
    category ENUM('SSO', 'ERP', 'ANALYTICS', 'COMMUNICATION', 'AI', 'MAPS', 'INFRASTRUCTURE') NOT NULL COMMENT 'Type of integration',
    
    base_url VARCHAR(255) COMMENT 'Primary API endpoint URL',
    api_key TEXT COMMENT 'Encrypted API Key',
    client_id VARCHAR(255) COMMENT 'OAuth Client ID',
    client_secret TEXT COMMENT 'Encrypted OAuth Client Secret',
    tenant_id VARCHAR(255) COMMENT 'OAuth Tenant ID (e.g., Azure)',
    
    auth_type ENUM('NONE', 'API_KEY', 'BASIC', 'OAUTH2', 'BEARER') NOT NULL DEFAULT 'NONE' COMMENT 'Authentication method used',
    auth_config JSON COMMENT 'Additional auth properties (e.g., scopes, grant_type)',
    
    is_active BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Whether this integration is currently active',
    last_sync_at TIMESTAMP NULL COMMENT 'Timestamp of last successful data sync (if applicable)',
    
    -- Enterprise Audit Fields
    created_by BIGINT UNSIGNED COMMENT 'User ID who created the record',
    updated_by BIGINT UNSIGNED COMMENT 'User ID who last updated the record',
    deleted_by BIGINT UNSIGNED COMMENT 'User ID who deleted the record',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft delete timestamp',
    
    PRIMARY KEY (id),
    UNIQUE KEY uk_integration_code (integration_code, deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Configurations for third-party system integrations';

-- ==============================================================================
-- Seed Data
-- ==============================================================================
INSERT INTO api_integrations (integration_code, name, category, is_active) VALUES 
('AZURE_AD', 'Microsoft Entra ID (Azure AD)', 'SSO', TRUE),
('MS_GRAPH', 'Microsoft Graph API', 'COMMUNICATION', FALSE),
('SAP_ERP', 'SAP S/4HANA ERP', 'ERP', FALSE),
('POWER_BI', 'Microsoft Power BI Embedded', 'ANALYTICS', TRUE),
('OPENAI', 'OpenAI API (GPT-4)', 'AI', FALSE),
('GOOGLE_MAPS', 'Google Maps API', 'MAPS', TRUE),
('TWILIO_WHATSAPP', 'Twilio WhatsApp Business API', 'COMMUNICATION', FALSE),
('REDIS_CACHE', 'Redis Cluster', 'INFRASTRUCTURE', TRUE);

-- ==============================================================================
-- Verification
-- ==============================================================================
SELECT 'api_integrations' AS table_name, COUNT(*) AS record_count FROM api_integrations;
