import { useState, useCallback } from 'react';
import { moduleService } from '../services/api/moduleService';

export const useEmployeeLookup = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookupEmployee = useCallback(async (empId: string) => {
    if (!empId || empId.trim() === '') {
      setError(null);
      return null;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await moduleService.getEmployeeByEmpId(empId);
      if (response && response.success && response.data) {
        return response.data;
      } else {
        setError('Employee not found');
        return null;
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Employee not found');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { lookupEmployee, loading, error, setError };
};
