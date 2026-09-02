import { useCallback, useEffect, useState } from 'react';
import { moduleService, type DepartmentOption } from '../services/api/moduleService';

export const departmentLabel = (department: DepartmentOption) => department.code || department.name;

export const useDepartments = () => {
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(true);
  const [departmentsError, setDepartmentsError] = useState('');

  const refreshDepartments = useCallback(async () => {
    setDepartmentsLoading(true);
    setDepartmentsError('');
    try {
      const response = await moduleService.getDepartments();
      setDepartments((response.data || []).filter(department => department.isActive !== false));
    } catch (error) {
      setDepartmentsError(error instanceof Error ? error.message : 'Departments could not be loaded.');
    } finally {
      setDepartmentsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshDepartments();
    window.addEventListener('departments-refresh', refreshDepartments);
    return () => window.removeEventListener('departments-refresh', refreshDepartments);
  }, [refreshDepartments]);

  return { departments, departmentsLoading, departmentsError, refreshDepartments };
};
