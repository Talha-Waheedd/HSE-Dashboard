'use strict';

const PERMISSIONS = Object.freeze({
  // ─── Existing Permissions ─────────────────────────────────────────────────
  USER_VIEW: 'user:view',
  USER_CREATE: 'user:create',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  USER_MANAGE: 'user:manage',

  ROLE_VIEW: 'role:view',
  ROLE_CREATE: 'role:create',
  ROLE_UPDATE: 'role:update',
  ROLE_DELETE: 'role:delete',
  ROLE_MANAGE: 'role:manage',

  NOTIFICATION_VIEW: 'notification:view',
  NOTIFICATION_MANAGE: 'notification:manage',

  AUDIT_VIEW: 'audit:view',
  SETTINGS_MANAGE: 'settings:manage',

  // ─── HSE: Plants ─────────────────────────────────────────────────────────
  PLANT_VIEW: 'plant:view',
  PLANT_CREATE: 'plant:create',
  PLANT_UPDATE: 'plant:update',
  PLANT_DELETE: 'plant:delete',

  // ─── HSE: Departments ─────────────────────────────────────────────────────
  DEPARTMENT_VIEW: 'department:view',
  DEPARTMENT_CREATE: 'department:create',
  DEPARTMENT_UPDATE: 'department:update',
  DEPARTMENT_DELETE: 'department:delete',

  // ─── HSE: Employees ───────────────────────────────────────────────────────
  EMPLOYEE_VIEW: 'employee:view',
  EMPLOYEE_CREATE: 'employee:create',
  EMPLOYEE_UPDATE: 'employee:update',
  EMPLOYEE_DELETE: 'employee:delete',

  // ─── HSE: Hazards ─────────────────────────────────────────────────────────
  HAZARD_VIEW: 'hazard:view',
  HAZARD_CREATE: 'hazard:create',
  HAZARD_UPDATE: 'hazard:update',
  HAZARD_DELETE: 'hazard:delete',
  HAZARD_MANAGE: 'hazard:manage',

  // ─── HSE: Near Miss ───────────────────────────────────────────────────────
  NEAR_MISS_VIEW: 'near_miss:view',
  NEAR_MISS_CREATE: 'near_miss:create',
  NEAR_MISS_UPDATE: 'near_miss:update',
  NEAR_MISS_DELETE: 'near_miss:delete',
  NEAR_MISS_MANAGE: 'near_miss:manage',

  // ─── HSE: Incidents ───────────────────────────────────────────────────────
  INCIDENT_VIEW: 'incident:view',
  INCIDENT_CREATE: 'incident:create',
  INCIDENT_UPDATE: 'incident:update',
  INCIDENT_DELETE: 'incident:delete',
  INCIDENT_MANAGE: 'incident:manage',
  INCIDENT_INVESTIGATE: 'incident:investigate',

  // ─── HSE: Training ────────────────────────────────────────────────────────
  TRAINING_VIEW: 'training:view',
  TRAINING_CREATE: 'training:create',
  TRAINING_UPDATE: 'training:update',
  TRAINING_DELETE: 'training:delete',
  TRAINING_MANAGE: 'training:manage',

  // ─── HSE: Audits ──────────────────────────────────────────────────────────
  HSE_AUDIT_VIEW: 'hse_audit:view',
  HSE_AUDIT_CREATE: 'hse_audit:create',
  HSE_AUDIT_UPDATE: 'hse_audit:update',
  HSE_AUDIT_DELETE: 'hse_audit:delete',
  HSE_AUDIT_MANAGE: 'hse_audit:manage',

  // ─── HSE: Inspections ─────────────────────────────────────────────────────
  INSPECTION_VIEW: 'inspection:view',
  INSPECTION_CREATE: 'inspection:create',
  INSPECTION_UPDATE: 'inspection:update',
  INSPECTION_DELETE: 'inspection:delete',
  INSPECTION_MANAGE: 'inspection:manage',

  // ─── HSE: Corrective Actions ──────────────────────────────────────────────
  CORRECTIVE_ACTION_VIEW: 'corrective_action:view',
  CORRECTIVE_ACTION_CREATE: 'corrective_action:create',
  CORRECTIVE_ACTION_UPDATE: 'corrective_action:update',
  CORRECTIVE_ACTION_DELETE: 'corrective_action:delete',
  CORRECTIVE_ACTION_VERIFY: 'corrective_action:verify',

  // ─── HSE: Attachments ─────────────────────────────────────────────────────
  ATTACHMENT_VIEW: 'attachment:view',
  ATTACHMENT_CREATE: 'attachment:create',
  ATTACHMENT_DELETE: 'attachment:delete',

  // ─── HSE: Dashboard & Reports ─────────────────────────────────────────────
  DASHBOARD_VIEW: 'dashboard:view',
  REPORT_VIEW: 'report:view',
  REPORT_EXPORT: 'report:export',

  // ─── Newly Discovered Route Dependencies ──────────────────────────────────
  HSE_MANAGE_PLANTS: 'hse:manage_plants',
  HSE_VIEW_DASHBOARD: 'hse:view_dashboard',
  HSE_MANAGE_INCIDENTS: 'hse:manage_incidents',
  HSE_VIEW_REPORTS: 'hse:view_reports',
  USER_READ: 'user:read',
  HSE_REPORT_HAZARD: 'hse:report_hazard',
  HSE_MANAGE_AUDITS: 'hse:manage_audits',
  HSE_REPORT_INCIDENT: 'hse:report_incident',
  HSE_MANAGE_INSPECTIONS: 'hse:manage_inspections',
});

module.exports = { PERMISSIONS };
