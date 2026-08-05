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
    const payload = response.data;
    let rawData = Array.isArray(payload?.data) ? payload.data : payload?.data?.rows || [];

    if (schemaId === 'hazard-reporting') {
      rawData = rawData.map((item: any) => ({
        ...item,
        hazard_category_id: item.category,
        risk_rating_id: item.severityLevel,
        description: item.title,
      }));
    } else if (schemaId === 'near-miss') {
      rawData = rawData.map((item: any) => ({
        ...item,
        details: item.description,
        investigation_required: item.severityLevel === 'High' ? 'Yes' : 'No',
        preventive_action: item.immediateAction,
        date: item.reportedAt,
      }));
    } else if (schemaId === 'incident-log') {
      rawData = rawData.map((item: any) => ({
        ...item,
        description: item.description,
        date: item.incidentDate,
        incident_category_id: item.incidentType,
        risk_rating_id: item.severityLevel,
        immediate_cause: item.immediateAction,
        root_cause: item.rootCause,
        status_id: item.status,
      }));
    }

    return {
      success: payload?.success !== false,
      message: payload?.message || 'Records loaded successfully.',
      data: rawData,
      meta: payload?.meta || payload?.data?.meta,
    };
  },

  create: async (schemaId: string, record: any): Promise<ApiResponse<any>> => {
    const endpoint = getEndpoint(schemaId);
    let payload = { ...record };

    if (schemaId === 'hazard-reporting') {
      payload = {
        ...payload,
        plantId: payload.plantId || 'c43274dc-10a4-4dc4-b789-9a2df41e06fa', // Fallback to a valid plant UUID if not present
        category: payload.hazard_category_id || 'other',
        severityLevel: payload.risk_rating_id || 'low',
        title: payload.description ? payload.description.substring(0, 50) : 'Hazard Report',
      };
    } else if (schemaId === 'near-miss') {
      payload = {
        ...payload,
        plantId: payload.plantId || 'c43274dc-10a4-4dc4-b789-9a2df41e06fa',
        title: payload.details ? payload.details.substring(0, 50) : 'Near Miss',
        description: payload.details || 'No details provided',
        severityLevel: payload.investigation_required === 'Yes' ? 'High' : 'Low',
        immediateAction: payload.preventive_action,
        reportedAt: payload.date,
        status: payload.status || 'Open'
      };
    } else if (schemaId === 'incident-log') {
      payload = {
        ...payload,
        plantId: payload.plantId || 'c43274dc-10a4-4dc4-b789-9a2df41e06fa',
        title: payload.description ? payload.description.substring(0, 50) : 'Incident Log',
        description: payload.description || 'No description provided',
        incidentDate: payload.date || new Date().toISOString(),
        incidentType: payload.incident_category_id || 'General',
        severityLevel: payload.risk_rating_id || 'Medium',
        immediateAction: payload.immediate_cause,
        rootCause: payload.root_cause,
        status: payload.status_id || 'Draft'
      };
    }

    const response = await apiClient.post(endpoint, payload);
    return response.data;
  },

  update: async (schemaId: string, id: string, updates: any): Promise<ApiResponse<any>> => {
    const endpoint = getEndpoint(schemaId);
    let payload = { ...updates };

    if (schemaId === 'hazard-reporting') {
      payload = {
        ...payload,
        category: payload.hazard_category_id || 'other',
        severityLevel: payload.risk_rating_id || 'low',
        title: payload.description ? payload.description.substring(0, 50) : 'Hazard Report',
      };
    } else if (schemaId === 'near-miss') {
      payload = {
        ...payload,
        title: payload.details ? payload.details.substring(0, 50) : 'Near Miss',
        description: payload.details,
        severityLevel: payload.investigation_required === 'Yes' ? 'High' : 'Low',
        immediateAction: payload.preventive_action,
        reportedAt: payload.date,
        status: payload.status
      };
    } else if (schemaId === 'incident-log') {
      payload = {
        ...payload,
        title: payload.description ? payload.description.substring(0, 50) : 'Incident Log',
        description: payload.description,
        incidentDate: payload.date,
        incidentType: payload.incident_category_id,
        severityLevel: payload.risk_rating_id,
        immediateAction: payload.immediate_cause,
        rootCause: payload.root_cause,
        status: payload.status_id
      };
    }

    const response = await apiClient.put(`${endpoint}/${id}`, payload);
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
