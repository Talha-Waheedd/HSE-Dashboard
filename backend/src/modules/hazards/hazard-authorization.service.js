'use strict';

const ApiError = require('../../shared/utils/ApiError');
const { ROLES, isAdministratorRole } = require('../../shared/constants/roles');

const userRole = (user) => user?.role?.name || user?.role?.displayName || '';
const userDepartmentId = (user) => (
  user?.employeeProfile?.departmentId ||
  user?.employeeProfile?.department?.id ||
  user?.departmentId ||
  user?.department_id ||
  null
);
const responsibleDepartmentId = (hazard) => (
  hazard?.responsibleDepartmentId ||
  hazard?.responsible_department_id ||
  hazard?.metadata?.responsible_department_id ||
  null
);

const isAdministrator = (user) => isAdministratorRole(userRole(user));

const assertCanSubmitHazardClosure = (hazard, user) => {
  if (isAdministrator(user)) return;
  if (userRole(user) !== ROLES.DEPARTMENT_MANAGER) {
    throw ApiError.forbidden('Only the responsible Department Manager can submit this hazard for HSE review.');
  }

  const managerDepartmentId = userDepartmentId(user);
  const assignedDepartmentId = responsibleDepartmentId(hazard);
  if (!managerDepartmentId || !assignedDepartmentId || managerDepartmentId !== assignedDepartmentId) {
    throw ApiError.forbidden('This hazard is assigned to a different responsible department.');
  }
};

const assertCanReviewHazardClosure = (user) => {
  if (isAdministrator(user)) return;
  if (userRole(user) !== ROLES.HSE_MANAGER) {
    throw ApiError.forbidden('Only an HSE Manager can approve or return a hazard closure.');
  }
};

module.exports = {
  assertCanSubmitHazardClosure,
  assertCanReviewHazardClosure,
  userDepartmentId,
  responsibleDepartmentId,
};
