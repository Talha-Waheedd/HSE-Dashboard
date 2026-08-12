'use strict';

const ROLES = Object.freeze({
  ADMINISTRATOR: 'Administrator',
  INDUSTRY: 'Industry',
  SYSTEM_ADMINISTRATOR: 'System Administrator',
  SUPER_ADMIN: 'Super Admin',
  HSE_MANAGER: 'HSE Manager',
  HSE_OFFICER: 'HSE Officer',
  DEPARTMENT_MANAGER: 'Department Manager',
  DATA_ENTRY_OPERATOR: 'Data Entry Operator',
  VIEWER: 'Viewer',
  READ_ONLY: 'Read Only',
});

const normalizeRoleName = (role) => String(role || '').trim().toLowerCase().replace(/[_-]+/g, ' ');
const isAdministratorRole = (role) => ['administrator', 'system administrator', 'super admin'].includes(normalizeRoleName(role));

module.exports = { ROLES, normalizeRoleName, isAdministratorRole };
