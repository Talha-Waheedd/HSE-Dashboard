-- =============================================================================
-- 06_roles.sql
-- CBL HSE Management System — Phase 2: Authentication & RBAC
-- Table: roles
--
-- Description:
--   Defines all system roles. Roles are hierarchical and control access
--   throughout the entire HSE system. Designed for multi-plant scalability.
--   Follows enterprise RBAC standards used in SAP, Oracle, and Enablon.
--
-- Hierarchy (lower number = higher privilege):
--   1 → Super Administrator
--   2 → HSE Administrator
--   3 → HSE Manager / Department Administrator
--   4 → Department Manager / Auditor
--   5 → Employee
--   6 → Contractor / Viewer / System Integration
--
-- Depends on: (none — this is the root RBAC table)
-- Run: SOURCE database/schema/06_roles.sql;
-- =============================================================================

USE cbl_hse;

-- -----------------------------------------------------------------------------
-- Table Definition
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS roles (

    -- ── Identity ──────────────────────────────────────────────────────────────
    role_id             BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT          COMMENT 'Surrogate primary key — auto-increment integer for join performance',
    role_name           VARCHAR(100)        NOT NULL                         COMMENT 'Human-readable role name e.g. HSE Administrator',
    role_code           VARCHAR(50)         NOT NULL                         COMMENT 'Short machine-readable code e.g. HSE_ADMIN. Used in JWT claims and API guards.',
    description         TEXT                NULL                             COMMENT 'Detailed description of what this role can do and who it is assigned to.',

    -- ── Hierarchy & System Flags ──────────────────────────────────────────────
    hierarchy_level     TINYINT UNSIGNED    NOT NULL DEFAULT 99              COMMENT 'Access priority. 1 = highest privilege (Super Admin). 99 = lowest. Used to enforce hierarchy rules (managers cannot modify peers at same level).',
    is_system_role      BOOLEAN             NOT NULL DEFAULT FALSE           COMMENT 'TRUE = role created by system at install time and cannot be deleted or renamed.',
    is_active           BOOLEAN             NOT NULL DEFAULT TRUE            COMMENT 'FALSE = role is disabled globally. No user with this role can log in.',

    -- ── Audit Fields ──────────────────────────────────────────────────────────
    created_by          BIGINT UNSIGNED     NULL                             COMMENT 'FK → users.user_id — user who created this role record.',
    updated_by          BIGINT UNSIGNED     NULL                             COMMENT 'FK → users.user_id — user who last modified this role record.',
    created_at          DATETIME(3)         NOT NULL DEFAULT CURRENT_TIMESTAMP(3)  COMMENT 'Record creation timestamp (millisecond precision).',
    updated_at          DATETIME(3)         NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)  COMMENT 'Last modification timestamp.',
    deleted_at          DATETIME(3)         NULL                             COMMENT 'Soft-delete timestamp. NULL = active. Populated = logically deleted.',

    -- ── Constraints ───────────────────────────────────────────────────────────
    PRIMARY KEY (role_id),
    UNIQUE KEY uq_roles_role_code   (role_code)             COMMENT 'Role codes must be globally unique — used in JWT and application guards.',
    UNIQUE KEY uq_roles_role_name   (role_name)             COMMENT 'Role names must be unique.',

    -- ── Indexes ───────────────────────────────────────────────────────────────
    INDEX idx_roles_hierarchy_level (hierarchy_level)       COMMENT 'Enables fast hierarchical comparisons in permission checks.',
    INDEX idx_roles_is_active       (is_active)             COMMENT 'Filters for active roles quickly.',
    INDEX idx_roles_deleted_at      (deleted_at)            COMMENT 'Enables fast soft-delete filtering.'

) ENGINE=InnoDB
  AUTO_INCREMENT=1
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='System roles for RBAC. Roles are hierarchical and control all access in the HSE system.';


-- =============================================================================
-- Seed Data — Default System Roles
-- is_system_role = TRUE means these cannot be deleted via the application UI.
-- =============================================================================

INSERT INTO roles
    (role_id, role_name,                    role_code,              description,                                                                                                        hierarchy_level, is_system_role, is_active)
VALUES
    (1,  'Super Administrator',             'SUPER_ADMIN',          'Full unrestricted access to all modules, plants, settings, users, and system configuration. Reserved for IT only.',   1,  TRUE,  TRUE),
    (2,  'HSE Administrator',               'HSE_ADMIN',            'Full access to all HSE modules across all departments and plants. Can manage users, permissions, and reports.',        2,  TRUE,  TRUE),
    (3,  'HSE Manager',                     'HSE_MANAGER',          'Manages HSE operations: hazards, incidents, audits, inspections, training. Can approve and close records.',            3,  TRUE,  TRUE),
    (4,  'Department Administrator',        'DEPT_ADMIN',           'Administrative access scoped to their own department. Can manage department users and view all department records.',   3,  TRUE,  TRUE),
    (5,  'Department Manager',              'DEPT_MANAGER',         'Manages department-level records. Can review, assign, and approve actions within their department.',                  4,  TRUE,  TRUE),
    (6,  'Auditor',                         'AUDITOR',              'Can create, conduct, and report on audits and inspections. Read access to related HSE records for audit evidence.',   4,  TRUE,  TRUE),
    (7,  'Employee',                        'EMPLOYEE',             'Standard employee. Can report hazards, near misses, and view their own records and assigned actions.',                5,  TRUE,  TRUE),
    (8,  'Contractor',                      'CONTRACTOR',           'External contractor with highly restricted access. Can only submit hazard reports and view contractor-specific info.', 6,  TRUE,  TRUE),
    (9,  'Viewer',                          'VIEWER',               'Read-only access to dashboards and reports. Cannot create, edit, or delete any records.',                             6,  TRUE,  TRUE),
    (10, 'System Integration',              'SYSTEM_INTEGRATION',   'Non-human service account role used for API integrations (ERP, BI tools). Full read access, targeted write access.',  6,  TRUE,  TRUE)

ON DUPLICATE KEY UPDATE
    role_name       = VALUES(role_name),
    description     = VALUES(description),
    hierarchy_level = VALUES(hierarchy_level),
    is_active       = VALUES(is_active),
    updated_at      = CURRENT_TIMESTAMP(3);


-- =============================================================================
-- Verification
-- =============================================================================

SELECT
    role_id,
    role_code,
    role_name,
    hierarchy_level,
    is_system_role,
    is_active
FROM roles
ORDER BY hierarchy_level, role_id;
