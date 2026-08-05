-- =============================================================================
-- 10_user_roles.sql
-- CBL HSE Management System — Phase 2: Authentication & RBAC
-- Table: user_roles
--
-- Description:
--   Many-to-many bridge table linking Users to Roles.
--   A single user can hold multiple roles simultaneously.
--   Examples:
--     Ali → EMPLOYEE + DEPT_ADMIN
--     Sara → HSE_MANAGER + AUDITOR
--
--   Includes:
--     - Role expiry (expires_at) for temporary role grants (e.g. acting manager)
--     - assigned_by audit trail
--     - Soft-delete for complete history
--     - Unique constraint preventing duplicate role assignments
--
-- Depends on: 06_roles.sql, 09_users.sql
-- Run: SOURCE database/schema/10_user_roles.sql;
-- =============================================================================

USE cbl_hse;

-- -----------------------------------------------------------------------------
-- Table Definition
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS user_roles (

    -- ── Identity ──────────────────────────────────────────────────────────────
    user_role_id        BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT          COMMENT 'Surrogate PK for this assignment record.',

    -- ── Relationship ──────────────────────────────────────────────────────────
    user_id             BIGINT UNSIGNED     NOT NULL                         COMMENT 'FK → users.user_id — the user receiving this role.',
    role_id             BIGINT UNSIGNED     NOT NULL                         COMMENT 'FK → roles.role_id — the role being assigned.',

    -- ── Assignment Details ────────────────────────────────────────────────────
    assigned_by         BIGINT UNSIGNED     NOT NULL                         COMMENT 'FK → users.user_id — admin or manager who granted this role.',
    assigned_date       DATETIME(3)         NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'Timestamp when the role was assigned.',
    expires_at          DATETIME(3)         NULL                             COMMENT 'Optional expiry timestamp. NULL = permanent. Used for temporary roles (acting, interim).',
    reason              VARCHAR(500)        NULL                             COMMENT 'Reason or justification for this role assignment. Useful for audit trail.',

    -- ── Status ────────────────────────────────────────────────────────────────
    is_active           BOOLEAN             NOT NULL DEFAULT TRUE            COMMENT 'FALSE = role assignment is suspended without removing the record.',

    -- ── Audit Fields ──────────────────────────────────────────────────────────
    revoked_by          BIGINT UNSIGNED     NULL                             COMMENT 'FK → users.user_id — admin who revoked this role. NULL if not yet revoked.',
    revoked_at          DATETIME(3)         NULL                             COMMENT 'Timestamp when this role was revoked. NULL if still active.',
    revoke_reason       VARCHAR(500)        NULL                             COMMENT 'Reason for revoking this role assignment.',

    created_at          DATETIME(3)         NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at          DATETIME(3)         NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at          DATETIME(3)         NULL                             COMMENT 'Soft-delete timestamp. Preserves full role assignment history.',

    -- ── Constraints ───────────────────────────────────────────────────────────
    PRIMARY KEY (user_role_id),

    UNIQUE KEY uq_user_roles_pair (user_id, role_id)                        COMMENT 'A user cannot be assigned the same role twice simultaneously.',

    -- ── Foreign Keys ──────────────────────────────────────────────────────────
    CONSTRAINT fk_ur_user
        FOREIGN KEY (user_id)     REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE CASCADE,                                 -- Deleting a user removes all their role assignments

    CONSTRAINT fk_ur_role
        FOREIGN KEY (role_id)     REFERENCES roles (role_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,                                -- Cannot delete a role while users are assigned to it

    CONSTRAINT fk_ur_assigned_by
        FOREIGN KEY (assigned_by) REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,

    CONSTRAINT fk_ur_revoked_by
        FOREIGN KEY (revoked_by)  REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE SET NULL,

    -- ── Indexes ───────────────────────────────────────────────────────────────
    INDEX idx_ur_user_id        (user_id)       COMMENT 'Fast lookup of all roles for a user — critical for login/auth flow.',
    INDEX idx_ur_role_id        (role_id)       COMMENT 'Fast lookup of all users in a role.',
    INDEX idx_ur_is_active      (is_active)     COMMENT 'Filter active role assignments.',
    INDEX idx_ur_expires_at     (expires_at)    COMMENT 'Identify expiring role assignments for cleanup jobs.',
    INDEX idx_ur_deleted_at     (deleted_at)

) ENGINE=InnoDB
  AUTO_INCREMENT=1
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='User-to-Role assignment bridge. Supports multiple roles per user, expiry, and full audit trail.';


-- =============================================================================
-- Seed Data — Initial role assignments
--
-- user_id mapping (from 09_users.sql seed order):
--   1 = ahmed.raza    → HSE Manager    → assign HSE_ADMIN + HSE_MANAGER
--   2 = sara.ali      → HSE Officer    → EMPLOYEE + AUDITOR
--   3 = bilal.hussain → HSE Officer    → EMPLOYEE
--   4 = tariq.mehmood → Prod Manager   → DEPT_ADMIN + DEPT_MANAGER
--   5 = usman.farooq  → Prod Supv.     → DEPT_MANAGER
--   6 = zafar.iqbal   → Eng Manager    → DEPT_ADMIN + DEPT_MANAGER
--   7 = fatima.zahra  → HR Manager     → DEPT_ADMIN + DEPT_MANAGER
--   8 = imran.siddiqui → QC Manager    → DEPT_MANAGER
--   9 = ali.hassan    → IT Manager     → SUPER_ADMIN + DEPT_ADMIN
-- =============================================================================

INSERT INTO user_roles (user_id, role_id, assigned_by, reason) VALUES

-- ahmed.raza: HSE_ADMIN + HSE_MANAGER (system bootstrapped — assigned_by self)
(1, 2, 1,  'Bootstrap: Initial HSE Administrator assignment.'),
(1, 3, 1,  'Bootstrap: Initial HSE Manager operational role.'),

-- sara.ali: HSE_MANAGER + AUDITOR
(2, 3, 1,  'Assigned as HSE Manager for Plant Floor operations.'),
(2, 6, 1,  'Additional Auditor role for conducting internal audits.'),

-- bilal.hussain: EMPLOYEE
(3, 7, 1,  'Standard employee role.'),

-- tariq.mehmood: DEPT_ADMIN + DEPT_MANAGER (Production)
(4, 4, 1,  'Department Administrator for Production.'),
(4, 5, 1,  'Department Manager for Production.'),

-- usman.farooq: DEPT_MANAGER (Production)
(5, 5, 1,  'Department Manager — Production Line Supervisor.'),

-- zafar.iqbal: DEPT_ADMIN + DEPT_MANAGER (Engineering)
(6, 4, 1,  'Department Administrator for Engineering.'),
(6, 5, 1,  'Department Manager for Engineering.'),

-- fatima.zahra: DEPT_ADMIN + DEPT_MANAGER (HR)
(7, 4, 1,  'Department Administrator for Human Resources.'),
(7, 5, 1,  'Department Manager for Human Resources.'),

-- imran.siddiqui: DEPT_MANAGER (QC)
(8, 5, 1,  'Department Manager for Quality Control.'),

-- ali.hassan: SUPER_ADMIN + DEPT_ADMIN (IT)
(9, 1, 1,  'Bootstrap: IT Manager assigned Super Administrator for system maintenance.'),
(9, 4, 1,  'Department Administrator for IT.')

ON DUPLICATE KEY UPDATE
    is_active   = VALUES(is_active),
    updated_at  = CURRENT_TIMESTAMP(3);


-- =============================================================================
-- Verification
-- =============================================================================

-- Full user-role assignment summary
SELECT
    u.username,
    u.email,
    r.role_code,
    r.role_name,
    r.hierarchy_level,
    ur.assigned_date,
    ur.expires_at,
    ur.is_active
FROM user_roles ur
JOIN users u ON ur.user_id = u.user_id
JOIN roles r ON ur.role_id = r.role_id
WHERE ur.deleted_at IS NULL
ORDER BY r.hierarchy_level, u.username;


-- Effective permissions for a specific user (example: ahmed.raza → user_id = 1)
-- This query simulates what the application does on login to build the JWT permissions claim.
SELECT DISTINCT
    p.permission_code,
    p.module,
    p.action,
    p.permission_name
FROM user_roles     ur
JOIN role_permissions rp ON ur.role_id        = rp.role_id
JOIN permissions      p  ON rp.permission_id  = p.permission_id
WHERE ur.user_id    = 1
  AND ur.is_active  = TRUE
  AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
  AND ur.deleted_at IS NULL
  AND p.is_active   = TRUE
  AND p.deleted_at  IS NULL
ORDER BY p.module, p.action;
