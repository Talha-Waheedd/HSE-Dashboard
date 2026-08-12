import { useState, useCallback, useRef } from 'react';
import { moduleService } from '../services/api/moduleService';

const apiErrorDetails = (err: any) => {
  const response = err?.response?.data;
  const statusCode = err?.response?.status;
  const requestUrl = err?.config?.baseURL && err?.config?.url ? `${err.config.baseURL}${err.config.url}` : err?.config?.url;
  const details = Array.isArray(response?.errors)
    ? response.errors.map((item: any) => item.message || item.field).filter(Boolean).join(' ')
    : '';
  if (!err?.response) return { errorType: 'network', errorTitle: 'Unable to connect to the server', message: `Unable to connect to the server. Request: ${requestUrl || 'Hazard Reporting API'}. Verify that the backend is running on port 5000.`, requestUrl, statusCode: undefined };
  const errorType = statusCode === 401 || statusCode === 403 ? 'auth' : statusCode === 400 || statusCode === 422 ? 'validation' : 'server';
  return { errorType, errorTitle: errorType === 'auth' ? 'Authentication Error' : errorType === 'validation' ? 'Validation Error' : 'Request Failed', message: details || response?.message || err?.message || 'Request failed', requestUrl, statusCode };
};

export const useModuleData = (schemaId: string) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Guard: prevents duplicate saves from double-clicks or fast retries.
  // Reset happens in createRecord's finally so it is always cleared after
  // an attempt — previously it was only reset inside updateStatus which meant
  // a standalone createRecord would permanently block future saves.
  const createInFlight = useRef(false);

  const fetchAll = useCallback(async (params?: Record<string, unknown>) => {
    if (!schemaId) return;
    setLoading(true);
    try {
      const response = await moduleService.getAll(schemaId, {
        page: 1,
        limit: schemaId === 'hazard-reporting' ? 10000 : 1000,
        ...(params as Record<string, unknown>),
      });
      if (response.success) {
        setData(Array.isArray(response.data) ? response.data : []);
        setError(null);
      } else {
        // Preserve existing data — a server-side error must not blank the table.
        setError(response.message);
      }
    } catch (err: any) {
      // Preserve existing data on network/transient errors so the UI stays
      // functional. The error banner notifies the user without erasing records.
      setError(apiErrorDetails(err).message);
    } finally {
      setLoading(false);
    }
  }, [schemaId]);

  const createRecord = async (record: any) => {
    if (createInFlight.current) {
      return { success: false, alreadyInProgress: true, message: 'A save is already in progress.' };
    }
    createInFlight.current = true;
    try {
      const response = await moduleService.create(schemaId, record);
      if (response.success) {
        // The caller refetches with its active filters after a confirmed API
        // response; do not optimistically append an unmapped/stale object.
        return { success: true, data: response.data };
      }
      return { success: false, message: response.message };
    } catch (err: any) {
      return { success: false, ...apiErrorDetails(err) };
    } finally {
      // Always release the guard — regardless of success or failure.
      createInFlight.current = false;
    }
  };

  const updateRecord = async (id: string, updates: any) => {
    try {
      const response = await moduleService.update(schemaId, id, updates);
      if (response.success) {
        setData((prev) => prev.map((item) => (recordId(item) === id ? response.data : item)));
        return { success: true };
      }
      return { success: false, message: response.message };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || err.message };
    }
  };

  const deleteRecord = async (id: string) => {
    try {
      const response = await moduleService.delete(schemaId, id);
      if (response.success) {
        setData((prev) => prev.filter((item) => recordId(item) !== id));
        return { success: true };
      }
      return { success: false, message: response.message };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || err.message };
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const response = await moduleService.updateStatus(schemaId, id, status);
      if (response.success) {
        await fetchAll();
        return { success: true };
      }
      return { success: false, message: response.message };
    } catch (err: any) {
      return { success: false, ...apiErrorDetails(err) };
    }
  };

  return {
    data,
    loading,
    error,
    fetchAll,
    createRecord,
    updateRecord,
    deleteRecord,
    updateStatus,
  };
};

const recordId = (record: any) =>
  String(
    record?.id ??
      record?.hazard_id ??
      record?.near_miss_id ??
      record?.incident_id ??
      record?.corrective_action_id ??
      record?.training_session_id ??
      record?.audit_id ??
      record?.inspection_id ??
      '',
  );
