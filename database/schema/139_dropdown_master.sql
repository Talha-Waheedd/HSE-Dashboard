-- ==============================================================================
-- File: 139_dropdown_master.sql
-- Description: Universal Dropdown Master table to eliminate hardcoded UI values
-- ==============================================================================

CREATE TABLE IF NOT EXISTS dropdown_master (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary Key',
    code VARCHAR(100) NOT NULL COMMENT 'Unique code identifier (e.g., HAZARD_CATEGORIES)',
    name VARCHAR(100) NOT NULL COMMENT 'Human readable name for the dropdown',
    description VARCHAR(255) COMMENT 'Description of where this dropdown is used',
    module_name VARCHAR(100) COMMENT 'Associated module (e.g., HSE, HR, System)',
    is_system BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'If true, system relies on this and it cannot be deleted',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Whether this dropdown is currently active',
    
    -- Enterprise Audit Fields
    created_by BIGINT UNSIGNED COMMENT 'User ID who created the record',
    updated_by BIGINT UNSIGNED COMMENT 'User ID who last updated the record',
    deleted_by BIGINT UNSIGNED COMMENT 'User ID who deleted the record',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft delete timestamp',
    
    PRIMARY KEY (id),
    UNIQUE KEY uk_dropdown_master_code (code, deleted_at),
    INDEX idx_dropdown_module (module_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Defines the categories of configurable dropdowns';

-- ==============================================================================
-- Seed Data
-- ==============================================================================
INSERT INTO dropdown_master (code, name, description, module_name, is_system) VALUES 
('HAZARD_CATEGORIES', 'Hazard Categories', 'Categories for hazard reporting', 'HSE', TRUE),
('DEPARTMENTS', 'Departments', 'Company organizational departments', 'HR', TRUE),
('INCIDENT_TYPES', 'Incident Types', 'Types of incidents (LTI, RWC, etc.)', 'HSE', TRUE),
('TRAINING_TYPES', 'Training Types', 'Types of HSE trainings', 'HSE', TRUE),
('AUDIT_TYPES', 'Audit Types', 'Types of audits conducted', 'HSE', TRUE),
('RISK_LEVELS', 'Risk Levels', 'Risk matrix severity levels', 'HSE', TRUE),
('EMPLOYMENT_TYPES', 'Employment Types', 'Types of employment (Permanent, Contractor)', 'HR', FALSE),
('BLOOD_GROUPS', 'Blood Groups', 'Employee blood groups', 'HR', FALSE),
('COUNTRIES', 'Countries', 'List of countries', 'System', TRUE),
('CITIES', 'Cities', 'List of cities', 'System', FALSE),
('UNITS', 'Units of Measure', 'Standard UOMs', 'System', TRUE),
('PRIORITY_LEVELS', 'Priority Levels', 'General priority levels', 'System', TRUE),
('GENDERS', 'Genders', 'Gender options', 'HR', TRUE),
('MARITAL_STATUS', 'Marital Status', 'Marital status options', 'HR', FALSE),
('VEHICLE_TYPES', 'Vehicle Types', 'Types of vehicles for logistics/security', 'Logistics', FALSE),
('PPE_TYPES', 'PPE Types', 'Personal Protective Equipment categories', 'HSE', TRUE);

-- ==============================================================================
-- Verification
-- ==============================================================================
SELECT 'dropdown_master' AS table_name, COUNT(*) AS record_count FROM dropdown_master;
