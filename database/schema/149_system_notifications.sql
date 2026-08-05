-- ==============================================================================
-- File: 149_system_notifications.sql
-- Description: Stores in-app user notifications
-- ==============================================================================

CREATE TABLE IF NOT EXISTS system_notifications (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary Key',
    user_id BIGINT UNSIGNED NOT NULL COMMENT 'User receiving the notification',
    sender_id BIGINT UNSIGNED NULL COMMENT 'User triggering the notification (NULL = System)',
    
    title VARCHAR(255) NOT NULL COMMENT 'Notification headline',
    message TEXT NOT NULL COMMENT 'Full notification message text',
    priority ENUM('LOW', 'NORMAL', 'HIGH', 'URGENT') NOT NULL DEFAULT 'NORMAL' COMMENT 'Priority level',
    
    module_name VARCHAR(100) COMMENT 'Associated module (e.g., HSE)',
    reference_id BIGINT UNSIGNED COMMENT 'ID of the associated record',
    
    action_link VARCHAR(255) COMMENT 'Standard web relative URL',
    deep_link VARCHAR(255) COMMENT 'Mobile OS deep link URI',
    
    status ENUM('UNREAD', 'READ', 'ARCHIVED') NOT NULL DEFAULT 'UNREAD' COMMENT 'Notification state',
    read_at TIMESTAMP NULL COMMENT 'When the user read it',
    expires_at TIMESTAMP NULL COMMENT 'When this notification auto-deletes or archives',
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    
    PRIMARY KEY (id),
    INDEX idx_sys_notif_user_status (user_id, status),
    INDEX idx_sys_notif_module (module_name, reference_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='In-app user notifications hub';

-- ==============================================================================
-- Seed Data
-- ==============================================================================
-- No seed data required for user notification transactions.

-- ==============================================================================
-- Verification
-- ==============================================================================
SELECT 'system_notifications' AS table_name, COUNT(*) AS record_count FROM system_notifications;
