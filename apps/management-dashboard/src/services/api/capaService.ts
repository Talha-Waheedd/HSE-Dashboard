import { apiClient } from '@cbl/api';

export const CAPA_INCIDENT_CATEGORIES = ['Hazard', 'Near Miss', 'Incident', 'Audit Finding'] as const;

export const CAPA_SOURCE_OPTIONS = [
  { value: 'hazard', label: 'Hazard Reporting' },
  { value: 'near_miss', label: 'Near Miss Reporting' },
  { value: 'incident', label: 'Incident Investigation' },
  { value: 'audit', label: 'Audit Logs' },
] as const;

export type CapaStatus = 'open' | 'in_progress' | 'completed' | 'verified' | 'overdue' | 'cancelled';

export type CapaAction = {
  id: string;
  capaNumber: string;
  sourceType: string;
  sourceId: string;
  sourceItemId?: string | null;
  sourceItemKey: string;
  sourceReference?: string | null;
  incidentCategory?: string | null;
  title: string;
  description: string;
  responsibleDepartmentId?: string | null;
  responsibleDepartment?: { id: string; name: string; code?: string | null } | null;
  responsibility?: string | null;
  dueDate?: string | null;
  priority?: string | null;
  status: CapaStatus;
  createdAt: string;
  updatedAt: string;
  lastSyncedAt?: string | null;
};

export type CapaPageMeta = {
  currentPage: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
};

export type CapaPage = { data: CapaAction[]; meta: CapaPageMeta };

const pageData = (payload: any): CapaPage => ({
  data: Array.isArray(payload?.data) ? payload.data : [],
  meta: {
    currentPage: Number(payload?.meta?.currentPage || 1),
    pageSize: Number(payload?.meta?.pageSize || 25),
    totalRecords: Number(payload?.meta?.totalRecords || 0),
    totalPages: Number(payload?.meta?.totalPages || 1),
  },
});

export const capaStatusLabel = (status: string) => {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'open') return 'Open';
  if (['in_progress', 'overdue'].includes(normalized)) return 'In Progress';
  if (['completed', 'verified', 'cancelled'].includes(normalized)) return 'Closed';
  return 'Open';
};

export const capaSourceLabel = (sourceType: string) => (
  CAPA_SOURCE_OPTIONS.find(option => option.value === sourceType)?.label
  || String(sourceType || 'Unknown').replaceAll('_', ' ')
);

export const capaService = {
  list: async (params: Record<string, unknown>): Promise<CapaPage> => {
    const response = await apiClient.get('/corrective-actions', { params });
    return pageData(response.data);
  },
  get: async (id: string): Promise<CapaAction> => {
    const response = await apiClient.get(`/corrective-actions/${id}`);
    return (response.data?.data ?? response.data) as CapaAction;
  },
  export: async (params: Record<string, unknown>) => {
    const response = await apiClient.get('/corrective-actions/export', { params, responseType: 'blob' });
    return response.data as Blob;
  },
};
