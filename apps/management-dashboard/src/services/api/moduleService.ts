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

const statusToApi = (value: unknown, schemaId: string) => {
  const status = String(value || '').trim();
  if (!status) return undefined;
  if (schemaId === 'action-tracker') {
    return ({ Open: 'open', Pending: 'open', 'Work in Progress': 'in_progress', Closed: 'completed', Cancelled: 'cancelled' }[status] || status.toLowerCase().replaceAll(' ', '_'));
  }
  const common: Record<string, string> = {
    Open: schemaId === 'hazard-reporting' ? 'submitted' : 'reported',
    Pending: schemaId === 'hazard-reporting' ? 'under_review' : 'under_investigation',
    'Work in Progress': schemaId === 'hazard-reporting' ? 'under_review' : 'corrective_action',
    Closed: 'closed',
    Cancelled: 'closed',
  };
  return common[status] || status.toLowerCase().replaceAll(' ', '_');
};

const severityToApi = (value: unknown) => String(value || '').trim().toLowerCase() || undefined;
const categoryToApi = (value: unknown) => {
  const text = String(value || '').trim().toLowerCase();
  const known = ['physical', 'chemical', 'biological', 'ergonomic', 'electrical', 'fire', 'environmental', 'behavioral', 'other'];
  return known.includes(text) ? text : 'other';
};
const statusFromApi = (value: unknown) => ({
  draft: 'Pending', reported: 'Open', submitted: 'Open', under_review: 'Pending',
  under_investigation: 'Pending', corrective_action: 'Work in Progress', closed: 'Closed',
}[String(value || '').toLowerCase()] || value);
const severityFromApi = (value: unknown) => {
  const text = String(value || '');
  return text ? text.charAt(0).toUpperCase() + text.slice(1).toLowerCase() : value;
};
const categoryFromApi = (value: unknown) => ({
  first_aid: 'First Aid', mtc: 'MTC', lti: 'LTI', rwc: 'RWC', fatality: 'Fatality',
  minor_fire: 'Minor Fire', significant_near_miss: 'Significant Near Miss',
}[String(value || '').toLowerCase()] || value);
const notifyDashboardRefresh = () => {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('dashboard-refresh'));
};

export const moduleService = {
  getAll: async (schemaId: string, params?: Record<string, unknown>): Promise<ApiResponse<any[]>> => {
    const endpoint = getEndpoint(schemaId);
    const response = await apiClient.get(endpoint, { params });
    const payload = response.data;
    let rawData = Array.isArray(payload?.data) ? payload.data : payload?.data?.rows || [];

    // Universally unpack metadata for all modules to restore UI fields
    rawData = rawData.map((item: any) => ({
      ...(item.metadata || {}),
      ...item,
    }));

    if (schemaId === 'hazard-reporting') {
      rawData = rawData.map((item: any) => ({
        ...item,
        hazard_category_id: item.metadata?.hazard_category_id || item.category || item.hazard_category_id,
        risk_rating_id: item.metadata?.risk_rating_id || severityFromApi(item.severityLevel || item.severity_level),
        description: item.metadata?.description || item.description || item.title,
        date: item.metadata?.date || item.reportedAt || item.reported_at || item.createdAt || item.created_at || new Date().toISOString(),
        status_id: item.metadata?.status_id || statusFromApi(item.status),
        department_id: item.metadata?.department_id || item.departmentId || item.department_id,
      }));
    } else if (schemaId === 'near-miss') {
      rawData = rawData.map((item: any) => ({
        ...item,
        details: item.metadata?.details || item.description,
        investigation_required: item.metadata?.investigation_required || (String(item.severityLevel || item.severity_level).toLowerCase() === 'high' ? 'Yes' : 'No'),
        preventive_action: item.metadata?.preventive_action || item.immediateAction || item.action_taken,
        date: item.metadata?.date || item.reportedAt || item.reported_at || item.createdAt || item.created_at || new Date().toISOString(),
        department_id: item.metadata?.department_id || item.departmentId || item.department_id,
      }));
    } else if (schemaId === 'incident-log') {
      rawData = rawData.map((item: any) => ({
        ...item,
        description: item.metadata?.description || item.description,
        date: item.metadata?.date || item.incidentDate || item.incident_date || item.createdAt || item.created_at || new Date().toISOString(),
        incident_category_id: item.metadata?.incident_category_id || categoryFromApi(item.incidentType || item.category),
        risk_rating_id: item.metadata?.risk_rating_id || severityFromApi(item.severityLevel || item.severity_level),
        immediate_cause: item.metadata?.immediate_cause || item.immediateAction || item.action_taken,
        root_cause: item.metadata?.root_cause || item.rootCause,
        actions: item.metadata?.actions || item.actions || [],
        status_id: item.metadata?.status_id || statusFromApi(item.status),
        department_id: item.metadata?.department_id || item.departmentId || item.department_id,
      }));
    }

    if (schemaId === 'training-records' || schemaId === 'audit-management' || schemaId === 'inspection-records' || schemaId === 'action-tracker') {
      rawData = rawData.map((item: any) => ({
        ...item,
        date: item.metadata?.date || item.scheduledDate || item.scheduled_date || item.dueDate || item.due_date || item.createdAt || item.created_at,
        department_id: item.metadata?.department_id || item.departmentId || item.department_id || item.department?.id,
        status_id: item.metadata?.status_id || item.status,
        source: item.metadata?.source || item.sourceType || item.source_type,
        manhours: item.metadata?.manhours || item.manhours || item.total_manhours || (Number(item.durationMinutes || item.duration_minutes) || 0) / 60,
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
    const metadata = { ...record };
    let payload = { ...record, metadata };

    if (schemaId === 'hazard-reporting') {
      payload = {
        ...payload,
        plantId: payload.plantId || '5126923e-b77f-4eb6-8b98-d5fc9db8d71b', // CBL Plant Alpha
        category: categoryToApi(payload.hazard_category_id),
        severityLevel: severityToApi(payload.risk_rating_id || 'low'),
        title: payload.description ? payload.description.substring(0, 50) : 'Hazard Report',
        status: statusToApi(payload.status_id || 'Open', schemaId),
      };
    } else if (schemaId === 'near-miss') {
      payload = {
        ...payload,
        plantId: payload.plantId || '5126923e-b77f-4eb6-8b98-d5fc9db8d71b',
        title: payload.details ? payload.details.substring(0, 50) : 'Near Miss',
        description: payload.details || 'No details provided',
        severityLevel: payload.investigation_required === 'Yes' ? 'high' : 'low',
        immediateAction: payload.preventive_action,
        reportedAt: payload.date,
        status: statusToApi(payload.status || 'Open', schemaId)
      };
    } else if (schemaId === 'incident-log') {
      payload = {
        ...payload,
        plantId: payload.plantId || '5126923e-b77f-4eb6-8b98-d5fc9db8d71b', // CBL Plant Alpha
        title: payload.description ? payload.description.substring(0, 50) : 'Incident Log',
        description: payload.description || 'No description provided',
        incidentDate: payload.date || new Date().toISOString(),
        incidentType: String(payload.incident_category_id || 'General').toLowerCase().replaceAll(' ', '_'),
        severityLevel: severityToApi(payload.risk_rating_id || 'Medium'),
        immediateAction: payload.immediate_cause,
        rootCause: payload.root_cause,
        status: statusToApi(payload.status_id || 'Open', schemaId)
      };
    }

    const response = await apiClient.post(endpoint, payload);
    notifyDashboardRefresh();
    return response.data;
  },

  update: async (schemaId: string, id: string, updates: any): Promise<ApiResponse<any>> => {
    const endpoint = getEndpoint(schemaId);
    const metadata = { ...updates };
    let payload = { ...updates, metadata };

    if (schemaId === 'hazard-reporting') {
      payload = {
        ...payload,
        category: categoryToApi(payload.hazard_category_id),
        severityLevel: severityToApi(payload.risk_rating_id || 'low'),
        title: payload.description ? payload.description.substring(0, 50) : 'Hazard Report',
        status: statusToApi(payload.status_id, schemaId),
      };
    } else if (schemaId === 'near-miss') {
      payload = {
        ...payload,
        title: payload.details ? payload.details.substring(0, 50) : 'Near Miss',
        description: payload.details,
        severityLevel: payload.investigation_required === 'Yes' ? 'high' : 'low',
        immediateAction: payload.preventive_action,
        reportedAt: payload.date,
        status: statusToApi(payload.status, schemaId)
      };
    } else if (schemaId === 'incident-log') {
      payload = {
        ...payload,
        title: payload.description ? payload.description.substring(0, 50) : 'Incident Log',
        description: payload.description,
        incidentDate: payload.date,
        incidentType: payload.incident_category_id ? String(payload.incident_category_id).toLowerCase().replaceAll(' ', '_') : undefined,
        severityLevel: severityToApi(payload.risk_rating_id),
        immediateAction: payload.immediate_cause,
        rootCause: payload.root_cause,
        status: statusToApi(payload.status_id, schemaId)
      };
    }

    const response = await apiClient.put(`${endpoint}/${id}`, payload);
    notifyDashboardRefresh();
    return response.data;
  },

  delete: async (schemaId: string, id: string): Promise<ApiResponse<null>> => {
    const endpoint = getEndpoint(schemaId);
    const response = await apiClient.delete(`${endpoint}/${id}`);
    notifyDashboardRefresh();
    return response.data;
  },

  updateStatus: async (schemaId: string, id: string, status: string, reason?: string) => {
    const endpoint = getEndpoint(schemaId);
    const response = await apiClient.patch(`${endpoint}/${id}/status`, { status: statusToApi(status, schemaId), reason });
    notifyDashboardRefresh();
    return response.data;
  },

  restore: async (schemaId: string, id: string) => {
    const endpoint = getEndpoint(schemaId);
    const response = await apiClient.post(`${endpoint}/${id}/restore`);
    notifyDashboardRefresh();
    return response.data;
  },

  bulk: async (schemaId: string, records: any[]) => {
    const endpoint = getEndpoint(schemaId);
    const response = await apiClient.post(`${endpoint}/bulk`, { records });
    notifyDashboardRefresh();
    return response.data;
  },

  export: async (schemaId: string, params?: Record<string, unknown>) => {
    const endpoint = getEndpoint(schemaId);
    const response = await apiClient.get(`${endpoint}/export`, { params, responseType: 'blob' });
    return response.data;
  }
};
