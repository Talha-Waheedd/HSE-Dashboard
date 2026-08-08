import React, { useState } from 'react';
import { Building2, CalendarDays, CheckCircle2, ChevronDown, ChevronUp, Filter, RotateCcw } from 'lucide-react';
import { useFilters } from '../context/FilterContext';
import { usePermissions } from '@cbl/auth';
import { DEPARTMENTS } from '../config/constants';

interface FilterBarProps {
  showDepartment?: boolean;
  showStatus?: boolean;
  showYear?: boolean;
  showDateRange?: boolean;
  className?: string;
  variant?: 'default' | 'incident';
}

const selectClass =
  'h-8 text-[12px] border border-[#E0E0E0] rounded-md bg-white text-[#1C1C1E] px-2 pr-6 ' +
  'focus:outline-none focus:border-[#7B1010] focus:ring-1 focus:ring-[#7B1010]/20 appearance-none cursor-pointer';

const incidentFieldClass =
  'h-[60px] w-full appearance-none rounded-xl border border-[#D9DDE4] bg-white px-10 text-[14px] text-[#1C1C1E] shadow-[0_1px_2px_rgba(0,0,0,0.02)] ' +
  'focus:border-[#7B1010] focus:outline-none focus:ring-2 focus:ring-[#7B1010]/10 cursor-pointer';

export const FilterBar: React.FC<FilterBarProps> = ({
  showDepartment = true,
  showStatus = true,
  showYear = true,
  showDateRange = true,
  className = '',
  variant = 'default',
}) => {
  const { filters, setFilter } = useFilters();
  const { isDepartmentRestricted } = usePermissions();
  const isRestricted = isDepartmentRestricted();
  const [collapsed, setCollapsed] = useState(false);
  const isIncident = variant === 'incident';

  const hasActiveFilters =
    (filters.department !== '' && filters.department !== 'All') ||
    (filters.status !== '' && filters.status !== 'All') ||
    (filters.year !== '' && filters.year !== '2026') ||
    filters.fromDate !== '' ||
    filters.toDate !== '';

  const clearFilters = () => {
    setFilter('department', 'All');
    setFilter('status', 'All');
    setFilter('year', '2026');
    setFilter('fromDate', '');
    setFilter('toDate', '');
  };

  if (isIncident) {
    return (
      <section className={`overflow-hidden rounded-xl border border-[#E3E5E9] bg-white shadow-[0_2px_8px_rgba(28,24,30,0.06)] ${className}`}>
        <div className="flex items-center justify-between gap-4 border-b border-[#ECEEF1] px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-[#F7EEF1] text-[#7B1010]">
              <Filter className="h-8 w-8" strokeWidth={1.8} />
            </div>
            <div className="min-w-0">
              <h2 className="text-[23px] font-bold tracking-tight text-[#241416]">Filters</h2>
              <p className="mt-0.5 truncate text-[14px] text-[#697386]">Refine your results using the filters below</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <button type="button" onClick={clearFilters} className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#7B1010] hover:text-[#5E0C0C]">
              <RotateCcw className="h-4 w-4" />
              <span className="hidden sm:inline">Reset All</span>
            </button>
            <span className="hidden h-7 w-px bg-[#E5E7EB] sm:block" />
            <button type="button" onClick={() => setCollapsed(value => !value)} className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#D9DDE4] px-3 text-[12px] font-semibold text-[#4B5563] hover:border-[#B8A5A8] hover:bg-[#FFF9F9]">
              <span className="hidden sm:inline">{collapsed ? 'Expand' : 'Collapse'}</span>
              {collapsed ? <ChevronDown className="h-4 w-4 text-[#7B1010]" /> : <ChevronUp className="h-4 w-4 text-[#7B1010]" />}
            </button>
          </div>
        </div>

        {!collapsed && (
          <div className="grid grid-cols-1 gap-4 px-5 py-5 sm:grid-cols-2 lg:grid-cols-4 sm:px-6">
            {showYear && (
              <label className="block">
                <span className="mb-2 block text-[12px] font-medium text-[#1C1C1E]">Year</span>
                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#7B1010]" />
                  <select value={filters.year} onChange={e => setFilter('year', e.target.value)} className={incidentFieldClass}>
                    <option value="All">All Years</option>
                    <option value="2024">2024</option>
                    <option value="2025">2025</option>
                    <option value="2026">2026</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7B1010]" />
                </div>
              </label>
            )}

            {showDepartment && (
              <label className="block">
                <span className="mb-2 block text-[12px] font-medium text-[#1C1C1E]">Department</span>
                <div className="relative">
                  <Building2 className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#7B1010]" />
                  <select value={filters.department} onChange={e => setFilter('department', e.target.value)} disabled={isRestricted} className={`${incidentFieldClass} ${isRestricted ? 'cursor-not-allowed opacity-60' : ''}`}>
                    <option value="All">All Departments</option>
                    {DEPARTMENTS.map(department => <option key={department} value={department}>{department}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7B1010]" />
                </div>
              </label>
            )}

            {showStatus && (
              <label className="block">
                <span className="mb-2 block text-[12px] font-medium text-[#1C1C1E]">Status</span>
                <div className="relative">
                  <CheckCircle2 className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#7B1010]" />
                  <select value={filters.status} onChange={e => setFilter('status', e.target.value)} className={incidentFieldClass}>
                    <option value="All">All Statuses</option>
                    <option value="Open">Open</option>
                    <option value="Work in Progress">In Progress</option>
                    <option value="Pending">Pending</option>
                    <option value="Closed">Closed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7B1010]" />
                </div>
              </label>
            )}

            {showDateRange && (
              <div>
                <span className="mb-2 block text-[12px] font-medium text-[#1C1C1E]">Date Range</span>
                <div className="flex items-center gap-2">
                  <div className="relative min-w-0 flex-1">
                    <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#7B1010]" />
                    <input type="date" aria-label="From date" value={filters.fromDate} onChange={e => setFilter('fromDate', e.target.value)} className={`${incidentFieldClass} px-10 text-[12px]`} />
                  </div>
                  <span className="text-[18px] text-[#4B5563]">–</span>
                  <div className="relative min-w-0 flex-1">
                    <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#7B1010]" />
                    <input type="date" aria-label="To date" value={filters.toDate} onChange={e => setFilter('toDate', e.target.value)} className={`${incidentFieldClass} px-10 text-[12px]`} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    );
  }

  return (
    <div className={`flex items-center flex-wrap gap-2 ${className}`}>
      <span className="flex items-center gap-1.5 text-[12px] font-medium text-[#6B7280] shrink-0 select-none">
        <Filter className="h-3.5 w-3.5" /> Filter:
      </span>
      {showYear && (
        <select value={filters.year} onChange={e => setFilter('year', e.target.value)} className={selectClass}>
          <option value="All">All Years</option><option value="2024">2024</option><option value="2025">2025</option><option value="2026">2026</option>
        </select>
      )}
      {showDepartment && (
        <select value={filters.department} onChange={e => setFilter('department', e.target.value)} disabled={isRestricted} className={`${selectClass} ${isRestricted ? 'opacity-60 cursor-not-allowed' : ''}`}>
          <option value="All">All Departments</option>{DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      )}
      {showStatus && (
        <select value={filters.status} onChange={e => setFilter('status', e.target.value)} className={selectClass}>
          <option value="All">All Statuses</option><option value="Open">Open</option><option value="Work in Progress">In Progress</option><option value="Pending">Pending</option><option value="Closed">Closed</option><option value="Cancelled">Cancelled</option>
        </select>
      )}
      {showDateRange && <><input type="date" value={filters.fromDate} onChange={e => setFilter('fromDate', e.target.value)} className="h-8 rounded-md border border-[#E0E0E0] bg-white px-2 text-[12px] text-[#1C1C1E] focus:border-[#7B1010] focus:outline-none" /><span className="text-[12px] text-[#9CA3AF]">–</span><input type="date" value={filters.toDate} onChange={e => setFilter('toDate', e.target.value)} className="h-8 rounded-md border border-[#E0E0E0] bg-white px-2 text-[12px] text-[#1C1C1E] focus:border-[#7B1010] focus:outline-none" /></>}
      {hasActiveFilters && <button type="button" onClick={clearFilters} className="flex h-8 items-center gap-1 rounded-md border border-[#7B1010]/30 px-2 text-[12px] font-medium text-[#7B1010] hover:bg-[rgba(123,16,16,0.04)]"><RotateCcw className="h-3 w-3" /> Clear</button>}
    </div>
  );
};

export default FilterBar;
