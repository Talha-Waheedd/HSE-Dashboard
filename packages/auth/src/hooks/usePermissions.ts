import { useAuthStore } from "../store/authStore";

export const usePermissions = () => {
  const { user, hasRole, hasPermission } = useAuthStore();

  // Roles exactly as defined by the user
  const isSysAdmin = hasRole("System Administrator") || hasRole("Administrator");
  const isHseManager = hasRole("HSE Manager");
  const isHseOfficer = hasRole("HSE Officer");
  const isDeptManager = hasRole("Department Manager");
  const isDataEntry = hasRole("Data Entry Operator");
  const isViewer = hasRole("Viewer") || hasRole("Read Only");

  const permissionOrRole = (permission: string, roleAccess: boolean) => hasPermission(permission) || roleAccess;

  const canAddData = () => permissionOrRole('hazards.create', isSysAdmin || isHseManager || isHseOfficer || isDataEntry);

  const canEditData = () => {
    return permissionOrRole('hazards.update', isSysAdmin || isHseManager || isHseOfficer);
  };

  const canDeleteData = () => {
    return permissionOrRole('hazards.delete', isSysAdmin || isHseManager || isHseOfficer);
  };

  const canExportCSV = () => {
    return permissionOrRole('reports.export', isSysAdmin || isHseManager || isHseOfficer || isDeptManager);
  };

  const canViewReports = () => {
    return permissionOrRole('dashboard.view', isSysAdmin || isHseManager || isHseOfficer || isDeptManager || isViewer);
  };

  const canApproveRecords = () => {
    return permissionOrRole('records.approve', isSysAdmin || isHseManager);
  };

  const canSubmitHazardClosure = (hazard?: any) => {
    if (isSysAdmin) return true;
    if (!isDeptManager || !hasPermission('hazard:submit_closure')) return false;
    if (!hazard) return true;
    const responsibleDepartmentId = hazard.responsibleDepartmentId
      || hazard.responsible_department_id
      || hazard.metadata?.responsible_department_id;
    const status = String(hazard.status || '').toLowerCase();
    const currentDepartmentId = user?.department_id;
    return Boolean(currentDepartmentId)
      && currentDepartmentId === responsibleDepartmentId
      && ['submitted', 'open'].includes(status);
  };

  const canReviewHazardClosure = (hazard?: any) => {
    if (isSysAdmin) return true;
    if (!isHseManager || !hasPermission('hazard:review_closure')) return false;
    if (!hazard) return true;
    return String(hazard.status || '').toLowerCase() === 'under_review'
      && Boolean(hazard.metadata?.closure_submission?.submitted_by);
  };

  const isDepartmentRestricted = () => {
    return isDeptManager;
  };

  return {
    canAddData,
    canEditData,
    canDeleteData,
    canExportCSV,
    canViewReports,
    canApproveRecords,
    canSubmitHazardClosure,
    canReviewHazardClosure,
    isDepartmentRestricted,
    userRole: user?.role || 'Unknown',
    userDepartment: user?.department_id || 'None'
  };
};
