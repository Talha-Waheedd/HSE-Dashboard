-- ==============================================================================
-- File: 145_workflow_history.sql
-- Description: Audit trail for workflow execution instances
-- ==============================================================================

CREATE TABLE IF NOT EXISTS workflow_history (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary Key',
    workflow_definition_id BIGINT UNSIGNED NOT NULL COMMENT 'FK to workflow_definitions',
    workflow_step_id BIGINT UNSIGNED COMMENT 'FK to workflow_steps (if applicable)',
    module_name VARCHAR(100) NOT NULL COMMENT 'Module (e.g., HSE)',
    reference_id BIGINT UNSIGNED NOT NULL COMMENT 'ID of the record being approved (e.g., hazard_id)',
    
    action_taken ENUM('SUBMITTED', 'APPROVED', 'REJECTED', 'ESCALATED', 'ABORTED') NOT NULL COMMENT 'Action performed',
    previous_status VARCHAR(100) COMMENT 'Status before action',
    new_status VARCHAR(100) COMMENT 'Status after action',
    
    actor_id BIGINT UNSIGNED NOT NULL COMMENT 'User ID who performed the action',
    comments TEXT COMMENT 'Approval or rejection comments',
    attachment_urls JSON COMMENT 'URLs/Paths to any attachments provided during action',
    duration_minutes INT UNSIGNED COMMENT 'Time taken in this step before action was performed',
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Timestamp of the action',
    
    PRIMARY KEY (id),
    INDEX idx_workflow_history_ref (module_name, reference_id),
    INDEX idx_workflow_history_actor (actor_id),
    
    CONSTRAINT fk_workflow_hist_def FOREIGN KEY (workflow_definition_id) 
        REFERENCES workflow_definitions (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_workflow_hist_step FOREIGN KEY (workflow_step_id) 
        REFERENCES workflow_steps (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Complete history of workflow actions and approvals';

-- ==============================================================================
-- Seed Data
-- ==============================================================================
-- No seed data required for transaction history table.

-- ==============================================================================
-- Verification
-- ==============================================================================
SELECT 'workflow_history' AS table_name, COUNT(*) AS record_count FROM workflow_history;
