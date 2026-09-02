import { apiClient } from '@cbl/api';

export type MasterRecord = {
  id: string;
  name: string;
  code?: string | null;
  plantId?: string | null;
  isActive: boolean;
  description?: string | null;
};

export type PermissionRecord = {
  id: string;
  key: string;
  displayName: string;
  group?: string | null;
  description?: string | null;
};

export type RoleRecord = {
  id: string;
  name: string;
  displayName: string;
  description?: string | null;
  isSystem: boolean;
  permissions: PermissionRecord[];
};

export type UserRecord = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  status: boolean;
  lastLoginAt?: string | null;
  roleId?: string | null;
  role?: Pick<RoleRecord, 'id' | 'name' | 'displayName'> | null;
  employeeProfile?: {
    id: string;
    employeeId: string;
    departmentId?: string | null;
    plantId?: string | null;
    designation?: string | null;
    department?: MasterRecord | null;
  } | null;
};

export type PageResponse<T> = {
  data: T[];
  meta?: { currentPage?: number; pageSize?: number; totalRecords?: number; total?: number; totalPages?: number };
  message?: string;
};

const dataOf = <T>(response: any): T => (response?.data?.data ?? response?.data) as T;

export const apiErrorMessage = (error: any, fallback: string) =>
  error?.response?.data?.message || error?.response?.data?.errors?.[0]?.message || error?.message || fallback;

export const notifyMasterDataChanged = (type: 'locations' | 'departments') => {
  window.dispatchEvent(new CustomEvent(`${type}-refresh`));
  window.dispatchEvent(new CustomEvent('master-data-refresh', { detail: { type } }));
};

export const adminService = {
  listPlants: async () => dataOf<MasterRecord[]>((await apiClient.get('/plants/active')).data),

  listLocations: async (params: Record<string, unknown>) => (await apiClient.get('/locations', { params })).data as PageResponse<MasterRecord>,
  createLocation: async (payload: Partial<MasterRecord>) => dataOf<MasterRecord>((await apiClient.post('/locations', payload)).data),
  updateLocation: async (id: string, payload: Partial<MasterRecord>) => dataOf<MasterRecord>((await apiClient.put(`/locations/${id}`, payload)).data),
  deactivateLocation: async (id: string) => dataOf<MasterRecord>((await apiClient.delete(`/locations/${id}`)).data),

  listDepartments: async (params: Record<string, unknown>) => (await apiClient.get('/departments', { params })).data as PageResponse<MasterRecord>,
  createDepartment: async (payload: Partial<MasterRecord>) => dataOf<MasterRecord>((await apiClient.post('/departments', payload)).data),
  updateDepartment: async (id: string, payload: Partial<MasterRecord>) => dataOf<MasterRecord>((await apiClient.put(`/departments/${id}`, payload)).data),
  deactivateDepartment: async (id: string) => dataOf<MasterRecord>((await apiClient.delete(`/departments/${id}`)).data),

  listPermissions: async () => dataOf<PermissionRecord[]>((await apiClient.get('/roles/permissions')).data),
  listRoles: async () => dataOf<RoleRecord[]>((await apiClient.get('/roles')).data),
  createRole: async (payload: Record<string, unknown>) => dataOf<RoleRecord>((await apiClient.post('/roles', payload)).data),
  updateRole: async (id: string, payload: Record<string, unknown>) => dataOf<RoleRecord>((await apiClient.patch(`/roles/${id}`, payload)).data),
  updateRolePermissions: async (id: string, permissionIds: string[]) => dataOf<RoleRecord>((await apiClient.put(`/roles/${id}/permissions`, { permissionIds })).data),
  deleteRole: async (id: string) => apiClient.delete(`/roles/${id}`),

  listUsers: async (params: Record<string, unknown>) => (await apiClient.get('/users', { params })).data as PageResponse<UserRecord>,
  createUser: async (payload: Record<string, unknown>) => dataOf<UserRecord>((await apiClient.post('/users', payload)).data),
  updateUser: async (id: string, payload: Record<string, unknown>) => dataOf<UserRecord>((await apiClient.patch(`/users/${id}`, payload)).data),
  deleteUser: async (id: string) => apiClient.delete(`/users/${id}`),
};
