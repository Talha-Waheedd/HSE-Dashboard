import { useState, useCallback } from 'react';
import { moduleService } from '../services/api/moduleService';

export const useModuleData = (schemaId: string) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async (params?: Record<string, unknown>) => {
    if (!schemaId) return;
    setLoading(true);
    try {
      const response = await moduleService.getAll(schemaId, { page: 1, limit: schemaId === 'hazard-reporting' ? 10000 : 1000, ...(params as Record<string, unknown>) });
      if (response.success) {
        setData(Array.isArray(response.data) ? response.data : []);
        setError(null);
      } else {
        setError(response.message);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [schemaId]);

  const createRecord = async (record: any) => {
    try {
      const response = await moduleService.create(schemaId, record);
      if (response.success) {
        setData(prev => [...prev, response.data]);
        return { success: true };
      }
      return { success: false, message: response.message };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || err.message };
    }
  };

  const updateRecord = async (id: string, updates: any) => {
    try {
      const response = await moduleService.update(schemaId, id, updates);
      if (response.success) {
        setData(prev => prev.map(item => recordId(item) === id ? response.data : item));
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
        setData(prev => prev.filter(item => recordId(item) !== id));
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
      return { success: false, message: err.response?.data?.message || err.message };
    }
  };

  return {
    data,
    loading,
    error,
    fetchAll,
    createRecord,
    updateRecord,
    deleteRecord
    , updateStatus
  };
};

const recordId = (record: any) => String(
  record?.id ?? record?.hazard_id ?? record?.near_miss_id ?? record?.incident_id ??
  record?.corrective_action_id ?? record?.training_session_id ?? record?.audit_id ??
  record?.inspection_id ?? ''
);
