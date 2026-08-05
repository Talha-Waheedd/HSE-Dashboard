-- =============================================================================
-- 07_permissions.sql
-- CBL HSE Management System — Phase 2: Authentication & RBAC
-- Table: permissions
--
-- Description:
--   Master list of every permission in the HSE system, grouped by module.
--   Each permission is an atomic capability (e.g., hazard.create).
--   Permissions follow the pattern:  <module>.<action>
--   Permissions are assigned to Roles (not directly to users) following
--   the RBAC principle used in SAP, Oracle, and Enablon.
--
--   Total Permissions Seeded: 120+
--
-- Modules covered:
--   dashboard, plants, departments, locations, employees, contractors,
--   users, roles, hazards, near_misses, incidents, investigations, rca,
--   corrective_actions, training, training_attendance, tna, manhours,
--   audits, inspections, audit_findings, inspection_findings,
--   reports, analytics, documents, sop, notifications, settings, system
--
-- Depends on: 06_roles.sql
-- Run: SOURCE database/schema/07_permissions.sql;
-- =============================================================================

USE cbl_hse;

-- -----------------------------------------------------------------------------
-- Table Definition
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS permissions (

    -- ── Identity ──────────────────────────────────────────────────────────────
    permission_id       BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT          COMMENT 'Surrogate primary key.',
    permission_code     VARCHAR(100)        NOT NULL                         COMMENT 'Unique dot-notation permission key. Format: <module>.<action>. e.g. hazard.create',
    permission_name     VARCHAR(150)        NOT NULL                         COMMENT 'Human-readable permission label. e.g. Create Hazard Report',
    description         VARCHAR(500)        NULL                             COMMENT 'Detailed description of what this permission allows.',

    -- ── Grouping ──────────────────────────────────────────────────────────────
    module              VARCHAR(60)         NOT NULL                         COMMENT 'Module this permission belongs to. Matches the prefix of permission_code. e.g. hazard, training, audit',
    action              VARCHAR(60)         NOT NULL                         COMMENT 'Action type within the module. e.g. create, edit, delete, view, approve, export, close',

    -- ── Flags ─────────────────────────────────────────────────────────────────
    is_active           BOOLEAN             NOT NULL DEFAULT TRUE            COMMENT 'FALSE = permission is disabled globally and ignored in access checks.',
    is_system           BOOLEAN             NOT NULL DEFAULT TRUE            COMMENT 'TRUE = built-in system permission. Cannot be deleted via UI.',

    -- ── Audit Fields ──────────────────────────────────────────────────────────
    created_at          DATETIME(3)         NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at          DATETIME(3)         NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    deleted_at          DATETIME(3)         NULL                             COMMENT 'Soft-delete. NULL = active.',

    -- ── Constraints ───────────────────────────────────────────────────────────
    PRIMARY KEY (permission_id),
    UNIQUE KEY uq_permissions_code  (permission_code)   COMMENT 'Permission codes are globally unique identifiers.',

    -- ── Indexes ───────────────────────────────────────────────────────────────
    INDEX idx_permissions_module        (module)        COMMENT 'Group/filter permissions by module.',
    INDEX idx_permissions_is_active     (is_active),
    INDEX idx_permissions_deleted_at    (deleted_at)

) ENGINE=InnoDB
  AUTO_INCREMENT=1
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Master permission registry. Every atomic capability in the system is registered here.';


-- =============================================================================
-- Seed Data — Full Enterprise Permission List (120+ permissions)
-- =============================================================================

INSERT INTO permissions (permission_code, permission_name, description, module, action) VALUES

-- ─────────────────────────────────────────────────────────────────────────────
-- MODULE: dashboard
-- ─────────────────────────────────────────────────────────────────────────────
('dashboard.view',                  'View Dashboard',                       'Access the main HSE KPI dashboard.',                                               'dashboard',            'view'),
('dashboard.view_all_plants',       'View All Plants Dashboard',            'View dashboard data across all plants (not scoped to one department/plant).',      'dashboard',            'view_all_plants'),
('dashboard.export',                'Export Dashboard',                     'Export dashboard KPIs and charts to PDF or Excel.',                                 'dashboard',            'export'),
('dashboard.configure',             'Configure Dashboard',                  'Add, remove, and rearrange KPI widgets on the dashboard.',                         'dashboard',            'configure'),

-- ─────────────────────────────────────────────────────────────────────────────
-- MODULE: plants
-- ─────────────────────────────────────────────────────────────────────────────
('plants.view',                     'View Plants',                          'View list of all registered plants.',                                               'plants',               'view'),
('plants.create',                   'Create Plant',                         'Register a new plant in the system.',                                               'plants',               'create'),
('plants.edit',                     'Edit Plant',                           'Modify plant details such as name, location, and contact information.',             'plants',               'edit'),
('plants.delete',                   'Delete Plant',                         'Soft-delete a plant from the system.',                                              'plants',               'delete'),

-- ─────────────────────────────────────────────────────────────────────────────
-- MODULE: departments
-- ─────────────────────────────────────────────────────────────────────────────
('departments.view',                'View Departments',                     'View all departments within assigned plant.',                                        'departments',          'view'),
('departments.create',              'Create Department',                    'Add a new department.',                                                              'departments',          'create'),
('departments.edit',                'Edit Department',                      'Modify department name, head, and contact info.',                                    'departments',          'edit'),
('departments.delete',              'Delete Department',                    'Soft-delete a department.',                                                          'departments',          'delete'),

-- ─────────────────────────────────────────────────────────────────────────────
-- MODULE: locations
-- ─────────────────────────────────────────────────────────────────────────────
('locations.view',                  'View Locations',                       'View physical locations within the plant.',                                          'locations',            'view'),
('locations.create',                'Create Location',                      'Register a new location within the plant.',                                          'locations',            'create'),
('locations.edit',                  'Edit Location',                        'Modify location name, code, and department assignment.',                              'locations',            'edit'),
('locations.delete',                'Delete Location',                      'Soft-delete a location.',                                                            'locations',            'delete'),

-- ─────────────────────────────────────────────────────────────────────────────
-- MODULE: employees
-- ─────────────────────────────────────────────────────────────────────────────
('employees.view',                  'View Employees',                       'View employee list and profiles.',                                                   'employees',            'view'),
('employees.view_all',              'View All Employees',                   'View employees across all departments (not scoped to own department).',              'employees',            'view_all'),
('employees.create',                'Create Employee',                      'Register a new employee in the system.',                                             'employees',            'create'),
('employees.edit',                  'Edit Employee',                        'Modify employee profile details.',                                                   'employees',            'edit'),
('employees.delete',                'Delete Employee',                      'Soft-delete an employee record.',                                                    'employees',            'delete'),
('employees.export',                'Export Employees',                     'Export employee list to Excel or PDF.',                                              'employees',            'export'),

-- ─────────────────────────────────────────────────────────────────────────────
-- MODULE: contractors
-- ─────────────────────────────────────────────────────────────────────────────
('contractors.view',                'View Contractors',                     'View registered contractors.',                                                       'contractors',          'view'),
('contractors.create',              'Create Contractor',                    'Register a new contractor company.',                                                 'contractors',          'create'),
('contractors.edit',                'Edit Contractor',                      'Modify contractor details.',                                                         'contractors',          'edit'),
('contractors.delete',              'Delete Contractor',                    'Soft-delete a contractor record.',                                                   'contractors',          'delete'),
('contractors.blacklist',           'Blacklist Contractor',                 'Mark a contractor as blacklisted, revoking site access.',                            'contractors',          'blacklist'),

-- ─────────────────────────────────────────────────────────────────────────────
-- MODULE: users
-- ─────────────────────────────────────────────────────────────────────────────
('users.view',                      'View Users',                           'View list of system users.',                                                         'users',                'view'),
('users.create',                    'Create User',                          'Create a new system user account.',                                                  'users',                'create'),
('users.edit',                      'Edit User',                            'Modify user profile, email, and status.',                                            'users',                'edit'),
('users.delete',                    'Delete User',                          'Soft-delete a user account.',                                                        'users',                'delete'),
('users.lock',                      'Lock/Unlock User',                     'Lock or unlock a user account manually.',                                            'users',                'lock'),
('users.reset_password',            'Reset User Password',                  'Force reset the password of another user.',                                          'users',                'reset_password'),
('users.assign_role',               'Assign Role to User',                  'Assign or remove roles from a user account.',                                        'users',                'assign_role'),
('users.view_audit_trail',          'View User Audit Trail',                'View login history and action audit trail for a user.',                              'users',                'view_audit_trail'),

-- ─────────────────────────────────────────────────────────────────────────────
-- MODULE: roles
-- ─────────────────────────────────────────────────────────────────────────────
('roles.view',                      'View Roles',                           'View all defined roles and their permissions.',                                       'roles',                'view'),
('roles.create',                    'Create Role',                          'Create a new custom role.',                                                           'roles',                'create'),
('roles.edit',                      'Edit Role',                            'Modify role name, description, and hierarchy level.',                                 'roles',                'edit'),
('roles.delete',                    'Delete Role',                          'Delete a non-system role.',                                                           'roles',                'delete'),
('roles.assign_permission',         'Assign Permission to Role',            'Grant or revoke permissions on a role.',                                              'roles',                'assign_permission'),

-- ─────────────────────────────────────────────────────────────────────────────
-- MODULE: hazards
-- ─────────────────────────────────────────────────────────────────────────────
('hazards.view',                    'View Hazards',                         'View hazard reports within assigned department.',                                     'hazards',              'view'),
('hazards.view_all',                'View All Hazards',                     'View hazard reports across all departments and plants.',                              'hazards',              'view_all'),
('hazards.create',                  'Report Hazard',                        'Submit a new hazard report.',                                                         'hazards',              'create'),
('hazards.edit',                    'Edit Hazard',                          'Modify an existing hazard report.',                                                   'hazards',              'edit'),
('hazards.delete',                  'Delete Hazard',                        'Soft-delete a hazard report.',                                                        'hazards',              'delete'),
('hazards.review',                  'Review Hazard',                        'Review and assess a reported hazard. Change risk rating and status.',                 'hazards',              'review'),
('hazards.assign',                  'Assign Hazard',                        'Assign a hazard to a responsible person for corrective action.',                     'hazards',              'assign'),
('hazards.close',                   'Close Hazard',                         'Mark a hazard as resolved and close the record.',                                    'hazards',              'close'),
('hazards.export',                  'Export Hazards',                       'Export hazard reports to Excel or PDF.',                                              'hazards',              'export'),
('hazards.upload_attachment',       'Upload Hazard Attachment',             'Attach photos or documents to a hazard report.',                                      'hazards',              'upload_attachment'),

-- ─────────────────────────────────────────────────────────────────────────────
-- MODULE: near_misses
-- ─────────────────────────────────────────────────────────────────────────────
('near_misses.view',                'View Near Misses',                     'View near miss reports.',                                                             'near_misses',          'view'),
('near_misses.view_all',            'View All Near Misses',                 'View near miss reports across all departments.',                                      'near_misses',          'view_all'),
('near_misses.create',              'Report Near Miss',                     'Submit a new near miss report.',                                                      'near_misses',          'create'),
('near_misses.edit',                'Edit Near Miss',                       'Modify a near miss report.',                                                          'near_misses',          'edit'),
('near_misses.delete',              'Delete Near Miss',                     'Soft-delete a near miss report.',                                                     'near_misses',          'delete'),
('near_misses.review',              'Review Near Miss',                     'Review and assess a near miss. Escalate to incident if required.',                   'near_misses',          'review'),
('near_misses.close',               'Close Near Miss',                      'Close a near miss after corrective action.',                                          'near_misses',          'close'),
('near_misses.export',              'Export Near Misses',                   'Export near miss data to Excel or PDF.',                                              'near_misses',          'export'),

-- ─────────────────────────────────────────────────────────────────────────────
-- MODULE: incidents
-- ─────────────────────────────────────────────────────────────────────────────
('incidents.view',                  'View Incidents',                       'View incident logs.',                                                                 'incidents',            'view'),
('incidents.view_all',              'View All Incidents',                   'View incidents across all departments and plants.',                                   'incidents',            'view_all'),
('incidents.create',                'Report Incident',                      'Submit a new incident report.',                                                       'incidents',            'create'),
('incidents.edit',                  'Edit Incident',                        'Modify an incident report.',                                                          'incidents',            'edit'),
('incidents.delete',                'Delete Incident',                      'Soft-delete an incident record.',                                                     'incidents',            'delete'),
('incidents.investigate',           'Investigate Incident',                 'Conduct and document an incident investigation.',                                     'incidents',            'investigate'),
('incidents.approve',               'Approve Incident',                     'Approve the investigation findings and corrective actions for an incident.',          'incidents',            'approve'),
('incidents.close',                 'Close Incident',                       'Close the incident after all corrective actions are completed.',                      'incidents',            'close'),
('incidents.export',                'Export Incidents',                     'Export incident data to Excel or PDF.',                                               'incidents',            'export'),
('incidents.upload_attachment',     'Upload Incident Attachment',           'Attach evidence files to an incident report.',                                        'incidents',            'upload_attachment'),

-- ─────────────────────────────────────────────────────────────────────────────
-- MODULE: investigations
-- ─────────────────────────────────────────────────────────────────────────────
('investigations.view',             'View Investigations',                  'View investigation records.',                                                         'investigations',       'view'),
('investigations.create',           'Create Investigation',                 'Start a formal investigation linked to an incident.',                                 'investigations',       'create'),
('investigations.edit',             'Edit Investigation',                   'Update investigation details and findings.',                                           'investigations',       'edit'),
('investigations.approve',          'Approve Investigation',                'Approve completed investigation report.',                                             'investigations',       'approve'),

-- ─────────────────────────────────────────────────────────────────────────────
-- MODULE: rca (Root Cause Analysis)
-- ─────────────────────────────────────────────────────────────────────────────
('rca.view',                        'View RCA',                             'View root cause analysis records.',                                                   'rca',                  'view'),
('rca.create',                      'Create RCA',                           'Create a root cause analysis for an incident.',                                       'rca',                  'create'),
('rca.edit',                        'Edit RCA',                             'Update an existing root cause analysis.',                                             'rca',                  'edit'),
('rca.approve',                     'Approve RCA',                          'Approve and finalize the root cause analysis.',                                       'rca',                  'approve'),

-- ─────────────────────────────────────────────────────────────────────────────
-- MODULE: corrective_actions (CAPA)
-- ─────────────────────────────────────────────────────────────────────────────
('corrective_actions.view',         'View Corrective Actions',              'View CAPA records assigned to own department.',                                       'corrective_actions',   'view'),
('corrective_actions.view_all',     'View All Corrective Actions',          'View CAPA records across all departments.',                                           'corrective_actions',   'view_all'),
('corrective_actions.create',       'Create Corrective Action',             'Create a new corrective or preventive action.',                                       'corrective_actions',   'create'),
('corrective_actions.edit',         'Edit Corrective Action',               'Update corrective action details and progress.',                                      'corrective_actions',   'edit'),
('corrective_actions.delete',       'Delete Corrective Action',             'Soft-delete a corrective action record.',                                             'corrective_actions',   'delete'),
('corrective_actions.verify',       'Verify Corrective Action',             'Verify that a corrective action has been effectively implemented.',                   'corrective_actions',   'verify'),
('corrective_actions.close',        'Close Corrective Action',              'Close a verified corrective action.',                                                 'corrective_actions',   'close'),
('corrective_actions.export',       'Export Corrective Actions',            'Export CAPA register to Excel or PDF.',                                               'corrective_actions',   'export'),

-- ─────────────────────────────────────────────────────────────────────────────
-- MODULE: training
-- ─────────────────────────────────────────────────────────────────────────────
('training.view',                   'View Training Sessions',               'View training sessions for own department.',                                          'training',             'view'),
('training.view_all',               'View All Training Sessions',           'View training sessions across all departments.',                                      'training',             'view_all'),
('training.create',                 'Create Training Session',              'Schedule a new training session.',                                                    'training',             'create'),
('training.edit',                   'Edit Training Session',                'Modify training session details.',                                                    'training',             'edit'),
('training.delete',                 'Delete Training Session',              'Soft-delete a training session.',                                                     'training',             'delete'),
('training.approve',                'Approve Training',                     'Approve a completed training session and records.',                                   'training',             'approve'),
('training.export',                 'Export Training Records',              'Export training records to Excel or PDF.',                                            'training',             'export'),
('training.upload_material',        'Upload Training Material',             'Upload training content, presentations, or handouts.',                                'training',             'upload_material'),

-- ─────────────────────────────────────────────────────────────────────────────
-- MODULE: training_attendance
-- ─────────────────────────────────────────────────────────────────────────────
('training_attendance.view',        'View Training Attendance',             'View attendance records for training sessions.',                                      'training_attendance',  'view'),
('training_attendance.mark',        'Mark Training Attendance',             'Mark employee attendance for a training session.',                                    'training_attendance',  'mark'),
('training_attendance.edit',        'Edit Training Attendance',             'Correct a previously marked attendance record.',                                      'training_attendance',  'edit'),
('training_attendance.export',      'Export Training Attendance',           'Export attendance sheets to Excel or PDF.',                                           'training_attendance',  'export'),

-- ─────────────────────────────────────────────────────────────────────────────
-- MODULE: tna (Training Need Assessment)
-- ─────────────────────────────────────────────────────────────────────────────
('tna.view',                        'View TNA',                             'View Training Need Assessments.',                                                     'tna',                  'view'),
('tna.create',                      'Create TNA',                           'Create a new Training Need Assessment for a department.',                             'tna',                  'create'),
('tna.edit',                        'Edit TNA',                             'Update a Training Need Assessment.',                                                  'tna',                  'edit'),
('tna.approve',                     'Approve TNA',                          'Approve a Training Need Assessment.',                                                 'tna',                  'approve'),
('tna.export',                      'Export TNA',                           'Export TNA report to Excel or PDF.',                                                  'tna',                  'export'),

-- ─────────────────────────────────────────────────────────────────────────────
-- MODULE: manhours
-- ─────────────────────────────────────────────────────────────────────────────
('manhours.view',                   'View Manhours',                        'View manhour records and training hour logs.',                                        'manhours',             'view'),
('manhours.create',                 'Log Manhours',                         'Manually log man-hours for training or safety activities.',                           'manhours',             'create'),
('manhours.edit',                   'Edit Manhours',                        'Correct a manhour log entry.',                                                        'manhours',             'edit'),
('manhours.export',                 'Export Manhours',                      'Export manhour summary report.',                                                      'manhours',             'export'),

-- ─────────────────────────────────────────────────────────────────────────────
-- MODULE: audits
-- ─────────────────────────────────────────────────────────────────────────────
('audits.view',                     'View Audits',                          'View HSE audit records.',                                                             'audits',               'view'),
('audits.view_all',                 'View All Audits',                      'View audits across all departments and plants.',                                      'audits',               'view_all'),
('audits.create',                   'Create Audit',                         'Schedule and create a new HSE audit.',                                                'audits',               'create'),
('audits.edit',                     'Edit Audit',                           'Modify audit details and scope.',                                                     'audits',               'edit'),
('audits.delete',                   'Delete Audit',                         'Soft-delete an audit record.',                                                        'audits',               'delete'),
('audits.conduct',                  'Conduct Audit',                        'Execute an audit — record findings and observations.',                                'audits',               'conduct'),
('audits.approve',                  'Approve Audit',                        'Approve a completed audit report.',                                                   'audits',               'approve'),
('audits.close',                    'Close Audit',                          'Close an audit after all findings are actioned.',                                     'audits',               'close'),
('audits.export',                   'Export Audit Report',                  'Export audit report to PDF or Excel.',                                                'audits',               'export'),

-- ─────────────────────────────────────────────────────────────────────────────
-- MODULE: audit_findings
-- ─────────────────────────────────────────────────────────────────────────────
('audit_findings.view',             'View Audit Findings',                  'View findings linked to an audit.',                                                   'audit_findings',       'view'),
('audit_findings.create',           'Create Audit Finding',                 'Record a new finding during an audit.',                                               'audit_findings',       'create'),
('audit_findings.edit',             'Edit Audit Finding',                   'Update an audit finding.',                                                            'audit_findings',       'edit'),
('audit_findings.close',            'Close Audit Finding',                  'Mark a finding as resolved.',                                                         'audit_findings',       'close'),

-- ─────────────────────────────────────────────────────────────────────────────
-- MODULE: inspections
-- ─────────────────────────────────────────────────────────────────────────────
('inspections.view',                'View Inspections',                     'View scheduled and completed inspections.',                                           'inspections',          'view'),
('inspections.view_all',            'View All Inspections',                 'View inspections across all departments and plants.',                                 'inspections',          'view_all'),
('inspections.schedule',            'Schedule Inspection',                  'Plan and schedule a new inspection.',                                                 'inspections',          'schedule'),
('inspections.conduct',             'Conduct Inspection',                   'Execute and record inspection findings on-site.',                                     'inspections',          'conduct'),
('inspections.edit',                'Edit Inspection',                      'Modify an inspection record.',                                                        'inspections',          'edit'),
('inspections.delete',              'Delete Inspection',                    'Soft-delete an inspection record.',                                                   'inspections',          'delete'),
('inspections.approve',             'Approve Inspection',                   'Approve and sign off on an inspection report.',                                       'inspections',          'approve'),
('inspections.close',               'Close Inspection',                     'Close an inspection after all items are resolved.',                                   'inspections',          'close'),
('inspections.export',              'Export Inspection Report',             'Export inspection report to PDF or Excel.',                                           'inspections',          'export'),

-- ─────────────────────────────────────────────────────────────────────────────
-- MODULE: reports
-- ─────────────────────────────────────────────────────────────────────────────
('reports.view',                    'View Reports',                         'View standard HSE performance reports.',                                              'reports',              'view'),
('reports.view_all',                'View All Reports',                     'View reports across all plants and departments.',                                     'reports',              'view_all'),
('reports.export',                  'Export Reports',                       'Export generated reports to PDF or Excel.',                                           'reports',              'export'),
('reports.schedule',                'Schedule Report',                      'Schedule automatic report generation and email delivery.',                            'reports',              'schedule'),

-- ─────────────────────────────────────────────────────────────────────────────
-- MODULE: analytics
-- ─────────────────────────────────────────────────────────────────────────────
('analytics.view',                  'View Analytics',                       'Access advanced analytics and trend charts.',                                         'analytics',            'view'),
('analytics.view_all',              'View All Analytics',                   'View analytics data across all plants.',                                              'analytics',            'view_all'),
('analytics.export',                'Export Analytics',                     'Export analytics data and charts.',                                                   'analytics',            'export'),

-- ─────────────────────────────────────────────────────────────────────────────
-- MODULE: documents
-- ─────────────────────────────────────────────────────────────────────────────
('documents.view',                  'View Documents',                       'View documents in the document management library.',                                  'documents',            'view'),
('documents.upload',                'Upload Document',                      'Upload a new document to the library.',                                               'documents',            'upload'),
('documents.edit',                  'Edit Document',                        'Update document metadata and version.',                                               'documents',            'edit'),
('documents.delete',                'Delete Document',                      'Soft-delete a document from the library.',                                            'documents',            'delete'),
('documents.download',              'Download Document',                    'Download a document from the library.',                                               'documents',            'download'),
('documents.approve',               'Approve Document',                     'Approve and publish a document for distribution.',                                    'documents',            'approve'),

-- ─────────────────────────────────────────────────────────────────────────────
-- MODULE: sop (Standard Operating Procedures)
-- ─────────────────────────────────────────────────────────────────────────────
('sop.view',                        'View SOPs',                            'View Standard Operating Procedures.',                                                 'sop',                  'view'),
('sop.create',                      'Create SOP',                           'Draft a new Standard Operating Procedure.',                                           'sop',                  'create'),
('sop.edit',                        'Edit SOP',                             'Modify a draft SOP.',                                                                 'sop',                  'edit'),
('sop.delete',                      'Delete SOP',                           'Soft-delete an SOP.',                                                                 'sop',                  'delete'),
('sop.approve',                     'Approve SOP',                          'Review and approve an SOP for publication.',                                          'sop',                  'approve'),
('sop.publish',                     'Publish SOP',                          'Publish an approved SOP and distribute to circulation list.',                         'sop',                  'publish'),
('sop.archive',                     'Archive SOP',                          'Archive an obsolete SOP version.',                                                    'sop',                  'archive'),

-- ─────────────────────────────────────────────────────────────────────────────
-- MODULE: notifications
-- ─────────────────────────────────────────────────────────────────────────────
('notifications.view',              'View Notifications',                   'View own system notifications and alerts.',                                           'notifications',        'view'),
('notifications.send',              'Send Notification',                    'Manually send a notification or alert to a user or group.',                           'notifications',        'send'),
('notifications.manage',            'Manage Notification Rules',            'Configure automated notification triggers and templates.',                            'notifications',        'manage'),

-- ─────────────────────────────────────────────────────────────────────────────
-- MODULE: settings
-- ─────────────────────────────────────────────────────────────────────────────
('settings.view',                   'View Settings',                        'View application configuration settings.',                                            'settings',             'view'),
('settings.manage',                 'Manage Settings',                      'Modify application settings including email, thresholds, and categories.',            'settings',             'manage'),
('settings.manage_lookups',         'Manage Lookup Values',                 'Manage dropdown lookup values such as risk ratings, categories, and statuses.',       'settings',             'manage_lookups'),

-- ─────────────────────────────────────────────────────────────────────────────
-- MODULE: system
-- ─────────────────────────────────────────────────────────────────────────────
('system.view_audit_logs',          'View System Audit Logs',               'View full system-level audit logs of all user actions.',                              'system',               'view_audit_logs'),
('system.manage_integrations',      'Manage System Integrations',           'Configure ERP, BI, and third-party API integrations.',                                'system',               'manage_integrations'),
('system.backup',                   'Manage System Backup',                 'Trigger and manage database backups.',                                                'system',               'backup'),
('system.impersonate',              'Impersonate User',                     'Log in as another user for support and troubleshooting. Highly restricted.',          'system',               'impersonate'),
('system.migrate',                  'Run Database Migrations',              'Execute schema migrations. Reserved for deployment pipelines.',                       'system',               'migrate')

ON DUPLICATE KEY UPDATE
    permission_name = VALUES(permission_name),
    description     = VALUES(description),
    is_active       = VALUES(is_active),
    updated_at      = CURRENT_TIMESTAMP(3);


-- =============================================================================
-- Verification
-- =============================================================================

SELECT
    module,
    COUNT(*) AS permission_count
FROM permissions
GROUP BY module
ORDER BY module;

SELECT
    permission_id,
    permission_code,
    permission_name,
    module,
    action
FROM permissions
ORDER BY module, action;
