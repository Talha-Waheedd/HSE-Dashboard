import { useEffect, useMemo, useRef, useState } from 'react';
import { Activity, AlertTriangle, CheckCircle2, ClipboardCheck, Eye, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { ContextHeader } from '../components/ContextHeader';
import { FilterBar } from '../components/FilterBar';
import { KpiTile } from '../components/KpiTile';
import { useFilters } from '../context/FilterContext';
import { moduleService } from '../services/api/moduleService';
import { dashboardClient } from '@cbl/api';
import { formatDateOnly } from '../utils/dateFormat';
import { PaginationControls } from '../components/PaginationControls';

type IndicatorKind = 'hazard-closing' | 'incident-investigation' | 'emergency-drills' | 'action-plan-closure';
type Row = Record<string, any>;

const titles: Record<IndicatorKind, { title: string; subtitle: string }> = {
  'hazard-closing': { title: 'Hazard Closing', subtitle: 'Track reported hazards and their resolution status.' },
  'incident-investigation': { title: 'Incident Investigation', subtitle: 'Track investigations and actions linked to incident records.' },
  'emergency-drills': { title: 'Emergency Drills', subtitle: 'Review emergency-response training and drill records.' },
  'action-plan-closure': { title: 'Action Plan Closure Tracker', subtitle: 'Monitor corrective-action plans through completion and verification.' },
};

const PAGE_SIZE = 25;
const rawDateOf = (row: Row) => row.date || row.incidentDate || row.incident_date || row.scheduledDate || row.scheduled_date || row.dueDate || row.due_date || row.createdAt || row.created_at;
const dateOf = (row: Row) => formatDateOnly(rawDateOf(row));
const statusOf = (row: Row) => String(row.status_id || row.status || row.statusId || 'Open').toLowerCase();
const isClosed = (row: Row) => ['closed', 'close', 'resolved', 'completed', 'complete', 'verified', 'approved'].includes(statusOf(row));
const categoryOf = (row: Row) => String(row.incident_category_id || row.incidentType || row.category || '').replaceAll('_', ' ').toLowerCase();
const errorMessageOf = (error: unknown, fallback: string) => {
  const response = (error as any)?.response?.data;
  return response?.message || response?.error || (error instanceof Error ? error.message : fallback);
};

const Panel = ({ title, children }: { title: string; children: React.ReactNode }) => <section className="overflow-hidden rounded-xl border border-[#D9E1EC] bg-white shadow-sm"><div className="flex items-center gap-2 border-b border-[#E5E7EB] bg-[#F8FAFC] px-5 py-3"><span className="h-4 w-1 rounded-full bg-[#CB0017]" /><h2 className="text-xs font-bold uppercase tracking-wider text-[#374151]">{title}</h2></div><div className="p-5">{children}</div></section>;

export const LeadingIndicatorDetails = ({ kind }: { kind: IndicatorKind }) => {
  const { filters } = useFilters();
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<{ total: number; closed: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ totalRecords: 0, totalPages: 1, pageSize: PAGE_SIZE });
  const requestSequence = useRef(0);
  const previousFilterKey = useRef<string | null>(null);
  const config = titles[kind];

  useEffect(() => {
    const filterKey = [kind, filters.year, filters.department, filters.status, filters.fromDate, filters.toDate].join('|');
    const filterChanged = previousFilterKey.current !== filterKey;
    previousFilterKey.current = filterKey;
    // Let the reset effect below move later-page views to page 1 without
    // issuing an obsolete request for the old filter/page combination.
    if (filterChanged && currentPage !== 1) return;
    const requestId = ++requestSequence.current;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setErrorMessage('');
      try {
        const filtersParams = { year: filters.year, department: filters.department, status: filters.status, fromDate: filters.fromDate, toDate: filters.toDate };
        const params = {
          page: currentPage,
          limit: PAGE_SIZE,
          ...filtersParams,
          ...(kind === 'incident-investigation' ? { investigationOnly: true } : {}),
        };
        const summaryPromise: Promise<any> = kind === 'hazard-closing'
          ? dashboardClient.getOverview(filtersParams)
          : kind === 'incident-investigation'
            ? moduleService.getIncidentSummary(params)
            : kind === 'emergency-drills'
              ? moduleService.getTrainingSummary({ ...params, trainingType: 'emergency_response' })
              : moduleService.getActionSummary(params);
        const listPromise = kind === 'hazard-closing'
          ? moduleService.getAll('hazard-reporting', params)
          : kind === 'incident-investigation'
            ? moduleService.getAll('incident-log', params)
            : kind === 'emergency-drills'
              ? moduleService.getAll('training-records', { ...params, trainingType: 'emergency_response' })
              : moduleService.getAll('action-tracker', params);
        const [response, summaryResponse] = await Promise.all([listPromise, summaryPromise]);

        if (!cancelled && requestId === requestSequence.current) {
          setRows(response.data || []);
          const meta = response.meta || {};
          setPagination({
            totalRecords: Number(meta.totalRecords ?? meta.total ?? 0),
            totalPages: Math.max(1, Number(meta.totalPages ?? 1)),
            pageSize: Number(meta.pageSize ?? meta.limit ?? PAGE_SIZE),
          });
          const summaryData = kind === 'hazard-closing'
            ? summaryResponse?.data?.data?.summary?.hazards
            : summaryResponse?.data;
          setSummary(summaryData ? {
            total: Number(summaryData.totalRecords ?? summaryData.total ?? 0),
            closed: Number(summaryData.completedRecords ?? summaryData.closed ?? 0),
          } : null);
        }
      } catch (error) {
        console.error(`${config.title} data fetch failed`, error);
        if (!cancelled && requestId === requestSequence.current) {
          setRows([]);
          setSummary(null);
          setPagination({ totalRecords: 0, totalPages: 1, pageSize: PAGE_SIZE });
          setErrorMessage(errorMessageOf(error, `Failed to load ${config.title.toLowerCase()} records.`));
        }
      } finally {
        if (!cancelled && requestId === requestSequence.current) setLoading(false);
      }
    };
    load();
    const refresh = () => load();
    window.addEventListener('dashboard-refresh', refresh);
    const interval = window.setInterval(refresh, 30000);
    return () => { cancelled = true; window.removeEventListener('dashboard-refresh', refresh); window.clearInterval(interval); };
  }, [kind, config.title, currentPage, filters.year, filters.department, filters.status, filters.fromDate, filters.toDate]);

  useEffect(() => {
    setCurrentPage(1);
  }, [kind, filters.year, filters.department, filters.status, filters.fromDate, filters.toDate]);

  // Filters are applied by the database before counting and paginating. The
  // table therefore renders only the server-returned page.
  const filteredRows = useMemo(() => rows, [rows]);
  const total = summary?.total ?? pagination.totalRecords;
  const closed = summary?.closed ?? filteredRows.filter(isClosed).length;
  const pending = Math.max(0, total - closed);
  const closure = total ? Math.round((closed / total) * 100) : 0;
  const headers = kind === 'hazard-closing' ? ['Date', 'Description', 'Department', 'Risk', 'Status']
    : kind === 'incident-investigation' ? ['Date', 'Description', 'Category', 'Severity', 'Investigation / Status', 'Actions']
      : kind === 'emergency-drills' ? ['Scheduled Date', 'Training', 'Department', 'Duration (min)', 'Status']
        : ['Due Date', 'Action', 'Source', 'Priority', 'Status'];

  const cells = (row: Row) => kind === 'hazard-closing'
    ? [dateOf(row), row.description || row.title || '—', row.department?.name || row.department_id || '—', row.risk_rating_id || row.severityLevel || row.severity || '—', row.status_id || row.status || 'Open']
    : kind === 'incident-investigation'
      ? [dateOf(row), row.description || row.title || '—', categoryOf(row) || 'General', row.risk_rating_id || row.severityLevel || row.severity || '—', row.investigationFindings || row.investigation_findings || row.status_id || row.status || 'Open']
        : kind === 'emergency-drills'
          ? [dateOf(row), row.title || row.trainingType || 'Emergency Response', row.department?.name || row.department_id || '—', row.durationMinutes || row.duration_minutes || '—', row.status || 'Scheduled']
          : [dateOf(row), row.title || row.description || '—', row.sourceType || row.source || '—', row.priority || row.severity || '—', row.status || row.status_id || 'Open'];

  return <Layout><ContextHeader title={config.title} breadcrumbs={['Leading Indicators', config.title]} subtitle={config.subtitle}><FilterBar /></ContextHeader><main className="mx-auto max-w-[1600px] space-y-6 p-4 sm:p-6">
    {loading ? <div className="flex min-h-[300px] items-center justify-center"><RefreshCw className="h-8 w-8 animate-spin text-[#CB0017]" /></div> : errorMessage ? <div className="rounded-lg border border-[#FECACA] bg-[#FEF2F2] p-5 text-sm font-semibold text-[#B91C1C]" role="alert">{errorMessage}</div> : <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4"><KpiTile label="Total Records" value={total} icon={<Activity />} accent="info" /><KpiTile label="Closed / Completed" value={closed} icon={<CheckCircle2 />} accent="success" /><KpiTile label="Pending / Open" value={pending} icon={<AlertTriangle />} accent={pending ? 'warning' : 'success'} /><KpiTile label="Closure Rate" value={`${closure}%`} icon={<ClipboardCheck />} accent={closure >= 80 ? 'success' : 'warning'} /></div>
      <Panel title={`${config.title} — Live Backend Records`}><div className="overflow-x-auto"><table className="min-w-[850px] w-full border-collapse text-sm"><thead><tr className="bg-[#4777BE] text-white">{headers.map(header => <th key={header} className="border border-[#1F2937] px-3 py-3 text-left">{header}</th>)}</tr></thead><tbody>{filteredRows.length ? filteredRows.map((row, index) => <tr key={row.id || `row-${index}`} className="odd:bg-white even:bg-[#F8FAFC]">{cells(row).map((cell, cellIndex) => <td key={`${row.id || `row-${index}`}-${cellIndex}`} className={`border border-[#CBD5E1] px-3 py-3 ${cellIndex === 0 ? 'whitespace-nowrap' : ''} ${kind !== 'incident-investigation' && cellIndex === headers.length - 1 ? (isClosed(row) ? 'bg-[#C6E0B4] font-semibold' : 'bg-[#F8CBAD] font-semibold') : ''}`}>{String(cell)}</td>)}{kind === 'incident-investigation' && <td className="border border-[#CBD5E1] px-3 py-3"><button type="button" onClick={() => navigate(`/leading-indicators/incident-investigation/${row.id}`)} className="inline-flex items-center gap-1.5 rounded-md bg-[#CB0017] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#A30012]" aria-label={`View investigation ${row.incidentNumber || row.id}`}><Eye className="h-3.5 w-3.5" />View</button></td>}</tr>) : <tr><td colSpan={headers.length} className="border border-[#CBD5E1] px-4 py-10 text-center text-[#6B7280]">No records match the selected filters.</td></tr>}</tbody></table></div></Panel>
      <PaginationControls currentPage={currentPage} totalPages={pagination.totalPages} totalRecords={pagination.totalRecords} pageSize={pagination.pageSize || PAGE_SIZE} onPageChange={setCurrentPage} disabled={loading} className="rounded-lg border border-[#E5E7EB]" />
    </>}
  </main></Layout>;
};
