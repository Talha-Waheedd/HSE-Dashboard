import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useAuthStore } from '@cbl/auth';

export interface Filters {
  year: string;
  auditType: string;
  department: string;
  status: string;
  fromDate: string;
  toDate: string;
}

interface FilterContextType {
  filters: Filters;
  setFilter: (key: keyof Filters, value: string) => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuthStore();
  const [filters, setFilters] = useState<Filters>({
    year: '2026',
    auditType: 'All',
    department: 'All',
    status: 'All',
    fromDate: '',
    toDate: '',
  });

  const setFilter = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <FilterContext.Provider value={{ filters, setFilter }}>
      {children}
    </FilterContext.Provider>
  );
};

export const useFilters = () => {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
};
