-- ==============================================================================
-- File: 141_email_templates.sql
-- Description: Configurable email templates for systemic notifications
-- ==============================================================================

CREATE TABLE IF NOT EXISTS email_templates (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary Key',
    template_code VARCHAR(100) NOT NULL COMMENT 'Unique code (e.g., HAZARD_ASSIGNED)',
    name VARCHAR(150) NOT NULL COMMENT 'Descriptive name of the template',
    module_name VARCHAR(100) NOT NULL COMMENT 'Associated module (e.g., HSE, Auth)',
    language_code VARCHAR(10) NOT NULL DEFAULT 'en-US' COMMENT 'Language locale',
    subject VARCHAR(255) NOT NULL COMMENT 'Email Subject Line',
    html_body TEXT NOT NULL COMMENT 'HTML formatted body of the email',
    text_body TEXT COMMENT 'Plain text fallback for the email body',
    available_variables JSON COMMENT 'JSON array of variables available (e.g., ["{{userName}}", "{{link}}"])',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Whether this template is currently active',
    version INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'Version number for tracking template changes',
    
    -- Enterprise Audit Fields
    created_by BIGINT UNSIGNED COMMENT 'User ID who created the record',
    updated_by BIGINT UNSIGNED COMMENT 'User ID who last updated the record',
    deleted_by BIGINT UNSIGNED COMMENT 'User ID who deleted the record',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft delete timestamp',
    
    PRIMARY KEY (id),
    UNIQUE KEY uk_email_template_code_lang (template_code, language_code, deleted_at),
    INDEX idx_email_template_module (module_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Email templates with variable substitution support';

-- ==============================================================================
-- Seed Data
-- ==============================================================================
INSERT INTO email_templates 
    (template_code, name, module_name, subject, html_body, text_body, available_variables) 
VALUES 
    ('HAZARD_ASSIGNED', 'Hazard Assigned Notification', 'HSE', 'Action Required: Hazard Assigned - {{hazardId}}', '<h1>Hazard Assigned</h1><p>Dear {{userName}},</p><p>A hazard ({{hazardId}}) has been assigned to you. Please review.</p><a href="{{link}}">View Hazard</a>', 'Dear {{userName}},\n\nA hazard ({{hazardId}}) has been assigned to you. View it here: {{link}}', '["{{userName}}", "{{hazardId}}", "{{link}}"]'),
    ('CAPA_ASSIGNED', 'CAPA Assigned', 'HSE', 'Action Required: CAPA Assigned - {{capaId}}', '<h1>CAPA Assigned</h1><p>Dear {{userName}},</p><p>A CAPA ({{capaId}}) has been assigned to you with a due date of {{dueDate}}.</p><a href="{{link}}">View CAPA</a>', 'Dear {{userName}},\n\nA CAPA ({{capaId}}) is assigned to you. Due: {{dueDate}}', '["{{userName}}", "{{capaId}}", "{{dueDate}}", "{{link}}"]'),
    ('TRAINING_REMINDER', 'Training Reminder', 'HSE', 'Reminder: Upcoming Training - {{trainingName}}', '<h1>Training Reminder</h1><p>Dear {{userName}},</p><p>You are scheduled for {{trainingName}} on {{trainingDate}}.</p>', 'Dear {{userName}},\n\nYou are scheduled for {{trainingName}} on {{trainingDate}}.', '["{{userName}}", "{{trainingName}}", "{{trainingDate}}"]'),
    ('PASSWORD_RESET', 'Password Reset Request', 'Auth', 'Reset Your Password', '<h1>Password Reset</h1><p>Click <a href="{{resetLink}}">here</a> to reset your password. Valid for 1 hour.</p>', 'Reset password here: {{resetLink}}', '["{{resetLink}}"]'),
    ('OTP_LOGIN', 'OTP Login', 'Auth', 'Your Login OTP', '<h1>OTP Login</h1><p>Your OTP is: <strong>{{otpCode}}</strong></p>', 'Your OTP is: {{otpCode}}', '["{{otpCode}}"]');

-- ==============================================================================
-- Verification
-- ==============================================================================
SELECT 'email_templates' AS table_name, COUNT(*) AS record_count FROM email_templates;
