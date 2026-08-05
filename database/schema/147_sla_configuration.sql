-- ==============================================================================
-- File: 147_sla_configuration.sql
-- Description: Service Level Agreement (SLA) configurations for various processes
-- ==============================================================================

CREATE TABLE IF NOT EXISTS sla_configuration (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary Key',
    sla_code VARCHAR(100) NOT NULL COMMENT 'Unique identifier (e.g., SLA_HAZARD_REVIEW)',
    name VARCHAR(150) NOT NULL COMMENT 'Display name of the SLA',
    module_name VARCHAR(100) NOT NULL COMMENT 'Associated module (e.g., HSE)',
    
    response_hours INT UNSIGNED NOT NULL COMMENT 'Hours allowed for initial response/acknowledgment',
    resolution_hours INT UNSIGNED NOT NULL COMMENT 'Hours allowed for final resolution/closure',
    warning_threshold_percent INT UNSIGNED NOT NULL DEFAULT 80 COMMENT 'Percentage of time passed to trigger warning',
    critical_threshold_percent INT UNSIGNED NOT NULL DEFAULT 95 COMMENT 'Percentage of time passed to trigger critical alert',
    
    operating_hours_id BIGINT UNSIGNED COMMENT 'FK to calendar/working hours if SLA skips weekends',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Whether the SLA is actively enforced',
    
    -- Enterprise Audit Fields
    created_by BIGINT UNSIGNED COMMENT 'User ID who created the record',
    updated_by BIGINT UNSIGNED COMMENT 'User ID who last updated the record',
    deleted_by BIGINT UNSIGNED COMMENT 'User ID who deleted the record',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft delete timestamp',
    
    PRIMARY KEY (id),
    UNIQUE KEY uk_sla_config_code (sla_code, deleted_at),
    INDEX idx_sla_config_module (module_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='SLA rules and thresholds for system processes';

-- ==============================================================================
-- Seed Data
-- ==============================================================================
INSERT INTO sla_configuration (sla_code, name, module_name, response_hours, resolution_hours) VALUES 
('SLA_HAZARD_REVIEW', 'Hazard Review SLA', 'HSE', 24, 72),
('SLA_CAPA_CLOSURE', 'CAPA Closure SLA', 'HSE', 48, 168),
('SLA_INCIDENT_INV', 'Incident Investigation SLA', 'HSE', 24, 336),
('SLA_AUDIT_FINDINGS', 'Audit Findings Resolution', 'HSE', 48, 720);

-- ==============================================================================
-- Verification
-- ==============================================================================
SELECT 'sla_configuration' AS table_name, COUNT(*) AS record_count FROM sla_configuration;
