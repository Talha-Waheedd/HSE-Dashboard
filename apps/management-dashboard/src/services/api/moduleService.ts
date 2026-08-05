import { apiClient } from '@cbl/api';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: any;
}

const schemaToEndpoint: Record<string, string> = {
  'hazard-reporting': '/hazards',
  'near-miss': '/near-misses',
  'incident-log': '/incidents',
  'training-records': '/trainings',
  'action-tracker': '/corrective-actions',
  'audit-management': '/audits',
  'inspection-records': '/inspections',
};

const getEndpoint = (schemaId: string): string => {
  const endpoint = schemaToEndpoint[schemaId];
  if (!endpoint) {
    throw new Error(`No endpoint mapped for schemaId: ${schemaId}`);
  }
  return endpoint;
};

export const moduleService = {
  getAll: async (schemaId: string, params?: Record<string, unknown>): Promise<ApiResponse<any[]>> => {
    const endpoint = getEndpoint(schemaId);
    const response = await apiClient.get(endpoint, { params });
    // Assuming backend returns { success: true, data: [...], message: "..." }
    // which aligns with ApiResponse utility from the backend.
    const payload = response.data;
    return {
      success: payload?.success !== false,
      message: payload?.message || 'Records loaded successfully.',
      data: Array.isArray(payload?.data) ? payload.data : payload?.data?.rows || [],
      meta: payload?.meta || payload?.data?.meta,
    };
  },

  create: async (schemaId: string, record: any): Promise<ApiResponse<any>> => {
    const endpoint = getEndpoint(schemaId);
    const response = await apiClient.post(endpoint, record);
    return response.data;
  },

  update: async (schemaId: string, id: string, updates: any): Promise<ApiResponse<any>> => {
    const endpoint = getEndpoint(schemaId);
    const response = await apiClient.put(`${endpoint}/${id}`, updates);
    return response.data;
  },

  delete: async (schemaId: string, id: string): Promise<ApiResponse<null>> => {
    const endpoint = getEndpoint(schemaId);
    const response = await apiClient.delete(`${endpoint}/${id}`);
    return response.data;
  },

  updateStatus: async (schemaId: string, id: string, status: string, reason?: string) => {
    const endpoint = getEndpoint(schemaId);
    const response = await apiClient.patch(`${endpoint}/${id}/status`, { status, reason });
    return response.data;
  },

  restore: async (schemaId: string, id: string) => {
    const endpoint = getEndpoint(schemaId);
    const response = await apiClient.post(`${endpoint}/${id}/restore`);
    return response.data;
  },

  bulk: async (schemaId: string, records: any[]) => {
    const endpoint = getEndpoint(schemaId);
    const response = await apiClient.post(`${endpoint}/bulk`, { records });
    return response.data;
  },

  export: async (schemaId: string, params?: Record<string, unknown>) => {
    const endpoint = getEndpoint(schemaId);
    const response = await apiClient.get(`${endpoint}/export`, { params, responseType: 'blob' });
    return response.data;
  }
};
