import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, Plus, Search } from 'lucide-react';
import { useAuth } from '@cbl/auth';
import { Layout } from '../components/Layout';
import { ContextHeader } from '../components/ContextHeader';
import { auditService, auditStatusLabel, type AuditLog, type PageMeta } from '../services/api/auditService';
import { PaginationControls } from '../components/PaginationControls';

const PAGE_SIZE = 25;
const EMPTY_META: PageMeta = { currentPage: 1, pageSize: PAGE_SIZE, totalRecords: 0, totalPages: 1 };
const inputClass = 'h-9 rounded-md border border-[#D1D5DB] bg-white px-3 text-[13px] text-[#374151] outline-none focus:border-[#CB0017]';
const formatDate = (value?: string | null) => {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : '—';
};

const statusStyle = (status: string) => ({
  Pending: 'bg-[#FEF3C7] text-[#92400E]',
  WIP: 'bg-[#DBEAFE] text-[#1D4ED8]',
  Done: 'bg-[#D1FAE5] text-[#047857]',
}[status] || 'bg-[#F3F4F6] text-[#4B5563]');

export const AuditLogs = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const planId = searchParams.get('planId') || '';
  const [rows, setRows] = useState<AuditLog[]>([]);
  const [meta, setMeta] = useState<PageMeta>(EMPTY_META);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [year, setYear] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const requestId = useRef(0);
  const roles = [user?.role, ...(user?.roles || [])].filter(Boolean);
  const canManageAudits = roles.some(role => ['System Administrator', 'Administrator', 'HSE Manager', 'HSE Officer'].includes(String(role)));

  useEffect(() => {
    const id = ++requestId.current;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const response = await auditService.listLogs({
          page,
          limit: PAGE_SIZE,
          search: search.trim() || undefined,
          status: status || undefined,
          year: year || undefined,
          planId: planId || undefined,
          sortBy: 'scheduledDate',
          sortOrder: 'asc',
        });
        if (id !== requestId.current) return;
        setRows(response.data);
        setMeta(response.meta);
      } catch (requestError: any) {
        if (id === requestId.current) setError(requestError?.response?.data?.message || 'Unable to load Audit Logs.');
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    }, 200);
    return () => window.clearTimeout(timer);
  }, [page, planId, search, status, year]);

  return <Layout>
    <ContextHeader
      title="Audit Logs"
      breadcrumbs={['Leading Indicators', 'Audit Logs']}
      subtitle="Scheduled and manually created audits in one consolidated register"
      actions={canManageAudits ? [{
        label: 'Add Audit',
        icon: <Plus />,
        onClick: () => navigate('/audit-management/new'),
        variant: 'primary',
      }] : []}
    />
    <main className="mx-auto max-w-[1800px] space-y-4 p-5 sm:p-6">
      <section className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-3 border-b border-[#E5E7EB] bg-[#FAFAFA] p-4">
          <label className="relative min-w-64 flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
            <input aria-label="Search Audit Logs" value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} placeholder="Search area, owner, objective or auditor..." className={`${inputClass} w-full pl-9`} />
          </label>
          <select aria-label="Filter Audit Logs by year" value={year} onChange={event => { setYear(event.target.value); setPage(1); }} className={inputClass}>
            <option value="">All Years</option>
            {Array.from({ length: 6 }, (_, index) => 2025 + index).map(value => <option key={value} value={value}>{value}</option>)}
          </select>
          <select aria-label="Filter Audit Logs by status" value={status} onChange={event => { setStatus(event.target.value); setPage(1); }} className={inputClass}>
            <option value="">All Statuses</option>
            <option value="planned">Pending</option>
            <option value="in_progress">WIP</option>
            <option value="completed">Done</option>
          </select>
          {planId && <button type="button" onClick={() => navigate('/audit-management')} className="h-9 rounded-md border border-[#D1D5DB] px-3 text-[13px] font-semibold text-[#4B5563]">Clear plan filter</button>}
        </div>

        {error && <div className="m-4 rounded-md border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#991B1B]" role="alert">{error}</div>}
        <div className={`min-h-[420px] overflow-x-auto ${loading ? 'opacity-60' : ''}`}>
          <table className="w-full min-w-[1450px] border-collapse text-left">
            <thead><tr className="border-b border-[#E5E7EB] bg-white">
              {['Audit Log ID', 'Source', 'Area Name', 'Area Owner', 'Audit Objective', 'Risk Rating', 'Auditor', 'Frequency', 'Scheduled Date', 'Status', 'Actions'].map(label => <th key={label} className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">{label}</th>)}
            </tr></thead>
            <tbody className="text-[13px]">
              {!loading && rows.length === 0 && <tr><td colSpan={11} className="px-5 py-12 text-center text-[#6B7280]">No Audit Logs found.</td></tr>}
              {rows.map(row => {
                const label = auditStatusLabel(row.status);
                return <tr key={row.id} className="border-b border-[#E5E7EB] align-top hover:bg-[#FFF9F9]">
                  <td className="px-4 py-3 font-semibold text-[#111827]">{row.auditNumber || row.id.slice(0, 8)}</td>
                  <td className="px-4 py-3"><span className="whitespace-nowrap rounded bg-[#F3F4F6] px-2 py-1 text-[11px] font-semibold text-[#475569]">{row.criticalAuditPlan ? 'Critical Audit Plan' : 'Manual'}</span></td>
                  <td className="max-w-60 whitespace-pre-wrap px-4 py-3 font-semibold text-[#374151]">{row.title}</td>
                  <td className="max-w-52 whitespace-pre-wrap px-4 py-3 text-[#4B5563]">{row.areaOwner || '—'}</td>
                  <td className="max-w-72 whitespace-pre-wrap px-4 py-3 text-[#4B5563]">{row.auditObjective || row.criticalAuditPlan?.auditObjective || '—'}</td>
                  <td className="px-4 py-3">{row.riskRating || '—'}</td>
                  <td className="max-w-48 whitespace-pre-wrap px-4 py-3">{row.auditors || '—'}</td>
                  <td className="px-4 py-3">{row.frequency || '—'}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{formatDate(row.scheduledDate)}</td>
                  <td className="px-4 py-3"><span className={`rounded px-2 py-1 text-[11px] font-bold ${statusStyle(label)}`}>{label}</span></td>
                  <td className="px-4 py-3 text-right"><button type="button" onClick={() => navigate(`/audit-management/${row.id}`)} className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#CB0017] px-3 text-[12px] font-bold text-white hover:bg-[#A30012]"><Eye className="h-3.5 w-3.5" />View</button></td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
        <PaginationControls currentPage={page} totalPages={meta.totalPages} totalRecords={meta.totalRecords} pageSize={PAGE_SIZE} onPageChange={setPage} disabled={loading} itemLabel="Audit Logs" />
      </section>
    </main>
  </Layout>;
};
