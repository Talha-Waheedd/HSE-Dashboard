-- ==============================================================================
-- File: 154_api_logs.sql
-- Description: Traffic and error logging for inbound and outbound APIs
-- ==============================================================================

CREATE TABLE IF NOT EXISTS api_logs (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary Key',
    integration_id BIGINT UNSIGNED NULL COMMENT 'FK to api_integrations (if outbound)',
    
    direction ENUM('INBOUND', 'OUTBOUND') NOT NULL COMMENT 'Is this traffic hitting our API, or us hitting an external API?',
    method VARCHAR(10) NOT NULL COMMENT 'HTTP Method (GET, POST, etc.)',
    endpoint_url TEXT NOT NULL COMMENT 'Full URL of the request',
    
    request_headers JSON COMMENT 'Sanitized request headers (no secrets)',
    request_payload JSON COMMENT 'Sanitized request body',
    
    response_status INT COMMENT 'HTTP status code',
    response_headers JSON COMMENT 'Response headers',
    response_payload JSON COMMENT 'Response body (truncated if huge)',
    
    latency_ms INT UNSIGNED COMMENT 'Time taken to complete request in milliseconds',
    error_message TEXT COMMENT 'Exception or error trace if failed',
    retry_count INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Number of retries attempted',
    
    ip_address VARCHAR(45) COMMENT 'IP of the inbound requester',
    user_id BIGINT UNSIGNED COMMENT 'Associated User ID (if authenticated)',
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Timestamp of the request',
    
    PRIMARY KEY (id),
    INDEX idx_api_logs_integration (integration_id),
    INDEX idx_api_logs_status (response_status),
    INDEX idx_api_logs_time (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Audit trail of API requests and responses';

-- ==============================================================================
-- Seed Data
-- ==============================================================================
-- Transaction table, no seed data.

-- ==============================================================================
-- Verification
-- ==============================================================================
SELECT 'api_logs' AS table_name, COUNT(*) AS record_count FROM api_logs;
