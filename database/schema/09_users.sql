-- =============================================================================
-- 09_users.sql
-- CBL HSE Management System — Phase 2: Authentication & RBAC
-- Table: users
--
-- Description:
--   System user accounts table. Handles both Microsoft Entra ID (SSO) logins
--   and fallback local admin accounts. Each user MUST be linked to an employee
--   record. Employee information is NOT duplicated here.
--
--   Security design follows OWASP recommendations:
--     - Passwords hashed with bcrypt (never stored in plaintext)
--     - Account lockout after configurable failed attempts
--     - Azure Object ID stored for SSO token validation
--     - Refresh token support via separate token store (future table)
--     - Soft-delete preserves audit trail
--     - All auth events reflected in failed_login_attempts, locked_until,
--       last_login, password_changed_at
--
--   Authentication modes supported:
--     1. Microsoft Entra ID SSO (primary — for all CBL employees)
--     2. Local username/password (fallback — for Super Admin only)
--
-- Depends on: 04_employees.sql
-- Run: SOURCE database/schema/09_users.sql;
-- =============================================================================

USE cbl_hse;

-- -----------------------------------------------------------------------------
-- Table Definition
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS users (

    -- ── Identity ──────────────────────────────────────────────────────────────
    user_id                 BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT          COMMENT 'Surrogate PK — integer for fast FK joins in RBAC lookups.',
    employee_id             CHAR(36)            NOT NULL                         COMMENT 'FK → employees.employee_id. Each user must have an employee profile. (1:1)',
    username                VARCHAR(60)         NOT NULL                         COMMENT 'Unique login handle for local auth. Convention: firstname.lastname e.g. ahmed.raza',
    email                   VARCHAR(255)        NOT NULL                         COMMENT 'Login email. Must match employee email for SSO validation.',

    -- ── Local Authentication ───────────────────────────────────────────────────
    password_hash           VARCHAR(255)        NULL                             COMMENT 'bcrypt hash of password (min 12 rounds). NULL for SSO-only accounts.',
    password_changed_at     DATETIME(3)         NULL                             COMMENT 'Timestamp of last password change. Used to enforce password expiry policy.',
    password_reset_token    VARCHAR(255)        NULL                             COMMENT 'Hashed one-time password reset token. Cleared after use.',
    password_reset_expires  DATETIME(3)         NULL                             COMMENT 'Expiry timestamp for the password reset token.',

    -- ── Microsoft Entra ID / Azure AD ─────────────────────────────────────────
    azure_object_id         VARCHAR(100)        NULL                             COMMENT 'Microsoft Azure AD Object ID (oid claim in JWT). Globally unique across all tenants.',
    azure_tenant_id         VARCHAR(100)        NULL                             COMMENT 'Azure AD Tenant ID. Required for multi-tenant validation.',
    is_microsoft_account    BOOLEAN             NOT NULL DEFAULT FALSE           COMMENT 'TRUE = this account authenticates via Microsoft SSO. Local password login is disabled.',

    -- ── Session & Security ────────────────────────────────────────────────────
    last_login              DATETIME(3)         NULL                             COMMENT 'Timestamp of the most recent successful login.',
    last_login_ip           VARCHAR(45)         NULL                             COMMENT 'IP address of the most recent successful login (supports IPv4 and IPv6).',
    failed_login_attempts   TINYINT UNSIGNED    NOT NULL DEFAULT 0               COMMENT 'Consecutive failed login attempts since last success. Reset on successful login.',
    locked_until            DATETIME(3)         NULL                             COMMENT 'Account locked until this timestamp. NULL = not locked. Populated after N failed attempts.',
    last_activity_at        DATETIME(3)         NULL                             COMMENT 'Timestamp of the most recent API request. Used for session timeout detection.',

    -- ── Multi-Factor Authentication (future-ready) ────────────────────────────
    mfa_enabled             BOOLEAN             NOT NULL DEFAULT FALSE           COMMENT 'TRUE = user has MFA enabled. Reserved for future TOTP/Authenticator app integration.',
    mfa_secret              VARCHAR(255)        NULL                             COMMENT 'Encrypted TOTP secret for MFA. NULL if MFA not enabled.',

    -- ── Status & Flags ────────────────────────────────────────────────────────
    status                  ENUM(
                                'active',       -- Can log in normally
                                'inactive',     -- Account deactivated by admin
                                'locked',       -- Locked due to failed attempts (see locked_until)
                                'suspended',    -- Manually suspended by Super Admin
                                'pending'       -- Invited but not yet logged in
                            )                   NOT NULL DEFAULT 'pending'       COMMENT 'Current account status. Controls login eligibility.',
    is_active               BOOLEAN             NOT NULL DEFAULT TRUE            COMMENT 'Quick active flag. FALSE = account is disabled regardless of status.',
    email_verified          BOOLEAN             NOT NULL DEFAULT FALSE           COMMENT 'TRUE = email address has been confirmed. Always TRUE for SSO accounts.',
    email_verify_token      VARCHAR(255)        NULL                             COMMENT 'One-time email verification token for local accounts.',
    email_verify_expires    DATETIME(3)         NULL                             COMMENT 'Expiry of email verification token.',

    -- ── Preferences ───────────────────────────────────────────────────────────
    timezone                VARCHAR(60)         NOT NULL DEFAULT 'Asia/Karachi'  COMMENT 'User preferred timezone for displaying dates and times.',
    locale                  VARCHAR(10)         NOT NULL DEFAULT 'en'            COMMENT 'User preferred locale code e.g. en, ur.',
    notification_preference ENUM('email', 'in_app', 'both', 'none')
                                                NOT NULL DEFAULT 'both'          COMMENT 'How the user wants to receive notifications.',

    -- ── Audit Fields ──────────────────────────────────────────────────────────
    created_by              BIGINT UNSIGNED     NULL                             COMMENT 'FK → users.user_id — admin who created this account.',
    updated_by              BIGINT UNSIGNED     NULL                             COMMENT 'FK → users.user_id — admin who last modified this account.',
    created_at              DATETIME(3)         NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at              DATETIME(3)         NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at              DATETIME(3)         NULL                             COMMENT 'Soft-delete timestamp. Preserves audit trail. NULL = active.',

    -- ── Constraints ───────────────────────────────────────────────────────────
    PRIMARY KEY (user_id),
    UNIQUE KEY uq_users_employee_id     (employee_id)       COMMENT '1:1 with employees. One employee = one user account.',
    UNIQUE KEY uq_users_username        (username)          COMMENT 'Usernames must be globally unique.',
    UNIQUE KEY uq_users_email           (email)             COMMENT 'Email addresses must be globally unique.',
    UNIQUE KEY uq_users_azure_object_id (azure_object_id)   COMMENT 'Azure Object IDs must be unique — prevents duplicate SSO accounts.',

    -- ── Foreign Keys ──────────────────────────────────────────────────────────
    CONSTRAINT fk_users_employee
        FOREIGN KEY (employee_id) REFERENCES employees (employee_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,                                   -- Cannot delete employee if they have a user account

    CONSTRAINT fk_users_created_by
        FOREIGN KEY (created_by) REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE SET NULL,

    CONSTRAINT fk_users_updated_by
        FOREIGN KEY (updated_by) REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE SET NULL,

    -- ── Indexes ───────────────────────────────────────────────────────────────
    INDEX idx_users_status              (status)            COMMENT 'Filter active/inactive users quickly.',
    INDEX idx_users_is_active           (is_active),
    INDEX idx_users_is_microsoft        (is_microsoft_account),
    INDEX idx_users_last_login          (last_login)        COMMENT 'Sort by recent login for session reports.',
    INDEX idx_users_locked_until        (locked_until)      COMMENT 'Identify currently locked accounts.',
    INDEX idx_users_deleted_at          (deleted_at)

) ENGINE=InnoDB
  AUTO_INCREMENT=1
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='System user accounts. Linked 1:1 to employees. Supports both Microsoft SSO and local auth.';


-- =============================================================================
-- Seed Data — System user accounts linked to seeded employees
--
-- Notes:
--   - password_hash below is a bcrypt hash of 'Admin@123!' (12 rounds) — CHANGE IN PRODUCTION.
--   - Azure IDs are placeholder UUIDs — replace with real Azure Object IDs.
--   - Super Admin uses local auth (is_microsoft_account = FALSE).
--   - All other users use Microsoft SSO (password_hash = NULL).
-- =============================================================================

INSERT INTO users (
    employee_id,            username,               email,
    password_hash,          azure_object_id,        azure_tenant_id,
    is_microsoft_account,   status,                 is_active,
    email_verified,         timezone,               locale
) VALUES

-- ── Super Admin (local fallback account) ─────────────────────────────────────
-- password = Admin@123!  →  bcrypt 12 rounds (CHANGE IMMEDIATELY IN PRODUCTION)
(
    'EMP-HSE-001',          'ahmed.raza',           'ahmed.raza@cbl.com.pk',
    '$2b$12$XeOXEsYIPPlE5d0LkzznuueV7RpRb3jNPh4OfGvgH6n6z9U7H0UAC',
    NULL,                   NULL,
    FALSE,                  'active',               TRUE,
    TRUE,                   'Asia/Karachi',         'en'
),

-- ── Microsoft SSO Accounts ────────────────────────────────────────────────────
('EMP-HSE-002',     'sara.ali',             'sara.ali@cbl.com.pk',
 NULL,              'aad-obj-hse-002',      'aad-tenant-cbl-001',
 TRUE,              'active',   TRUE,   TRUE,   'Asia/Karachi', 'en'),

('EMP-HSE-003',     'bilal.hussain',        'bilal.hussain@cbl.com.pk',
 NULL,              'aad-obj-hse-003',      'aad-tenant-cbl-001',
 TRUE,              'active',   TRUE,   TRUE,   'Asia/Karachi', 'en'),

('EMP-PROD-001',    'tariq.mehmood',        'tariq.mehmood@cbl.com.pk',
 NULL,              'aad-obj-prod-001',     'aad-tenant-cbl-001',
 TRUE,              'active',   TRUE,   TRUE,   'Asia/Karachi', 'en'),

('EMP-PROD-002',    'usman.farooq',         'usman.farooq@cbl.com.pk',
 NULL,              'aad-obj-prod-002',     'aad-tenant-cbl-001',
 TRUE,              'active',   TRUE,   TRUE,   'Asia/Karachi', 'en'),

('EMP-ENG-001',     'zafar.iqbal',          'zafar.iqbal@cbl.com.pk',
 NULL,              'aad-obj-eng-001',      'aad-tenant-cbl-001',
 TRUE,              'active',   TRUE,   TRUE,   'Asia/Karachi', 'en'),

('EMP-HR-001',      'fatima.zahra',         'fatima.zahra@cbl.com.pk',
 NULL,              'aad-obj-hr-001',       'aad-tenant-cbl-001',
 TRUE,              'active',   TRUE,   TRUE,   'Asia/Karachi', 'en'),

('EMP-QC-001',      'imran.siddiqui',       'imran.siddiqui@cbl.com.pk',
 NULL,              'aad-obj-qc-001',       'aad-tenant-cbl-001',
 TRUE,              'active',   TRUE,   TRUE,   'Asia/Karachi', 'en'),

('EMP-IT-001',      'ali.hassan',           'ali.hassan@cbl.com.pk',
 NULL,              'aad-obj-it-001',       'aad-tenant-cbl-001',
 TRUE,              'active',   TRUE,   TRUE,   'Asia/Karachi', 'en')

ON DUPLICATE KEY UPDATE
    status      = VALUES(status),
    is_active   = VALUES(is_active),
    updated_at  = CURRENT_TIMESTAMP(3);


-- =============================================================================
-- Verification
-- =============================================================================

SELECT
    u.user_id,
    u.username,
    u.email,
    u.is_microsoft_account,
    u.status,
    u.is_active,
    e.designation,
    d.department_code
FROM users u
JOIN employees   e ON u.employee_id   = e.employee_id
LEFT JOIN departments d ON e.department_id = d.department_id
ORDER BY u.user_id;
