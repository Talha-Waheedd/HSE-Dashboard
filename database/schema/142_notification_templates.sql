-- ==============================================================================
-- File: 142_notification_templates.sql
-- Description: Configurable templates for cross-channel notifications (Push, SMS, Web, Slack)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS notification_templates (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary Key',
    template_code VARCHAR(100) NOT NULL COMMENT 'Unique code (e.g., ALERT_HIGH_RISK)',
    name VARCHAR(150) NOT NULL COMMENT 'Descriptive name',
    module_name VARCHAR(100) NOT NULL COMMENT 'Associated module (e.g., HSE)',
    language_code VARCHAR(10) NOT NULL DEFAULT 'en-US' COMMENT 'Language locale',
    
    -- Channel specific templates
    web_title VARCHAR(255) COMMENT 'Title for Web/In-App Notification',
    web_body TEXT COMMENT 'Body for Web/In-App Notification',
    
    mobile_push_title VARCHAR(255) COMMENT 'Title for Mobile Push',
    mobile_push_body TEXT COMMENT 'Body for Mobile Push',
    
    sms_body TEXT COMMENT 'Body for SMS',
    
    teams_slack_payload JSON COMMENT 'JSON payload structure for Webhooks/Slack/Teams',
    
    available_variables JSON COMMENT 'JSON array of variables available',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Whether this template is currently active',
    
    -- Enterprise Audit Fields
    created_by BIGINT UNSIGNED COMMENT 'User ID who created the record',
    updated_by BIGINT UNSIGNED COMMENT 'User ID who last updated the record',
    deleted_by BIGINT UNSIGNED COMMENT 'User ID who deleted the record',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft delete timestamp',
    
    PRIMARY KEY (id),
    UNIQUE KEY uk_notif_template_code_lang (template_code, language_code, deleted_at),
    INDEX idx_notif_template_module (module_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Templates for SMS, Push, Web, and Webhook notifications';

-- ==============================================================================
-- Seed Data
-- ==============================================================================
INSERT INTO notification_templates 
    (template_code, name, module_name, web_title, web_body, mobile_push_title, mobile_push_body, sms_body, available_variables) 
VALUES 
    ('HAZARD_CREATED', 'New Hazard Reported', 'HSE', 'New Hazard: {{hazardId}}', 'A new hazard was reported in {{location}}.', 'New Hazard: {{hazardId}}', 'A new hazard was reported in {{location}}.', 'Hazard {{hazardId}} reported in {{location}}.', '["{{hazardId}}", "{{location}}"]'),
    ('CAPA_OVERDUE', 'CAPA Overdue', 'HSE', 'CAPA Overdue: {{capaId}}', 'The CAPA {{capaId}} assigned to you is overdue.', 'CAPA Overdue: {{capaId}}', 'CAPA {{capaId}} is overdue!', 'CAPA {{capaId}} is overdue. Please action immediately.', '["{{capaId}}"]');

-- ==============================================================================
-- Verification
-- ==============================================================================
SELECT 'notification_templates' AS table_name, COUNT(*) AS record_count FROM notification_templates;
