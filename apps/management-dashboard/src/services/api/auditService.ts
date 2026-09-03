import { apiClient } from '@cbl/api';

export type AuditStatus = 'planned' | 'in_progress' | 'completed';
export type PlanStatus = 'Pending' | 'WIP' | 'Done';

export type PageMeta = {
  currentPage: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
};

export type AuditPlan = {
  id: string;
  serialNumber?: number | null;
  areaName: string;
  areaOwners?: string | null;
  auditObjective?: string | null;
  riskRating?: string | null;
  auditors?: string | null;
  frequency?: string | null;
  status: PlanStatus;
  occurrenceCount: number;
  scheduleData?: Array<{ month: string; raw: string; dates: string[] }>;
};

export type AuditItem = {
  id?: string;
  standardReference: string;
  description: string;
  standardLimitRequirement: string;
  score: number | null;
  recommendation: string;
  targetDate: string;
  responsibility: string;
  responsibleDepartmentId: string;
  responsibleDepartment?: { id: string; name: string; code?: string | null } | null;
  status: 'open' | 'closed';
  sortOrder: number;
};

export type AuditLog = {
  id: string;
  plantId: string;
  auditNumber?: string | null;
  title: string;
  areaOwner?: string | null;
  auditObjective?: string | null;
  riskRating?: string | null;
  auditors?: string | null;
  frequency?: string | null;
  personsInterviewed?: string | null;
  status: AuditStatus;
  scheduledDate: string;
  completedDate?: string | null;
  summary?: string | null;
  score?: number | null;
  pointsScored?: number;
  pointsAvailable?: number;
  overallCompliance?: number;
  findings?: AuditItem[];
  criticalAuditPlan?: AuditPlan | null;
};

type PageResponse<T> = { data: T[]; meta: PageMeta; message?: string };

const pageData = <T>(payload: any): PageResponse<T> => ({
  data: Array.isArray(payload?.data) ? payload.data : [],
  meta: {
    currentPage: Number(payload?.meta?.currentPage || 1),
    pageSize: Number(payload?.meta?.pageSize || 25),
    totalRecords: Number(payload?.meta?.totalRecords || 0),
    totalPages: Number(payload?.meta?.totalPages || 1),
  },
  message: payload?.message,
});

export const auditStatusLabel = (status: string): PlanStatus => ({
  planned: 'Pending',
  in_progress: 'WIP',
  completed: 'Done',
} as Record<string, PlanStatus>)[status] || 'Pending';

export const auditService = {
  listLogs: async (params: Record<string, unknown>): Promise<PageResponse<AuditLog>> => {
    const response = await apiClient.get('/audits', { params: { ...params, hasPlan: true } });
    return pageData<AuditLog>(response.data);
  },

  getLog: async (id: string): Promise<AuditLog> => {
    const response = await apiClient.get(`/audits/${id}`);
    return (response.data?.data ?? response.data) as AuditLog;
  },

  updateLog: async (id: string, payload: Record<string, unknown>): Promise<AuditLog> => {
    const response = await apiClient.put(`/audits/${id}`, payload);
    return (response.data?.data ?? response.data) as AuditLog;
  },

  listPlans: async (params: Record<string, unknown>): Promise<PageResponse<AuditPlan>> => {
    const response = await apiClient.get('/audits/critical-plans', { params });
    return pageData<AuditPlan>(response.data);
  },

  importPlan: async (file: File, plantId: string) => {
    const body = new FormData();
    body.append('file', file);
    body.append('plantId', plantId);
    const response = await apiClient.post('/audits/critical-plans/import', body, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    });
    return response.data?.data ?? response.data;
  },
};
