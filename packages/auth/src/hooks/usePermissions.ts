import { useAuthStore } from "../store/authStore";

export const usePermissions = () => {
  const { user, hasRole, hasPermission } = useAuthStore();

  // Roles exactly as defined by the user
  const isSysAdmin = hasRole("System Administrator");
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
    isDepartmentRestricted,
    userRole: user?.role || 'Unknown',
    userDepartment: user?.department_id || 'None'
  };
};
