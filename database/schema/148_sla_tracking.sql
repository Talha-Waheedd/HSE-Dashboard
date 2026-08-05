-- ==============================================================================
-- File: 148_sla_tracking.sql
-- Description: Tracks live instances of SLAs against specific records
-- ==============================================================================

CREATE TABLE IF NOT EXISTS sla_tracking (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary Key',
    sla_config_id BIGINT UNSIGNED NOT NULL COMMENT 'FK to sla_configuration',
    module_name VARCHAR(100) NOT NULL COMMENT 'Module (e.g., HSE)',
    reference_id BIGINT UNSIGNED NOT NULL COMMENT 'ID of the record being tracked (e.g., hazard_id)',
    
    status ENUM('RUNNING', 'PAUSED', 'COMPLETED', 'BREACHED', 'CANCELLED') NOT NULL DEFAULT 'RUNNING' COMMENT 'Current status of the SLA timer',
    
    start_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'When the SLA clock started',
    target_response_time TIMESTAMP NULL COMMENT 'Deadline for response',
    target_resolution_time TIMESTAMP NULL COMMENT 'Deadline for resolution',
    
    actual_response_time TIMESTAMP NULL COMMENT 'When the response actually occurred',
    actual_resolution_time TIMESTAMP NULL COMMENT 'When the resolution actually occurred',
    
    accumulated_pause_minutes INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Total time SLA was paused in minutes',
    last_pause_time TIMESTAMP NULL COMMENT 'Timestamp when SLA was most recently paused',
    
    is_breached BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Whether the SLA missed the deadline',
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    
    PRIMARY KEY (id),
    UNIQUE KEY uk_sla_tracking_ref (sla_config_id, module_name, reference_id),
    INDEX idx_sla_tracking_status (status),
    
    CONSTRAINT fk_sla_tracking_config FOREIGN KEY (sla_config_id) 
        REFERENCES sla_configuration (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tracking instances of SLAs for specific records';

-- ==============================================================================
-- Seed Data
-- ==============================================================================
-- No seed data required for transaction tracking table.

-- ==============================================================================
-- Verification
-- ==============================================================================
SELECT 'sla_tracking' AS table_name, COUNT(*) AS record_count FROM sla_tracking;
