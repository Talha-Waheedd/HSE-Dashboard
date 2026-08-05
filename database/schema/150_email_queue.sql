-- ==============================================================================
-- File: 150_email_queue.sql
-- Description: Job queue for sending and tracking transactional emails
-- ==============================================================================

CREATE TABLE IF NOT EXISTS email_queue (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary Key',
    template_code VARCHAR(100) COMMENT 'Reference to email_templates (if used)',
    
    sender_email VARCHAR(255) NOT NULL COMMENT 'From address',
    recipient_email VARCHAR(255) NOT NULL COMMENT 'To address',
    cc_emails JSON COMMENT 'CC addresses',
    bcc_emails JSON COMMENT 'BCC addresses',
    
    subject VARCHAR(255) NOT NULL COMMENT 'Email subject line',
    html_body TEXT NOT NULL COMMENT 'Rendered HTML content',
    attachments JSON COMMENT 'Paths or URLs of attachments to include',
    
    priority INT NOT NULL DEFAULT 0 COMMENT 'Queue priority (higher = faster)',
    status ENUM('PENDING', 'SCHEDULED', 'PROCESSING', 'DELIVERED', 'FAILED', 'BOUNCED', 'OPENED', 'CLICKED') NOT NULL DEFAULT 'PENDING' COMMENT 'Delivery status',
    
    scheduled_for TIMESTAMP NULL COMMENT 'Delay sending until this time',
    retry_count INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Number of failed delivery attempts',
    max_retries INT UNSIGNED NOT NULL DEFAULT 3 COMMENT 'Maximum retry attempts allowed',
    error_log TEXT COMMENT 'Stack trace or SMTP error message on failure',
    
    delivered_at TIMESTAMP NULL COMMENT 'When the email left the SMTP server',
    opened_at TIMESTAMP NULL COMMENT 'When the tracking pixel fired',
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    
    PRIMARY KEY (id),
    INDEX idx_email_queue_status (status, scheduled_for),
    INDEX idx_email_queue_recipient (recipient_email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Queue and history for outgoing emails';

-- ==============================================================================
-- Seed Data
-- ==============================================================================
-- Transaction table, no seed data.

-- ==============================================================================
-- Verification
-- ==============================================================================
SELECT 'email_queue' AS table_name, COUNT(*) AS record_count FROM email_queue;
