-- ==============================================================================
-- File: 146_business_rules.sql
-- Description: Dynamic Business Rules Engine
-- ==============================================================================

CREATE TABLE IF NOT EXISTS business_rules (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary Key',
    rule_code VARCHAR(100) NOT NULL COMMENT 'Unique rule code',
    name VARCHAR(150) NOT NULL COMMENT 'Display name of the rule',
    module_name VARCHAR(100) NOT NULL COMMENT 'Associated module (e.g., HSE)',
    
    trigger_event VARCHAR(100) NOT NULL COMMENT 'Event that evaluates this rule (e.g., AFTER_INCIDENT_CREATE)',
    conditions JSON NOT NULL COMMENT 'JSON AST or rule logic (e.g., {"field": "risk", "op": "==", "value": "Extreme"})',
    action_type VARCHAR(100) NOT NULL COMMENT 'Action to perform (e.g., NOTIFY, BLOCK_PERMIT, UPDATE_FIELD)',
    action_payload JSON COMMENT 'Data for the action (e.g., {"role": "PLANT_HEAD", "template": "FATALITY_ALERT"})',
    
    priority INT NOT NULL DEFAULT 0 COMMENT 'Higher number = evaluates first',
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Whether the rule is active',
    description VARCHAR(255) COMMENT 'Plain text description of what the rule does',
    
    -- Enterprise Audit Fields
    created_by BIGINT UNSIGNED COMMENT 'User ID who created the record',
    updated_by BIGINT UNSIGNED COMMENT 'User ID who last updated the record',
    deleted_by BIGINT UNSIGNED COMMENT 'User ID who deleted the record',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft delete timestamp',
    
    PRIMARY KEY (id),
    UNIQUE KEY uk_business_rule_code (rule_code, deleted_at),
    INDEX idx_business_rule_trigger (trigger_event)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Configuration for dynamic business rules and automation';

-- ==============================================================================
-- Seed Data
-- ==============================================================================
INSERT INTO business_rules (rule_code, name, module_name, trigger_event, conditions, action_type, action_payload, description) VALUES 
('RULE_EXTREME_RISK', 'Notify HSE Manager on Extreme Risk', 'HSE', 'AFTER_HAZARD_CREATE', '{"field": "risk_rating", "op": "==", "value": "Extreme"}', 'NOTIFY', '{"role": "HSE_MANAGER", "template": "EXTREME_RISK_ALERT"}', 'If Risk = Extreme -> notify HSE Manager'),
('RULE_FATALITY', 'Notify Plant Head on Fatality', 'HSE', 'AFTER_INCIDENT_CREATE', '{"field": "incident_category", "op": "==", "value": "Fatality"}', 'NOTIFY', '{"role": "PLANT_HEAD", "template": "FATALITY_ALERT"}', 'If Incident Fatality -> notify Plant Head'),
('RULE_TRAINING_EXP', 'Block Permit if Training Expired', 'PTW', 'BEFORE_PERMIT_ISSUE', '{"field": "training_status", "op": "==", "value": "Expired"}', 'BLOCK_ACTION', '{"message": "Required HSE Training has expired."}', 'If Training Expired -> block work permit');

-- ==============================================================================
-- Verification
-- ==============================================================================
SELECT 'business_rules' AS table_name, COUNT(*) AS record_count FROM business_rules;
