import { apiClient } from '@cbl/api';

// Default plant UUID for the CBL LU Sukkur plant.
// This is the primary plant seeded in the database. If your environment uses
// a different plant UUID, set VITE_DEFAULT_PLANT_ID in your .env file.
const DEFAULT_PLANT_ID: string =
  import.meta.env.VITE_DEFAULT_PLANT_ID || '5126923e-b77f-4eb6-8b98-d5fc9db8d71b';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: any;
}

export interface DepartmentOption {
  id: string;
  name: string;
  code?: string | null;
  isActive?: boolean;
}

const analysisStatusFromApi = (value: unknown) => ({
  not_reviewed: 'Not Reviewed',
  under_review: 'Under Review',
  completed: 'Analysis Completed',
}[String(value || '').toLowerCase()] || 'Not Reviewed');

const normalizeMasterAnalysisRecord = (item: any) => ({
  id: item.analysis_key,
  originalReportId: item.source_id,
  sourceType: item.source_type,
  sourceId: item.source_id,
  reportType: item.report_type,
  reportedBy: item.reported_by || '—',
  department: item.department || '—',
  location: item.location || '—',
  date: item.report_date || '—',
  description: item.description || item.title || '',
  originalStatus: item.original_status || '—',
  analysisStatus: analysisStatusFromApi(item.analysis_status),
  analysisData: item.analysis_data || {},
  originalData: item.original_data || {},
});

const schemaToEndpoint: Record<string, string> = {
  'hazard-reporting': '/hazards',
  'near-miss': '/near-misses',
  'incident-log': '/incidents',
  'training-records': '/trainings',
  'action-tracker': '/corrective-actions',
  'audit-management': '/audits',
  'critical-audit-plan': '/audits',
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
  if (schemaId === 'training-records') {
    return ({ Open: 'scheduled', Pending: 'scheduled', 'Work in Progress': 'in_progress', Closed: 'completed', Cancelled: 'cancelled' }[status] || status.toLowerCase().replaceAll(' ', '_'));
  }
  if (schemaId === 'action-tracker') {
    return ({ Open: 'open', Pending: 'open', 'Work in Progress': 'in_progress', Closed: 'completed', Cancelled: 'cancelled' }[status] || status.toLowerCase().replaceAll(' ', '_'));
  }
  if (schemaId === 'audit-management' || schemaId === 'critical-audit-plan') {
    return ({ Planned: 'planned', Pending: 'planned', Done: 'completed', Closed: 'completed', WIP: 'in_progress', 'Work in Progress': 'in_progress', Cancelled: 'cancelled' }[status] || status.toLowerCase().replaceAll(' ', '_'));
  }
  if (schemaId === 'near-miss') {
    return ({ Open: 'submitted', Pending: 'under_review', 'Work in Progress': 'under_review', Closed: 'closed', Cancelled: 'closed' }[status] || status.toLowerCase().replaceAll(' ', '_'));
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
const isUuid = (value: unknown) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));
const categoryToApi = (value: unknown) => {
  const text = String(value || '').trim().toLowerCase();
  const known = ['physical', 'chemical', 'biological', 'ergonomic', 'electrical', 'fire', 'environmental', 'behavioral', 'other'];
  return known.includes(text) ? text : 'other';
};
const trainingTypeToApi = (value: unknown) => ({
  internal: 'other', external: 'other', 'toolbox talk': 'toolbox_talk', 'safety briefing': 'refresher',
  'fire drill': 'fire_safety', orientation: 'induction', induction: 'induction', refresher: 'refresher',
  toolbox_talk: 'toolbox_talk', fire_safety: 'fire_safety', first_aid: 'first_aid', ppe_usage: 'ppe_usage',
  chemical_handling: 'chemical_handling', emergency_response: 'emergency_response', other: 'other',
}[String(value || '').trim().toLowerCase()] || 'other');
const statusFromApi = (value: unknown) => ({
  draft: 'Pending', reported: 'Open', submitted: 'Open', under_review: 'Pending',
  under_investigation: 'Pending', corrective_action: 'Work in Progress', resolved: 'Closed', closed: 'Closed',
  scheduled: 'Pending', in_progress: 'Work in Progress', completed: 'Closed', cancelled: 'Cancelled',
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
const prepareRequestParams = (params: Record<string, unknown> = {}, schemaId?: string) => {
  const requestParams = { ...params };
  Object.entries(requestParams).forEach(([key, value]) => {
    if (value === '' || value === null || value === undefined || value === 'All') delete requestParams[key];
  });
  if (schemaId && ['hazard-reporting', 'near-miss', 'incident-log', 'training-records', 'action-tracker', 'audit-management', 'critical-audit-plan'].includes(schemaId) && requestParams.status) {
    requestParams.status = statusToApi(requestParams.status, schemaId);
  }
  if (schemaId === 'audit-management' || schemaId === 'critical-audit-plan') requestParams.source = schemaId;
  return requestParams;
};
const normalizeIncidentActions = (actions: unknown) => Array.isArray(actions) ? actions.map((item: any) => ({
  action: String(item?.action ?? item?.action_description ?? '').trim(),
  responsible_person: String(item?.responsible_person ?? item?.responsiblePerson ?? item?.responsibility ?? item?.responsible ?? '').trim(),
  responsible_department: String(item?.responsible_department ?? item?.responsibleDepartment ?? '').trim(),
  timeline: item?.timeline ?? item?.deadline ?? item?.timeline_deadline ?? '',
  severity: ['Low', 'Medium', 'High'].includes(item?.severity) ? item.severity : 'Medium',
  status: ['Open', 'Planned', 'Closed'].includes(item?.status) ? item.status : 'Open',
  legacy: item?.legacy === true || (!item?.responsible_person && !item?.responsiblePerson && !item?.responsible_department && !item?.responsibleDepartment),
})) : [];
const normalizeCollection = (value: unknown) => Array.isArray(value) ? value : [];

export const moduleService = {
  getMasterAnalysis: async (params?: Record<string, unknown>): Promise<ApiResponse<any[]>> => {
    const requestParams = { ...(params || {}) };
    Object.entries(requestParams).forEach(([key, value]) => {
      if (value === '' || value === null || value === undefined || value === 'All') delete requestParams[key];
    });
    const response = await apiClient.get('/master-analysis', { params: requestParams });
    const payload = response.data;
    return {
      success: payload?.success !== false,
      message: payload?.message || 'Master analysis loaded successfully.',
      data: Array.isArray(payload?.data) ? payload.data.map(normalizeMasterAnalysisRecord) : [],
      meta: {
        ...(payload?.meta || {}),
        summary: payload?.meta?.summary || { totalReports: 0, notReviewed: 0, underReview: 0, completed: 0 },
      },
    };
  },
  getMasterAnalysisRecord: async (key: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.get(`/master-analysis/${encodeURIComponent(key)}`);
    const payload = response.data;
    return { ...payload, data: normalizeMasterAnalysisRecord(payload?.data || {}) };
  },
  saveMasterAnalysis: async (key: string, analysisData: any, analysisStatus: string): Promise<ApiResponse<any>> => {
    const normalizedStatus = ({ 'Not Reviewed': 'not_reviewed', 'Under Review': 'under_review', 'Analysis Completed': 'completed' } as Record<string, string>)[analysisStatus] || analysisStatus;
    const response = await apiClient.put(`/master-analysis/${encodeURIComponent(key)}`, { analysisData, analysisStatus: normalizedStatus });
    const payload = response.data;
    notifyDashboardRefresh();
    return { ...payload, data: normalizeMasterAnalysisRecord(payload?.data || {}) };
  },
  getDepartments: async (): Promise<ApiResponse<DepartmentOption[]>> => {
    const response = await apiClient.get('/departments', { params: { isActive: true, page: 1, limit: 100, sortBy: 'name', sortOrder: 'asc' } });
    return response.data;
  },
  getAll: async (schemaId: string, params?: Record<string, unknown>): Promise<ApiResponse<any[]>> => {
    const endpoint = getEndpoint(schemaId);
    const requestParams = prepareRequestParams(params, schemaId);
    const response = await apiClient.get(endpoint, { params: requestParams });
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
        // `reportedAt` is the authoritative hazard observation date. Imported
        // metadata can contain legacy display dates and must not override it.
        date: item.reportedAt || item.reported_at || item.metadata?.date || item.createdAt || item.created_at || new Date().toISOString(),
        status_id: item.metadata?.status_id || statusFromApi(item.status),
        department_id: item.metadata?.originated_department || item.metadata?.department_id || item.departmentId || item.department_id,
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
        actions: normalizeIncidentActions(item.metadata?.actions || item.actions || []),
        status_id: item.metadata?.status_id || statusFromApi(item.status),
        department_id: item.metadata?.department_id || item.departmentId || item.department_id,
      }));
    }

    if (schemaId === 'training-records' || schemaId === 'audit-management' || schemaId === 'critical-audit-plan' || schemaId === 'inspection-records' || schemaId === 'action-tracker') {
      rawData = rawData.map((item: any) => ({
        ...item,
        date: item.metadata?.date || item.scheduledDate || item.scheduled_date || item.dueDate || item.due_date || item.createdAt || item.created_at,
        department_id: item.metadata?.department_id || item.departmentId || item.department_id || item.department?.id,
        department_name: item.metadata?.department_name || item.departmentName || item.department?.name,
        department_code: item.metadata?.department_code || item.department?.code,
        status_id: item.metadata?.status_id || statusFromApi(item.status),
        source: item.metadata?.source || item.sourceType || item.source_type,
        training_type: item.metadata?.training_type || item.trainingType || item.training_type,
        training_type_label: item.trainingTypeLabel || String(item.trainingType || item.training_type || '').split('_').map((part: string) => part ? part.charAt(0).toUpperCase() + part.slice(1) : '').join(' '),
        trainer: item.metadata?.trainer || item.trainerName || item.trainer_name || item.trainer?.name,
        topic: item.metadata?.topic || item.title,
        participants: item.metadata?.participants ?? item.participantCount ?? item.participant_count ?? item.maxAttendees ?? item.max_attendees,
        duration_minutes: item.metadata?.duration_minutes ?? item.durationMinutes ?? item.duration_minutes ?? null,
        manhours: item.metadata?.manhours ?? item.manhours ?? item.total_manhours ?? (item.participantCount != null && item.durationMinutes != null ? Number(item.participantCount) * Number(item.durationMinutes) / 60 : null),
        manhours_warning: item.manhoursWarning || (item.participantCount == null || item.durationMinutes == null ? 'Participants and duration are required to calculate manhours.' : null),
      }));
    }

    return {
      success: payload?.success !== false,
      message: payload?.message || 'Records loaded successfully.',
      data: rawData,
      meta: payload?.meta || payload?.data?.meta,
    };
  },

  getHazardSummary: async (params?: Record<string, unknown>): Promise<ApiResponse<{ totalRecords: number; assigned: number; submittedForReview: number; closedThisMonth: number }>> => {
    const requestParams = { ...(params || {}) };
    Object.entries(requestParams).forEach(([key, value]) => {
      if (value === '' || value === null || value === undefined || value === 'All') delete requestParams[key];
    });
    const response = await apiClient.get('/hazards/summary', { params: requestParams });
    return response.data;
  },

  getTrainingSummary: async (params?: Record<string, unknown>): Promise<ApiResponse<any>> => {
    const requestParams = prepareRequestParams(params, 'training-records');
    const response = await apiClient.get('/trainings/summary', { params: requestParams });
    return response.data;
  },

  getIncidentSummary: async (params?: Record<string, unknown>): Promise<ApiResponse<any>> => {
    const requestParams = prepareRequestParams(params, 'incident-log');
    const response = await apiClient.get('/incidents/summary', { params: requestParams });
    return response.data;
  },

  getActionSummary: async (params?: Record<string, unknown>): Promise<ApiResponse<any>> => {
    const requestParams = prepareRequestParams(params, 'action-tracker');
    const response = await apiClient.get('/corrective-actions/summary', { params: requestParams });
    return response.data;
  },

  create: async (schemaId: string, record: any): Promise<ApiResponse<any>> => {
    const endpoint = getEndpoint(schemaId);
    const idempotencyKey = String(record?.__idempotencyKey || '').trim() ||
      (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `hazard-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    const { __idempotencyKey: _ignoredIdempotencyKey, ...formRecord } = record || {};
    const metadata = { ...formRecord };
    let payload = { ...formRecord, metadata };

    if (schemaId === 'hazard-reporting') {
      payload = {
        ...payload,
        plantId: payload.plantId || DEFAULT_PLANT_ID,
        // Form options currently use department codes (such as HSE / PRD),
        // whereas the relational API field accepts only a department UUID.
        // Keep the selected code in metadata and omit the invalid FK value.
        departmentId: isUuid(payload.department_id) ? payload.department_id : undefined,
        category: categoryToApi(payload.hazard_category_id === 'Other' ? payload.hazard_category_id_other : payload.hazard_category_id),
        severityLevel: severityToApi(payload.risk_rating_id || 'low'),
        title: payload.description ? payload.description.substring(0, 50) : 'Hazard Report',
        reportedAt: payload.date || undefined,
        // Accept both the form field name and the API field name.  This keeps
        // saves reliable when an edit/import supplies `status` instead of
        // `status_id`, while the backend still receives a canonical enum.
        status: statusToApi(payload.status_id ?? payload.status ?? 'Open', schemaId),
      };
    } else if (schemaId === 'near-miss') {
      payload = {
        ...payload,
        plantId: payload.plantId || DEFAULT_PLANT_ID,
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
        plantId: payload.plantId || DEFAULT_PLANT_ID,
        title: payload.description ? payload.description.substring(0, 50) : 'Incident Log',
        description: payload.description || 'No description provided',
        incidentDate: payload.date || new Date().toISOString(),
        incidentType: String(payload.incident_category_id || 'General').toLowerCase().replaceAll(' ', '_'),
        severityLevel: severityToApi(payload.risk_rating_id || 'Medium'),
        immediateAction: payload.immediate_cause,
        rootCause: payload.root_cause,
        actions: normalizeIncidentActions(payload.actions),
        attachments: normalizeCollection(payload.attachments),
        status: statusToApi(payload.status_id || 'Open', schemaId)
      };
    } else if (schemaId === 'training-records') {
      const participants = Number(payload.participants) || undefined;
      const durationMinutes = Number(payload.duration_minutes) || undefined;
      payload = {
        ...payload,
        plantId: payload.plantId || DEFAULT_PLANT_ID,
        departmentId: payload.department_id,
        title: payload.topic || 'Training Session',
        trainingType: trainingTypeToApi(payload.training_type),
        scheduledDate: payload.date,
        trainerName: payload.trainer,
        maxAttendees: participants,
        participantCount: participants,
        durationMinutes,
        manhours: Number(payload.manhours) || (participants && durationMinutes ? participants * durationMinutes / 60 : undefined),
        // Use the form's status value; default to 'scheduled' (not 'completed')
        // because most manually-entered training sessions are upcoming/planned,
        // not already completed. The user can explicitly set Closed if done.
        status: statusToApi(payload.status_id ?? payload.status ?? 'Pending', schemaId),
      };
      // Manhours are server-derived from participantCount and durationMinutes.
      delete payload.manhours;
    } else if (schemaId === 'audit-management' || schemaId === 'critical-audit-plan') {
      payload = {
        ...payload,
        plantId: payload.plantId || DEFAULT_PLANT_ID,
        status: statusToApi(payload.status_id ?? payload.status ?? 'planned', schemaId),
        source: schemaId,
      };
    }

    const response = await apiClient.post(endpoint, payload, {
      headers: { 'Idempotency-Key': idempotencyKey },
    });
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
        category: categoryToApi(payload.hazard_category_id === 'Other' ? payload.hazard_category_id_other : payload.hazard_category_id),
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
        actions: normalizeIncidentActions(payload.actions),
        attachments: normalizeCollection(payload.attachments),
        status: statusToApi(payload.status_id, schemaId)
      };
    } else if (schemaId === 'training-records') {
      const participants = Number(payload.participants) || undefined;
      const durationMinutes = Number(payload.duration_minutes) || undefined;
      payload = {
        ...payload,
        departmentId: payload.department_id,
        title: payload.topic,
        trainingType: payload.training_type ? trainingTypeToApi(payload.training_type) : undefined,
        scheduledDate: payload.date,
        trainerName: payload.trainer,
        maxAttendees: participants,
        participantCount: participants,
        durationMinutes,
        manhours: Number(payload.manhours) || (participants && durationMinutes ? participants * durationMinutes / 60 : undefined),
      };
      delete payload.manhours;
    } else if (schemaId === 'audit-management' || schemaId === 'critical-audit-plan') {
      payload = {
        ...payload,
        status: payload.status_id ? statusToApi(payload.status_id, schemaId) : undefined,
        source: schemaId,
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
  },

  getEmployeeByEmpId: async (empId: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.get(`/employees/lookup/${empId}`);
    return response.data;
  }
};
