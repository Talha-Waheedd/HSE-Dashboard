import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

export interface Filters {
  year: string;
  auditType: string;
  department: string;
  status: string;
  month: string;
  fromDate: string;
  toDate: string;
}

interface FilterContextType {
  filters: Filters;
  setFilter: (key: keyof Filters, value: string) => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider = ({ children }: { children: ReactNode }) => {
  const [filters, setFilters] = useState<Filters>({
    year: 'All',
    auditType: 'All',
    department: 'All',
    status: 'All',
    month: 'All',
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
