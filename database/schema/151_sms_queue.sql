-- ==============================================================================
-- File: 151_sms_queue.sql
-- Description: Job queue for sending SMS messages (OTP, Bulk, Alerts)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS sms_queue (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary Key',
    provider_name VARCHAR(100) NOT NULL DEFAULT 'TWILIO' COMMENT 'SMS Gateway Provider',
    
    recipient_phone VARCHAR(50) NOT NULL COMMENT 'Target phone number with country code',
    message_text TEXT NOT NULL COMMENT 'The SMS payload content',
    
    is_otp BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Is this a time-critical OTP?',
    is_bulk BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Is this part of a bulk marketing/broadcast?',
    
    status ENUM('PENDING', 'PROCESSING', 'DELIVERED', 'FAILED') NOT NULL DEFAULT 'PENDING' COMMENT 'Delivery status',
    
    retry_count INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Number of failed delivery attempts',
    max_retries INT UNSIGNED NOT NULL DEFAULT 3 COMMENT 'Maximum retry attempts allowed',
    provider_response JSON COMMENT 'Raw response from the SMS gateway API',
    error_log TEXT COMMENT 'Error message on failure',
    
    delivered_at TIMESTAMP NULL COMMENT 'When the SMS was confirmed delivered',
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    
    PRIMARY KEY (id),
    INDEX idx_sms_queue_status (status),
    INDEX idx_sms_queue_phone (recipient_phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Queue and history for outgoing SMS messages';

-- ==============================================================================
-- Seed Data
-- ==============================================================================
-- Transaction table, no seed data.

-- ==============================================================================
-- Verification
-- ==============================================================================
SELECT 'sms_queue' AS table_name, COUNT(*) AS record_count FROM sms_queue;
