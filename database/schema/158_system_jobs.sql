-- ==============================================================================
-- File: 158_system_jobs.sql
-- Description: Tracking and configuration for background cron/queue jobs
-- ==============================================================================

CREATE TABLE IF NOT EXISTS system_jobs (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary Key',
    job_name VARCHAR(100) NOT NULL COMMENT 'Unique identifier (e.g., DAILY_ANALYTICS_SYNC)',
    queue_name VARCHAR(100) NOT NULL DEFAULT 'default' COMMENT 'BullMQ or Queue name',
    job_type ENUM('CRON', 'QUEUE_WORKER', 'ONE_OFF') NOT NULL COMMENT 'Type of background job',
    
    cron_expression VARCHAR(50) COMMENT 'Cron string if job_type is CRON (e.g., 0 0 * * *)',
    handler_class VARCHAR(255) NOT NULL COMMENT 'Node.js/Backend handler reference',
    
    status ENUM('IDLE', 'RUNNING', 'FAILED', 'SUCCESS', 'PAUSED') NOT NULL DEFAULT 'IDLE' COMMENT 'Current job status',
    last_run_at TIMESTAMP NULL COMMENT 'Timestamp of last execution',
    next_run_at TIMESTAMP NULL COMMENT 'Timestamp of next scheduled execution (if cron)',
    
    last_duration_ms INT UNSIGNED COMMENT 'Duration of the last run in milliseconds',
    retry_count INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Number of retries on current failure',
    max_retries INT UNSIGNED NOT NULL DEFAULT 3 COMMENT 'Max allowed retries before permanent failure',
    
    last_error_log TEXT COMMENT 'Stack trace or error message from last failure',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Whether this job is enabled',
    
    -- Enterprise Audit Fields
    created_by BIGINT UNSIGNED COMMENT 'User ID who created the record',
    updated_by BIGINT UNSIGNED COMMENT 'User ID who last updated the record',
    deleted_by BIGINT UNSIGNED COMMENT 'User ID who deleted the record',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft delete timestamp',
    
    PRIMARY KEY (id),
    UNIQUE KEY uk_system_job_name (job_name, deleted_at),
    INDEX idx_system_job_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Configuration and status for background system jobs';

-- ==============================================================================
-- Seed Data
-- ==============================================================================
INSERT INTO system_jobs (job_name, queue_name, job_type, cron_expression, handler_class, is_active) VALUES 
('DAILY_ANALYTICS_SYNC', 'analytics', 'CRON', '0 0 * * *', 'AnalyticsSnapshotJob', TRUE),
('WEEKLY_BACKUP', 'system', 'CRON', '0 2 * * 0', 'DatabaseBackupJob', TRUE),
('PROCESS_EMAIL_QUEUE', 'email', 'QUEUE_WORKER', NULL, 'EmailQueueWorker', TRUE),
('PROCESS_SMS_QUEUE', 'sms', 'QUEUE_WORKER', NULL, 'SmsQueueWorker', TRUE);

-- ==============================================================================
-- Verification
-- ==============================================================================
SELECT 'system_jobs' AS table_name, COUNT(*) AS record_count FROM system_jobs;
