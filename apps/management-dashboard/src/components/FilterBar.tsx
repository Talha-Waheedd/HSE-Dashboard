import React from 'react';
import { Filter, RotateCcw } from 'lucide-react';
import { useFilters } from '../context/FilterContext';
import { usePermissions, useAuth } from '@cbl/auth';
import { DEPARTMENTS } from '../config/constants';

// ============================================================
// FilterBar — Page-level filter controls
// Moved from shell header to page content area (SAP pattern)
// Reads/writes from the shared FilterContext
// ============================================================

interface FilterBarProps {
  showDepartment?: boolean;
  showStatus?:     boolean;
  showYear?:       boolean;
  showDateRange?:  boolean;
  className?:      string;
}

const selectClass =
  'h-8 text-[12px] border border-[#E0E0E0] rounded-md bg-white text-[#1C1C1E] px-2 pr-6 ' +
  'focus:outline-none focus:border-[#7B1010] focus:ring-1 focus:ring-[#7B1010]/20 ' +
  'appearance-none cursor-pointer';

export const FilterBar: React.FC<FilterBarProps> = ({
  showDepartment = true,
  showStatus     = true,
  showYear       = true,
  showDateRange  = true,
  className      = '',
}) => {
  const { filters, setFilter } = useFilters();
  const { isDepartmentRestricted } = usePermissions();
  const isRestricted = isDepartmentRestricted();

  const { user } = useAuth();
  const initialDept = 'All';

  const hasActiveFilters =
    (filters.department !== '' && filters.department !== 'All') ||
    (filters.status     !== '' && filters.status     !== 'All') ||
    (filters.year       !== '' && filters.year       !== '2026') ||
    filters.fromDate !== '' ||
    filters.toDate   !== '';

  const clearFilters = () => {
    setFilter('department', 'All');
    setFilter('status',     'All');
    setFilter('year',       '2026');
    setFilter('fromDate',   '');
    setFilter('toDate',     '');
  };

  return (
    <div className={`flex items-center flex-wrap gap-2 ${className}`}>
      <span className="flex items-center gap-1.5 text-[12px] font-medium text-[#6B7280] shrink-0 select-none">
        <Filter className="h-3.5 w-3.5" />
        Filter:
      </span>

      {showYear && (
        <div className="relative">
          <select
            value={filters.year}
            onChange={e => setFilter('year', e.target.value)}
            className={selectClass}
          >
            <option value="All">All Years</option>
            <option value="2024">2024</option>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
          </select>
        </div>
      )}

      {showDepartment && (
        <div className="relative">
          <select
            value={filters.department}
            onChange={e => setFilter('department', e.target.value)}
            disabled={isRestricted}
            className={`${selectClass} ${isRestricted ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <option value="All">All Departments</option>
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      )}

      {showStatus && (
        <div className="relative">
          <select
            value={filters.status}
            onChange={e => setFilter('status', e.target.value)}
            className={selectClass}
          >
            <option value="All">All Statuses</option>
            <option value="Open">Open</option>
            <option value="Work in Progress">In Progress</option>
            <option value="Pending">Pending</option>
            <option value="Closed">Closed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      )}

      {showDateRange && (
        <>
          <input
            type="date"
            value={filters.fromDate}
            onChange={e => setFilter('fromDate', e.target.value)}
            className="h-8 text-[12px] border border-[#E0E0E0] rounded-md bg-white text-[#1C1C1E] px-2 focus:outline-none focus:border-[#7B1010] focus:ring-1 focus:ring-[#7B1010]/20"
          />
          <span className="text-[12px] text-[#9CA3AF]">–</span>
          <input
            type="date"
            value={filters.toDate}
            onChange={e => setFilter('toDate', e.target.value)}
            className="h-8 text-[12px] border border-[#E0E0E0] rounded-md bg-white text-[#1C1C1E] px-2 focus:outline-none focus:border-[#7B1010] focus:ring-1 focus:ring-[#7B1010]/20"
          />
        </>
      )}

      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="flex items-center gap-1 h-8 px-2 text-[12px] font-medium text-[#7B1010] border border-[#7B1010]/30 rounded-md hover:bg-[rgba(123,16,16,0.04)] transition-colors"
          title="Clear all filters"
        >
          <RotateCcw className="h-3 w-3" />
          Clear
        </button>
      )}
    </div>
  );
};

export default FilterBar;
