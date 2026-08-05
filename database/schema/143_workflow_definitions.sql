-- ==============================================================================
-- File: 143_workflow_definitions.sql
-- Description: Dynamic workflow engine configuration for approval processes
-- ==============================================================================

CREATE TABLE IF NOT EXISTS workflow_definitions (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary Key',
    workflow_code VARCHAR(100) NOT NULL COMMENT 'Unique identifier (e.g., HAZARD_APPROVAL)',
    name VARCHAR(150) NOT NULL COMMENT 'Display name of the workflow',
    module_name VARCHAR(100) NOT NULL COMMENT 'Associated module (e.g., HSE, Documents)',
    description VARCHAR(255) COMMENT 'Purpose of the workflow',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Whether the workflow is enabled',
    version INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'Version control for workflow changes',
    
    -- Enterprise Audit Fields
    created_by BIGINT UNSIGNED COMMENT 'User ID who created the record',
    updated_by BIGINT UNSIGNED COMMENT 'User ID who last updated the record',
    deleted_by BIGINT UNSIGNED COMMENT 'User ID who deleted the record',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft delete timestamp',
    
    PRIMARY KEY (id),
    UNIQUE KEY uk_workflow_code (workflow_code, version, deleted_at),
    INDEX idx_workflow_module (module_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Master definitions for dynamic workflows';

-- ==============================================================================
-- Seed Data
-- ==============================================================================
INSERT INTO workflow_definitions (workflow_code, name, module_name, description) VALUES 
('HAZARD_APPROVAL', 'Hazard Approval Workflow', 'HSE', 'Standard workflow for hazard review and closure'),
('INCIDENT_APPROVAL', 'Incident Approval Workflow', 'HSE', 'Approval workflow for incident investigations'),
('SOP_APPROVAL', 'SOP Document Approval', 'Documents', 'Multi-step approval for standard operating procedures'),
('AUDIT_APPROVAL', 'Audit Findings Approval', 'HSE', 'Review of audit findings and non-conformities');

-- ==============================================================================
-- Verification
-- ==============================================================================
SELECT 'workflow_definitions' AS table_name, COUNT(*) AS record_count FROM workflow_definitions;
