-- ==============================================================================
-- File: 157_activity_stream.sql
-- Description: Social/Activity feed for dashboard timelines
-- ==============================================================================

CREATE TABLE IF NOT EXISTS activity_stream (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary Key',
    user_id BIGINT UNSIGNED NOT NULL COMMENT 'User who performed the activity',
    
    activity_type ENUM('REPORTED', 'CLOSED', 'UPDATED', 'APPROVED', 'REJECTED', 'COMMENTED', 'CREATED', 'ASSIGNED') NOT NULL COMMENT 'Nature of the activity',
    
    module_name VARCHAR(100) NOT NULL COMMENT 'Associated module (e.g., HSE)',
    reference_id BIGINT UNSIGNED NOT NULL COMMENT 'ID of the associated record',
    
    message_html TEXT NOT NULL COMMENT 'Rendered HTML feed message (e.g., <b>Ali</b> reported a Hazard)',
    message_text TEXT NOT NULL COMMENT 'Plain text feed message',
    
    icon_class VARCHAR(100) COMMENT 'UI Icon class (e.g., lucide:alert-circle)',
    color_class VARCHAR(50) COMMENT 'UI Color class (e.g., text-red-600)',
    
    visibility_scope ENUM('PUBLIC', 'DEPARTMENT', 'PRIVATE', 'ROLE') NOT NULL DEFAULT 'PUBLIC' COMMENT 'Who can see this feed item',
    department_id BIGINT UNSIGNED COMMENT 'If scope is DEPARTMENT, limit to this ID',
    role_id BIGINT UNSIGNED COMMENT 'If scope is ROLE, limit to this ID',
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'When the activity occurred',
    
    PRIMARY KEY (id),
    INDEX idx_activity_user (user_id),
    INDEX idx_activity_scope (visibility_scope, department_id, role_id),
    INDEX idx_activity_time (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Data source for Dashboard Activity Timelines';

-- ==============================================================================
-- Seed Data
-- ==============================================================================
INSERT INTO activity_stream 
    (user_id, activity_type, module_name, reference_id, message_html, message_text, icon_class, color_class, visibility_scope) 
VALUES 
    (1, 'REPORTED', 'HSE', 101, '<b>Ali</b> reported a new Hazard in Production', 'Ali reported a new Hazard in Production', 'alert-triangle', 'text-amber-500', 'PUBLIC'),
    (2, 'CLOSED', 'HSE', 205, '<b>Ahmed</b> closed a CAPA action plan', 'Ahmed closed a CAPA action plan', 'check-circle', 'text-emerald-500', 'PUBLIC'),
    (3, 'CREATED', 'HSE', 55, 'A new Training Session was scheduled', 'A new Training Session was scheduled', 'book-open', 'text-blue-500', 'PUBLIC');

-- ==============================================================================
-- Verification
-- ==============================================================================
SELECT 'activity_stream' AS table_name, COUNT(*) AS record_count FROM activity_stream;
