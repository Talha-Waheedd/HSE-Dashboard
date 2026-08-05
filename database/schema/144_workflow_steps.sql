-- ==============================================================================
-- File: 144_workflow_steps.sql
-- Description: Detailed steps, conditions, and roles for each workflow definition
-- ==============================================================================

CREATE TABLE IF NOT EXISTS workflow_steps (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary Key',
    workflow_definition_id BIGINT UNSIGNED NOT NULL COMMENT 'FK to workflow_definitions',
    step_sequence INT UNSIGNED NOT NULL COMMENT 'Order of execution (1, 2, 3...)',
    step_name VARCHAR(150) NOT NULL COMMENT 'Name of the step (e.g., HSE Manager Review)',
    
    approval_role_id BIGINT UNSIGNED COMMENT 'FK to roles table (assuming dynamic ID or code mapping)',
    approval_role_code VARCHAR(100) COMMENT 'Role code if strict FK is bypassed for portability',
    
    conditions JSON COMMENT 'JSON logic for conditional step execution (e.g., Risk > High)',
    timeout_hours INT UNSIGNED COMMENT 'SLA timeout for this step in hours',
    auto_approval BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'If true, auto-approves if timeout occurs',
    escalation_role_code VARCHAR(100) COMMENT 'Role to escalate to if timeout occurs',
    
    approval_type ENUM('ANY', 'ALL', 'MAJORITY') NOT NULL DEFAULT 'ANY' COMMENT 'If multiple users hold the role, how many must approve',
    requires_comments BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Are comments mandatory for approval?',
    requires_rejection_reason BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Are comments mandatory for rejection?',
    
    next_step_sequence INT UNSIGNED COMMENT 'Sequence ID of the next step (NULL if final)',
    rollback_step_sequence INT UNSIGNED COMMENT 'Sequence ID to return to upon rejection (NULL to abort)',
    
    -- Enterprise Audit Fields
    created_by BIGINT UNSIGNED COMMENT 'User ID who created the record',
    updated_by BIGINT UNSIGNED COMMENT 'User ID who last updated the record',
    deleted_by BIGINT UNSIGNED COMMENT 'User ID who deleted the record',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft delete timestamp',
    
    PRIMARY KEY (id),
    UNIQUE KEY uk_workflow_step_seq (workflow_definition_id, step_sequence, deleted_at),
    
    CONSTRAINT fk_workflow_step_def FOREIGN KEY (workflow_definition_id) 
        REFERENCES workflow_definitions (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Step-by-step configuration for workflows';

-- ==============================================================================
-- Seed Data
-- ==============================================================================
INSERT INTO workflow_steps 
    (workflow_definition_id, step_sequence, step_name, approval_role_code, timeout_hours, approval_type)
SELECT id, 1, 'Initial Review', 'HSE_OFFICER', 24, 'ANY' FROM workflow_definitions WHERE workflow_code = 'HAZARD_APPROVAL' UNION ALL
SELECT id, 2, 'Final Approval', 'HSE_MANAGER', 48, 'ANY' FROM workflow_definitions WHERE workflow_code = 'HAZARD_APPROVAL';

-- ==============================================================================
-- Verification
-- ==============================================================================
SELECT 'workflow_steps' AS table_name, COUNT(*) AS record_count FROM workflow_steps;
