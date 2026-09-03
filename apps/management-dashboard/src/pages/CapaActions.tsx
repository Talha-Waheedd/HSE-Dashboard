import { useEffect, useRef, useState } from 'react';
import { Download, Eye, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { ContextHeader } from '../components/ContextHeader';
import { PaginationControls } from '../components/PaginationControls';
import { departmentLabel, useDepartments } from '../hooks/useDepartments';
import {
  CAPA_INCIDENT_CATEGORIES,
  CAPA_SOURCE_OPTIONS,
  capaService,
  capaSourceLabel,
  capaStatusLabel,
  type CapaAction,
  type CapaPageMeta,
} from '../services/api/capaService';

const PAGE_SIZE = 25;
const EMPTY_META: CapaPageMeta = { currentPage: 1, pageSize: PAGE_SIZE, totalRecords: 0, totalPages: 1 };
const inputClass = 'h-9 rounded-md border border-[#D1D5DB] bg-white px-3 text-[13px] text-[#374151] outline-none focus:border-[#CB0017] focus:ring-2 focus:ring-[#CB0017]/10';
const dateLabel = (value?: string | null) => {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : '—';
};
const statusClass = (status: string) => ({
  Open: 'bg-[#FEF3C7] text-[#92400E]',
  'In Progress': 'bg-[#DBEAFE] text-[#1D4ED8]',
  Closed: 'bg-[#D1FAE5] text-[#047857]',
}[status] || 'bg-[#F3F4F6] text-[#4B5563]');
const priorityClass = (priority?: string | null) => ({
  low: 'bg-[#ECFDF5] text-[#047857]',
  medium: 'bg-[#FEF3C7] text-[#92400E]',
  high: 'bg-[#FFEDD5] text-[#C2410C]',
  critical: 'bg-[#FEE2E2] text-[#B91C1C]',
}[String(priority || '').toLowerCase()] || 'bg-[#F3F4F6] text-[#6B7280]');

export const CapaActions = () => {
  const navigate = useNavigate();
  const { departments } = useDepartments();
  const requestId = useRef(0);
  const [rows, setRows] = useState<CapaAction[]>([]);
  const [meta, setMeta] = useState<CapaPageMeta>(EMPTY_META);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [source, setSource] = useState('');
  const [category, setCategory] = useState('');
  const [department, setDepartment] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const id = ++requestId.current;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const response = await capaService.list({
          search: search.trim() || undefined,
          source: source || undefined,
          incidentCategory: category || undefined,
          responsibleDepartment: department || undefined,
          status: status || undefined,
          priority: priority || undefined,
          fromDate: fromDate || undefined,
          toDate: toDate || undefined,
          page,
          limit: PAGE_SIZE,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        });
        if (id !== requestId.current) return;
        setRows(response.data);
        setMeta(response.meta);
      } catch (requestError: any) {
        if (id === requestId.current) setError(requestError?.response?.data?.message || 'Unable to load CAPA Actions.');
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    }, 180);
    return () => window.clearTimeout(timer);
  }, [page, search, source, category, department, status, priority, fromDate, toDate]);

  const resetPage = (setter: (value: string) => void) => (value: string) => { setter(value); setPage(1); };
  const exportCsv = async () => {
    setExporting(true); setError('');
    try {
      const blob = await capaService.export({
        search: search.trim() || undefined,
        source: source || undefined,
        incidentCategory: category || undefined,
        responsibleDepartment: department || undefined,
        status: status || undefined,
        priority: priority || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `capa-actions-${new Date().toISOString().slice(0, 10)}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Unable to export CAPA Actions.');
    } finally {
      setExporting(false);
    }
  };

  return <Layout>
    <ContextHeader
      title="CAPA / Actions"
      breadcrumbs={['Compliance', 'CAPA / Actions']}
      subtitle="Consolidated action register linked to HSE source records"
      actions={[{ label: exporting ? 'Exporting...' : 'Export CSV', icon: <Download />, onClick: exportCsv, variant: 'outlined', disabled: exporting }]}
    />
    <main className="mx-auto max-w-[1900px] space-y-4 p-5 sm:p-6">
      <section className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-sm">
        <div className="border-b border-[#E5E7EB] bg-[#FAFAFA] p-4">
          <div className="flex flex-wrap items-end gap-3">
            <label className="min-w-64 flex-1 max-w-md"><span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">Search</span><span className="relative block"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" /><input aria-label="Search CAPA Actions" value={search} onChange={event => resetPage(setSearch)(event.target.value)} placeholder="CAPA ID, source, action or responsibility..." className={`${inputClass} w-full pl-9`} /></span></label>
            <label><span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">Source</span><select aria-label="Source" value={source} onChange={event => resetPage(setSource)(event.target.value)} className={inputClass}><option value="">All Sources</option>{CAPA_SOURCE_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
            <label><span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">Incident Category</span><select aria-label="Incident Category" value={category} onChange={event => resetPage(setCategory)(event.target.value)} className={inputClass}><option value="">All Categories</option>{CAPA_INCIDENT_CATEGORIES.map(option => <option key={option} value={option}>{option}</option>)}</select></label>
            <label><span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">Responsible Department</span><select aria-label="Responsible Department" value={department} onChange={event => resetPage(setDepartment)(event.target.value)} className={inputClass}><option value="">All Departments</option>{departments.map(option => <option key={option.id} value={option.id}>{departmentLabel(option)}</option>)}</select></label>
            <label><span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">Status</span><select aria-label="Status" value={status} onChange={event => resetPage(setStatus)(event.target.value)} className={inputClass}><option value="">All Statuses</option><option value="open">Open</option><option value="in_progress">In Progress</option><option value="closed">Closed</option></select></label>
            <label><span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">Risk / Priority</span><select aria-label="Risk or Priority" value={priority} onChange={event => resetPage(setPriority)(event.target.value)} className={inputClass}><option value="">All Priorities</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select></label>
            <label><span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">From Date</span><input aria-label="From Date" type="date" value={fromDate} onChange={event => resetPage(setFromDate)(event.target.value)} className={inputClass} /></label>
            <label><span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">To Date</span><input aria-label="To Date" type="date" value={toDate} onChange={event => resetPage(setToDate)(event.target.value)} className={inputClass} /></label>
          </div>
        </div>

        {error && <div className="m-4 rounded-md border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#991B1B]" role="alert">{error}</div>}
        <div className={`min-h-[430px] overflow-x-auto ${loading ? 'opacity-60' : ''}`}>
          <table className="w-full min-w-[1660px] border-collapse text-left">
            <thead><tr className="border-b border-[#E5E7EB] bg-white">{['CAPA ID', 'Source', 'Source Reference', 'Incident Category', 'Action Item', 'Responsible Department', 'Responsible Person / Responsibility', 'Target Date', 'Risk / Priority', 'Status', 'Actions'].map(label => <th key={label} className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">{label}</th>)}</tr></thead>
            <tbody className="text-[13px]">
              {!loading && rows.length === 0 && <tr><td colSpan={11} className="px-5 py-14 text-center text-[#6B7280]">No CAPA Actions match the selected filters.</td></tr>}
              {rows.map(row => {
                const statusLabel = capaStatusLabel(row.status);
                return <tr key={row.id} className="border-b border-[#E5E7EB] align-top hover:bg-[#FFF9F9]">
                  <td className="whitespace-nowrap px-4 py-3 font-bold text-[#2C1810]">{row.capaNumber}</td>
                  <td className="px-4 py-3 font-medium text-[#374151]">{capaSourceLabel(row.sourceType)}</td>
                  <td className="px-4 py-3 text-[#4B5563]">{row.sourceReference || '—'}</td>
                  <td className="px-4 py-3"><span className="rounded bg-[#F3F4F6] px-2 py-1 text-[11px] font-semibold text-[#374151]">{row.incidentCategory || '—'}</span></td>
                  <td className="max-w-[380px] whitespace-pre-wrap px-4 py-3 leading-5 text-[#374151]">{row.description}</td>
                  <td className="px-4 py-3">{row.responsibleDepartment?.code || row.responsibleDepartment?.name || '—'}</td>
                  <td className="max-w-56 whitespace-pre-wrap px-4 py-3">{row.responsibility || '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3">{dateLabel(row.dueDate)}</td>
                  <td className="px-4 py-3">{row.priority ? <span className={`rounded px-2 py-1 text-[11px] font-bold uppercase ${priorityClass(row.priority)}`}>{row.priority}</span> : '—'}</td>
                  <td className="px-4 py-3"><span className={`whitespace-nowrap rounded px-2 py-1 text-[11px] font-bold ${statusClass(statusLabel)}`}>{statusLabel}</span></td>
                  <td className="px-4 py-3 text-right"><button type="button" onClick={() => navigate(`/action-tracker/${row.id}`)} className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#CB0017] px-3 text-[12px] font-bold text-white hover:bg-[#A30012]"><Eye className="h-3.5 w-3.5" />View</button></td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
        <PaginationControls currentPage={page} totalPages={meta.totalPages} totalRecords={meta.totalRecords} pageSize={PAGE_SIZE} onPageChange={setPage} disabled={loading} itemLabel="CAPA Actions" />
      </section>
    </main>
  </Layout>;
};

export default CapaActions;
