-- =============================================================================
-- 08_role_permissions.sql
-- CBL HSE Management System — Phase 2: Authentication & RBAC
-- Table: role_permissions
--
-- Description:
--   Many-to-many bridge table linking Roles to Permissions.
--   This is the core of the RBAC system. Defines exactly what each role
--   can and cannot do in the system.
--
--   Seeding strategy:
--     SUPER_ADMIN          → ALL permissions
--     HSE_ADMIN            → All HSE + User + Report permissions (no system)
--     HSE_MANAGER          → All HSE operational permissions
--     DEPT_ADMIN           → Department-scoped admin permissions
--     DEPT_MANAGER         → Department operational permissions
--     AUDITOR              → Audit/Inspection + read-only HSE
--     EMPLOYEE             → Report hazards/near-misses, view own records
--     CONTRACTOR           → Extremely limited — report hazards only
--     VIEWER               → Read-only across dashboard, reports, HSE records
--     SYSTEM_INTEGRATION   → Full read + targeted write for API calls
--
-- Depends on: 06_roles.sql, 07_permissions.sql
-- Run: SOURCE database/schema/08_role_permissions.sql;
-- =============================================================================

USE cbl_hse;

-- -----------------------------------------------------------------------------
-- Table Definition
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS role_permissions (

    -- ── Identity ──────────────────────────────────────────────────────────────
    role_permission_id  BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT          COMMENT 'Surrogate PK for this bridge record.',

    -- ── Relationship ──────────────────────────────────────────────────────────
    role_id             BIGINT UNSIGNED     NOT NULL                         COMMENT 'FK → roles.role_id',
    permission_id       BIGINT UNSIGNED     NOT NULL                         COMMENT 'FK → permissions.permission_id',

    -- ── Grant Details ─────────────────────────────────────────────────────────
    granted_by          BIGINT UNSIGNED     NULL                             COMMENT 'FK → users.user_id — who granted this permission to this role.',
    granted_at          DATETIME(3)         NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'Timestamp when this permission was granted to the role.',

    -- ── Audit Fields ──────────────────────────────────────────────────────────
    created_at          DATETIME(3)         NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at          DATETIME(3)         NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    -- ── Constraints ───────────────────────────────────────────────────────────
    PRIMARY KEY (role_permission_id),
    UNIQUE KEY uq_role_permissions_pair (role_id, permission_id)            COMMENT 'A permission can only be assigned once per role.',

    -- ── Foreign Keys ──────────────────────────────────────────────────────────
    CONSTRAINT fk_rp_role
        FOREIGN KEY (role_id)       REFERENCES roles       (role_id)
        ON UPDATE CASCADE ON DELETE CASCADE,                                 -- Deleting a role removes all its permissions

    CONSTRAINT fk_rp_permission
        FOREIGN KEY (permission_id) REFERENCES permissions (permission_id)
        ON UPDATE CASCADE ON DELETE CASCADE,                                 -- Deleting a permission removes it from all roles

    -- ── Indexes ───────────────────────────────────────────────────────────────
    INDEX idx_rp_role_id        (role_id)       COMMENT 'Fast lookup of all permissions for a given role.',
    INDEX idx_rp_permission_id  (permission_id) COMMENT 'Fast lookup of all roles that have a given permission.'

) ENGINE=InnoDB
  AUTO_INCREMENT=1
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='RBAC bridge table. Maps roles to their granted permissions.';


-- =============================================================================
-- Helper: Stored Procedure to batch-insert all permissions for a role
-- Dropped and recreated to ensure idempotence.
-- =============================================================================

DROP PROCEDURE IF EXISTS grant_all_permissions;

DELIMITER $$
CREATE PROCEDURE grant_all_permissions(IN p_role_id BIGINT UNSIGNED)
BEGIN
    INSERT IGNORE INTO role_permissions (role_id, permission_id)
    SELECT p_role_id, permission_id
    FROM permissions
    WHERE is_active = TRUE AND deleted_at IS NULL;
END$$
DELIMITER ;

-- ─────────────────────────────────────────────────────────────────────────────
-- Helper: Procedure to grant specific permissions to a role by code
-- ─────────────────────────────────────────────────────────────────────────────

DROP PROCEDURE IF EXISTS grant_permissions;

DELIMITER $$
CREATE PROCEDURE grant_permissions(IN p_role_id BIGINT UNSIGNED, IN p_codes TEXT)
BEGIN
    -- p_codes is a comma-separated list of permission_codes
    -- e.g. 'hazards.view,hazards.create,incidents.view'
    -- We split it with a JSON trick available in MySQL 8.
    INSERT IGNORE INTO role_permissions (role_id, permission_id)
    SELECT p_role_id, permission_id
    FROM permissions
    WHERE FIND_IN_SET(permission_code, p_codes) > 0
      AND is_active = TRUE
      AND deleted_at IS NULL;
END$$
DELIMITER ;


-- =============================================================================
-- Seed Role Permissions
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- Role 1: SUPER_ADMIN — All permissions
-- ─────────────────────────────────────────────────────────────────────────────
CALL grant_all_permissions(1);

-- ─────────────────────────────────────────────────────────────────────────────
-- Role 2: HSE_ADMIN — All HSE, Users, Reports, Documents, Notifications, Settings
--          Does NOT get: system.migrate, system.backup, system.impersonate
-- ─────────────────────────────────────────────────────────────────────────────
CALL grant_permissions(2,
    'dashboard.view,dashboard.view_all_plants,dashboard.export,dashboard.configure,'
    'plants.view,'
    'departments.view,departments.create,departments.edit,'
    'locations.view,locations.create,locations.edit,locations.delete,'
    'employees.view,employees.view_all,employees.create,employees.edit,employees.export,'
    'contractors.view,contractors.create,contractors.edit,contractors.blacklist,'
    'users.view,users.create,users.edit,users.lock,users.reset_password,users.assign_role,users.view_audit_trail,'
    'roles.view,'
    'hazards.view,hazards.view_all,hazards.create,hazards.edit,hazards.delete,hazards.review,hazards.assign,hazards.close,hazards.export,hazards.upload_attachment,'
    'near_misses.view,near_misses.view_all,near_misses.create,near_misses.edit,near_misses.delete,near_misses.review,near_misses.close,near_misses.export,'
    'incidents.view,incidents.view_all,incidents.create,incidents.edit,incidents.delete,incidents.investigate,incidents.approve,incidents.close,incidents.export,incidents.upload_attachment,'
    'investigations.view,investigations.create,investigations.edit,investigations.approve,'
    'rca.view,rca.create,rca.edit,rca.approve,'
    'corrective_actions.view,corrective_actions.view_all,corrective_actions.create,corrective_actions.edit,corrective_actions.delete,corrective_actions.verify,corrective_actions.close,corrective_actions.export,'
    'training.view,training.view_all,training.create,training.edit,training.delete,training.approve,training.export,training.upload_material,'
    'training_attendance.view,training_attendance.mark,training_attendance.edit,training_attendance.export,'
    'tna.view,tna.create,tna.edit,tna.approve,tna.export,'
    'manhours.view,manhours.create,manhours.edit,manhours.export,'
    'audits.view,audits.view_all,audits.create,audits.edit,audits.delete,audits.conduct,audits.approve,audits.close,audits.export,'
    'audit_findings.view,audit_findings.create,audit_findings.edit,audit_findings.close,'
    'inspections.view,inspections.view_all,inspections.schedule,inspections.conduct,inspections.edit,inspections.delete,inspections.approve,inspections.close,inspections.export,'
    'reports.view,reports.view_all,reports.export,reports.schedule,'
    'analytics.view,analytics.view_all,analytics.export,'
    'documents.view,documents.upload,documents.edit,documents.delete,documents.download,documents.approve,'
    'sop.view,sop.create,sop.edit,sop.delete,sop.approve,sop.publish,sop.archive,'
    'notifications.view,notifications.send,notifications.manage,'
    'settings.view,settings.manage,settings.manage_lookups,'
    'system.view_audit_logs,system.manage_integrations'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Role 3: HSE_MANAGER — Operational HSE. Can manage records but not system users.
-- ─────────────────────────────────────────────────────────────────────────────
CALL grant_permissions(3,
    'dashboard.view,dashboard.view_all_plants,dashboard.export,'
    'plants.view,'
    'departments.view,'
    'locations.view,'
    'employees.view,employees.view_all,employees.export,'
    'contractors.view,contractors.create,contractors.edit,contractors.blacklist,'
    'hazards.view,hazards.view_all,hazards.create,hazards.edit,hazards.review,hazards.assign,hazards.close,hazards.export,hazards.upload_attachment,'
    'near_misses.view,near_misses.view_all,near_misses.create,near_misses.edit,near_misses.review,near_misses.close,near_misses.export,'
    'incidents.view,incidents.view_all,incidents.create,incidents.edit,incidents.investigate,incidents.approve,incidents.close,incidents.export,incidents.upload_attachment,'
    'investigations.view,investigations.create,investigations.edit,investigations.approve,'
    'rca.view,rca.create,rca.edit,rca.approve,'
    'corrective_actions.view,corrective_actions.view_all,corrective_actions.create,corrective_actions.edit,corrective_actions.verify,corrective_actions.close,corrective_actions.export,'
    'training.view,training.view_all,training.create,training.edit,training.approve,training.export,training.upload_material,'
    'training_attendance.view,training_attendance.mark,training_attendance.edit,training_attendance.export,'
    'tna.view,tna.create,tna.edit,tna.approve,tna.export,'
    'manhours.view,manhours.create,manhours.edit,manhours.export,'
    'audits.view,audits.view_all,audits.create,audits.edit,audits.conduct,audits.approve,audits.close,audits.export,'
    'audit_findings.view,audit_findings.create,audit_findings.edit,audit_findings.close,'
    'inspections.view,inspections.view_all,inspections.schedule,inspections.conduct,inspections.edit,inspections.approve,inspections.close,inspections.export,'
    'reports.view,reports.view_all,reports.export,reports.schedule,'
    'analytics.view,analytics.view_all,analytics.export,'
    'documents.view,documents.upload,documents.edit,documents.download,documents.approve,'
    'sop.view,sop.create,sop.edit,sop.approve,sop.publish,'
    'notifications.view,notifications.send,'
    'settings.view,settings.manage_lookups'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Role 4: DEPT_ADMIN — Department-scoped administration
-- ─────────────────────────────────────────────────────────────────────────────
CALL grant_permissions(4,
    'dashboard.view,dashboard.export,'
    'departments.view,'
    'locations.view,'
    'employees.view,employees.create,employees.edit,employees.export,'
    'users.view,users.create,users.edit,users.assign_role,'
    'hazards.view,hazards.create,hazards.edit,hazards.assign,hazards.export,hazards.upload_attachment,'
    'near_misses.view,near_misses.create,near_misses.edit,near_misses.export,'
    'incidents.view,incidents.create,incidents.edit,incidents.export,incidents.upload_attachment,'
    'corrective_actions.view,corrective_actions.create,corrective_actions.edit,corrective_actions.export,'
    'training.view,training.create,training.edit,training.export,training.upload_material,'
    'training_attendance.view,training_attendance.mark,training_attendance.export,'
    'tna.view,tna.create,tna.edit,'
    'manhours.view,manhours.create,manhours.edit,'
    'audits.view,audits.export,'
    'inspections.view,inspections.export,'
    'reports.view,reports.export,'
    'analytics.view,'
    'documents.view,documents.upload,documents.download,'
    'sop.view,'
    'notifications.view,notifications.send,'
    'settings.view'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Role 5: DEPT_MANAGER — Manages records within their own department
-- ─────────────────────────────────────────────────────────────────────────────
CALL grant_permissions(5,
    'dashboard.view,dashboard.export,'
    'departments.view,'
    'locations.view,'
    'employees.view,employees.export,'
    'hazards.view,hazards.create,hazards.edit,hazards.assign,hazards.export,hazards.upload_attachment,'
    'near_misses.view,near_misses.create,near_misses.edit,near_misses.export,'
    'incidents.view,incidents.create,incidents.edit,incidents.export,incidents.upload_attachment,'
    'investigations.view,'
    'rca.view,'
    'corrective_actions.view,corrective_actions.create,corrective_actions.edit,corrective_actions.verify,corrective_actions.export,'
    'training.view,training.create,training.edit,training.export,'
    'training_attendance.view,training_attendance.mark,training_attendance.export,'
    'manhours.view,manhours.create,'
    'audits.view,'
    'inspections.view,'
    'reports.view,reports.export,'
    'documents.view,documents.download,'
    'sop.view,'
    'notifications.view'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Role 6: AUDITOR — Conduct audits/inspections + read-only access to evidence
-- ─────────────────────────────────────────────────────────────────────────────
CALL grant_permissions(6,
    'dashboard.view,'
    'departments.view,'
    'locations.view,'
    'employees.view,'
    'hazards.view,hazards.export,'
    'near_misses.view,near_misses.export,'
    'incidents.view,incidents.export,'
    'investigations.view,'
    'rca.view,'
    'corrective_actions.view,corrective_actions.export,'
    'training.view,training.export,'
    'training_attendance.view,'
    'audits.view,audits.view_all,audits.create,audits.edit,audits.conduct,audits.approve,audits.close,audits.export,'
    'audit_findings.view,audit_findings.create,audit_findings.edit,audit_findings.close,'
    'inspections.view,inspections.view_all,inspections.schedule,inspections.conduct,inspections.edit,inspections.approve,inspections.close,inspections.export,'
    'reports.view,reports.export,'
    'documents.view,documents.download,'
    'sop.view,'
    'notifications.view'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Role 7: EMPLOYEE — Standard employee. Reports hazards, views own records.
-- ─────────────────────────────────────────────────────────────────────────────
CALL grant_permissions(7,
    'dashboard.view,'
    'hazards.view,hazards.create,hazards.upload_attachment,'
    'near_misses.view,near_misses.create,'
    'incidents.view,incidents.upload_attachment,'
    'corrective_actions.view,'
    'training.view,'
    'training_attendance.view,'
    'reports.view,'
    'documents.view,documents.download,'
    'sop.view,'
    'notifications.view'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Role 8: CONTRACTOR — Extremely limited. Report hazards only.
-- ─────────────────────────────────────────────────────────────────────────────
CALL grant_permissions(8,
    'hazards.create,hazards.upload_attachment,'
    'near_misses.create,'
    'notifications.view,'
    'sop.view,'
    'documents.view,documents.download'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Role 9: VIEWER — Read-only everywhere. No write access at all.
-- ─────────────────────────────────────────────────────────────────────────────
CALL grant_permissions(9,
    'dashboard.view,dashboard.export,'
    'plants.view,'
    'departments.view,'
    'locations.view,'
    'employees.view,'
    'contractors.view,'
    'hazards.view,hazards.export,'
    'near_misses.view,near_misses.export,'
    'incidents.view,incidents.export,'
    'investigations.view,'
    'rca.view,'
    'corrective_actions.view,corrective_actions.export,'
    'training.view,training.export,'
    'training_attendance.view,'
    'manhours.view,'
    'audits.view,audits.export,'
    'inspections.view,inspections.export,'
    'reports.view,reports.export,'
    'analytics.view,'
    'documents.view,documents.download,'
    'sop.view,'
    'notifications.view'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Role 10: SYSTEM_INTEGRATION — API service account. Full read + write HSE.
-- ─────────────────────────────────────────────────────────────────────────────
CALL grant_permissions(10,
    'dashboard.view,dashboard.view_all_plants,'
    'plants.view,'
    'departments.view,'
    'locations.view,'
    'employees.view,employees.view_all,'
    'contractors.view,'
    'hazards.view,hazards.view_all,hazards.create,hazards.edit,hazards.export,'
    'near_misses.view,near_misses.view_all,near_misses.create,near_misses.export,'
    'incidents.view,incidents.view_all,incidents.create,incidents.export,'
    'corrective_actions.view,corrective_actions.view_all,corrective_actions.export,'
    'training.view,training.view_all,training.export,'
    'training_attendance.view,'
    'manhours.view,'
    'audits.view,audits.view_all,audits.export,'
    'inspections.view,inspections.view_all,inspections.export,'
    'reports.view,reports.view_all,reports.export,'
    'analytics.view,analytics.view_all,'
    'notifications.send,'
    'system.manage_integrations'
);

-- Clean up helper procedures (optional — comment out if you want to keep them)
-- DROP PROCEDURE IF EXISTS grant_all_permissions;
-- DROP PROCEDURE IF EXISTS grant_permissions;


-- =============================================================================
-- Verification
-- =============================================================================

-- Count of permissions per role
SELECT
    r.role_code,
    r.role_name,
    COUNT(rp.permission_id) AS total_permissions
FROM roles r
LEFT JOIN role_permissions rp ON r.role_id = rp.role_id
GROUP BY r.role_id, r.role_code, r.role_name
ORDER BY r.hierarchy_level;

-- Full permission matrix for a specific role (example: HSE_ADMIN)
SELECT
    r.role_code,
    p.module,
    p.permission_code,
    p.permission_name
FROM role_permissions rp
JOIN roles       r ON rp.role_id       = r.role_id
JOIN permissions p ON rp.permission_id = p.permission_id
WHERE r.role_code = 'HSE_ADMIN'
ORDER BY p.module, p.action;
