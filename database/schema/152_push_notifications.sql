-- ==============================================================================
-- File: 152_push_notifications.sql
-- Description: History and queue for mobile/web push notifications
-- ==============================================================================

CREATE TABLE IF NOT EXISTS push_notifications (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary Key',
    provider_name ENUM('FIREBASE', 'ONESIGNAL', 'BROWSER_NATIVE') NOT NULL DEFAULT 'FIREBASE' COMMENT 'Push Gateway Provider',
    
    user_id BIGINT UNSIGNED NOT NULL COMMENT 'Target user ID',
    device_token VARCHAR(255) NOT NULL COMMENT 'FCM or APNS or Browser device token',
    platform ENUM('WEB', 'ANDROID', 'IOS') NOT NULL COMMENT 'Target OS platform',
    
    title VARCHAR(255) NOT NULL COMMENT 'Push Title',
    body TEXT NOT NULL COMMENT 'Push Body text',
    icon_url VARCHAR(255) COMMENT 'URL to display icon',
    data_payload JSON COMMENT 'Silent data payload for app to process',
    
    status ENUM('PENDING', 'SENT', 'FAILED') NOT NULL DEFAULT 'PENDING' COMMENT 'Delivery status',
    provider_response JSON COMMENT 'Raw response from Firebase/OneSignal',
    error_log TEXT COMMENT 'Error details if failed',
    
    sent_at TIMESTAMP NULL COMMENT 'When the push was dispatched',
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    
    PRIMARY KEY (id),
    INDEX idx_push_notif_status (status),
    INDEX idx_push_notif_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Queue and history for Mobile/Web Push Notifications';

-- ==============================================================================
-- Seed Data
-- ==============================================================================
-- Transaction table, no seed data.

-- ==============================================================================
-- Verification
-- ==============================================================================
SELECT 'push_notifications' AS table_name, COUNT(*) AS record_count FROM push_notifications;
