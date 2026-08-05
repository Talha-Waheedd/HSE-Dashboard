'use strict';

const MESSAGES = Object.freeze({
  // ─── Auth ──────────────────────────────────────────────────────────────────
  LOGIN_SUCCESS: 'Logged in successfully',
  LOGOUT_SUCCESS: 'Logged out successfully',
  REGISTER_SUCCESS: 'Registration successful. Please verify your email.',
  TOKEN_REFRESHED: 'Token refreshed successfully',
  EMAIL_VERIFIED: 'Email verified successfully',
  EMAIL_ALREADY_VERIFIED: 'Email is already verified',
  PASSWORD_RESET_EMAIL_SENT: 'Password reset link sent to your email',
  PASSWORD_RESET_SUCCESS: 'Password reset successfully',
  INVALID_CREDENTIALS: 'Invalid email or password',
  ACCOUNT_NOT_VERIFIED: 'Please verify your email before logging in',
  ACCOUNT_SUSPENDED: 'Your account has been suspended. Contact support.',
  TOKEN_INVALID: 'Invalid or expired token',
  TOKEN_MISSING: 'Authentication token is required',
  REFRESH_TOKEN_INVALID: 'Invalid or expired refresh token',
  UNAUTHORIZED: 'You are not authorized to access this resource',
  FORBIDDEN: 'Access denied — insufficient permissions',

  // ─── Users ─────────────────────────────────────────────────────────────────
  USER_FETCHED: 'User retrieved successfully',
  USERS_FETCHED: 'Users retrieved successfully',
  USER_CREATED: 'User created successfully',
  USER_UPDATED: 'User updated successfully',
  USER_DELETED: 'User deleted successfully',
  USER_NOT_FOUND: 'User not found',
  EMAIL_TAKEN: 'Email address is already in use',

  // ─── Roles ─────────────────────────────────────────────────────────────────
  ROLE_FETCHED: 'Role retrieved successfully',
  ROLES_FETCHED: 'Roles retrieved successfully',
  ROLE_CREATED: 'Role created successfully',
  ROLE_UPDATED: 'Role updated successfully',
  ROLE_DELETED: 'Role deleted successfully',
  ROLE_NOT_FOUND: 'Role not found',

  // ─── Files ─────────────────────────────────────────────────────────────────
  FILE_UPLOADED: 'File uploaded successfully',
  FILE_NOT_FOUND: 'File not found',
  INVALID_FILE_TYPE: 'Invalid file type',
  FILE_TOO_LARGE: 'File size exceeds the allowed limit',

  // ─── Notifications ─────────────────────────────────────────────────────────
  NOTIFICATIONS_FETCHED: 'Notifications retrieved successfully',
  NOTIFICATION_MARKED_READ: 'Notification marked as read',
  ALL_NOTIFICATIONS_READ: 'All notifications marked as read',

  // ─── General ───────────────────────────────────────────────────────────────
  VALIDATION_ERROR: 'Validation failed',
  INTERNAL_ERROR: 'An unexpected error occurred. Please try again later.',
  NOT_FOUND: 'Resource not found',
  CONFLICT: 'Resource already exists',
  RATE_LIMIT_EXCEEDED: 'Too many requests. Please slow down.',
  HEALTH_OK: 'Server is healthy',

  // ─── Plants ────────────────────────────────────────────────────────────────
  PLANT_FETCHED: 'Plant retrieved successfully',
  PLANTS_FETCHED: 'Plants retrieved successfully',
  PLANT_CREATED: 'Plant created successfully',
  PLANT_UPDATED: 'Plant updated successfully',
  PLANT_DELETED: 'Plant deleted successfully',
  PLANT_NOT_FOUND: 'Plant not found',
  PLANT_CODE_TAKEN: 'Plant code is already in use',

  // ─── Departments ───────────────────────────────────────────────────────────
  DEPARTMENT_FETCHED: 'Department retrieved successfully',
  DEPARTMENTS_FETCHED: 'Departments retrieved successfully',
  DEPARTMENT_CREATED: 'Department created successfully',
  DEPARTMENT_UPDATED: 'Department updated successfully',
  DEPARTMENT_DELETED: 'Department deleted successfully',
  DEPARTMENT_NOT_FOUND: 'Department not found',

  // ─── Employees ─────────────────────────────────────────────────────────────
  EMPLOYEE_FETCHED: 'Employee retrieved successfully',
  EMPLOYEES_FETCHED: 'Employees retrieved successfully',
  EMPLOYEE_CREATED: 'Employee profile created successfully',
  EMPLOYEE_UPDATED: 'Employee profile updated successfully',
  EMPLOYEE_DELETED: 'Employee profile deleted successfully',
  EMPLOYEE_NOT_FOUND: 'Employee not found',
  EMPLOYEE_ID_TAKEN: 'Employee ID is already in use',
  EMPLOYEE_ALREADY_EXISTS: 'An employee profile already exists for this user',

  // ─── Hazards ───────────────────────────────────────────────────────────────
  HAZARD_FETCHED: 'Hazard retrieved successfully',
  HAZARDS_FETCHED: 'Hazards retrieved successfully',
  HAZARD_CREATED: 'Hazard report submitted successfully',
  HAZARD_UPDATED: 'Hazard report updated successfully',
  HAZARD_DELETED: 'Hazard report deleted successfully',
  HAZARD_NOT_FOUND: 'Hazard report not found',
  HAZARD_STATUS_UPDATED: 'Hazard status updated successfully',
  HAZARD_INVALID_STATUS: 'Invalid status transition',

  // ─── Near Miss ─────────────────────────────────────────────────────────────
  NEAR_MISS_FETCHED: 'Near miss report retrieved successfully',
  NEAR_MISSES_FETCHED: 'Near miss reports retrieved successfully',
  NEAR_MISS_CREATED: 'Near miss report submitted successfully',
  NEAR_MISS_UPDATED: 'Near miss report updated successfully',
  NEAR_MISS_DELETED: 'Near miss report deleted successfully',
  NEAR_MISS_NOT_FOUND: 'Near miss report not found',
  NEAR_MISS_STATUS_UPDATED: 'Near miss status updated successfully',

  // ─── Incidents ─────────────────────────────────────────────────────────────
  INCIDENT_FETCHED: 'Incident retrieved successfully',
  INCIDENTS_FETCHED: 'Incidents retrieved successfully',
  INCIDENT_CREATED: 'Incident reported successfully',
  INCIDENT_UPDATED: 'Incident updated successfully',
  INCIDENT_DELETED: 'Incident deleted successfully',
  INCIDENT_NOT_FOUND: 'Incident not found',
  INCIDENT_STATUS_UPDATED: 'Incident status updated successfully',

  // ─── Training ──────────────────────────────────────────────────────────────
  TRAINING_FETCHED: 'Training session retrieved successfully',
  TRAININGS_FETCHED: 'Training sessions retrieved successfully',
  TRAINING_CREATED: 'Training session created successfully',
  TRAINING_UPDATED: 'Training session updated successfully',
  TRAINING_DELETED: 'Training session deleted successfully',
  TRAINING_NOT_FOUND: 'Training session not found',
  TRAINING_ATTENDEE_ADDED: 'Attendee added to training session',
  TRAINING_ATTENDANCE_MARKED: 'Attendance marked successfully',

  // ─── Audits ────────────────────────────────────────────────────────────────
  AUDIT_FETCHED: 'Audit retrieved successfully',
  AUDITS_FETCHED: 'Audits retrieved successfully',
  AUDIT_CREATED: 'Audit created successfully',
  AUDIT_UPDATED: 'Audit updated successfully',
  AUDIT_DELETED: 'Audit deleted successfully',
  AUDIT_NOT_FOUND: 'Audit not found',
  AUDIT_FINDING_ADDED: 'Audit finding added successfully',
  AUDIT_FINDING_UPDATED: 'Audit finding updated successfully',

  // ─── Inspections ───────────────────────────────────────────────────────────
  INSPECTION_FETCHED: 'Inspection retrieved successfully',
  INSPECTIONS_FETCHED: 'Inspections retrieved successfully',
  INSPECTION_CREATED: 'Inspection created successfully',
  INSPECTION_UPDATED: 'Inspection updated successfully',
  INSPECTION_DELETED: 'Inspection deleted successfully',
  INSPECTION_NOT_FOUND: 'Inspection not found',

  // ─── Corrective Actions ────────────────────────────────────────────────────
  CA_FETCHED: 'Corrective action retrieved successfully',
  CAS_FETCHED: 'Corrective actions retrieved successfully',
  CA_CREATED: 'Corrective action created successfully',
  CA_UPDATED: 'Corrective action updated successfully',
  CA_DELETED: 'Corrective action deleted successfully',
  CA_NOT_FOUND: 'Corrective action not found',
  CA_STATUS_UPDATED: 'Corrective action status updated successfully',
  CA_VERIFIED: 'Corrective action verified successfully',

  // ─── Attachments ───────────────────────────────────────────────────────────
  ATTACHMENT_FETCHED: 'Attachments retrieved successfully',
  ATTACHMENT_UPLOADED: 'Attachment uploaded successfully',
  ATTACHMENT_DELETED: 'Attachment deleted successfully',
  ATTACHMENT_NOT_FOUND: 'Attachment not found',

  // ─── Dashboard ─────────────────────────────────────────────────────────────
  DASHBOARD_FETCHED: 'Dashboard data retrieved successfully',

  // ─── Reports ───────────────────────────────────────────────────────────────
  REPORT_FETCHED: 'Report generated successfully',
});

module.exports = { MESSAGES };

