import { useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, CheckCircle2, ClipboardCheck, RefreshCw } from 'lucide-react';
import { Layout } from '../components/Layout';
import { ContextHeader } from '../components/ContextHeader';
import { FilterBar } from '../components/FilterBar';
import { KpiTile } from '../components/KpiTile';
import { useFilters } from '../context/FilterContext';
import { moduleService } from '../services/api/moduleService';
import { dashboardClient } from '@cbl/api';

type IndicatorKind = 'hazard-closing' | 'incident-investigation' | 'emergency-drills' | 'action-plan-closure';
type Row = Record<string, any>;

const titles: Record<IndicatorKind, { title: string; subtitle: string }> = {
  'hazard-closing': { title: 'Hazard Closing', subtitle: 'Track reported hazards and their resolution status.' },
  'incident-investigation': { title: 'Incident Investigation', subtitle: 'Track investigations and actions linked to incident records.' },
  'emergency-drills': { title: 'Emergency Drills', subtitle: 'Review emergency-response training and drill records.' },
  'action-plan-closure': { title: 'Action Plan Closure Tracker', subtitle: 'Monitor corrective-action plans through completion and verification.' },
};

const dateOf = (row: Row) => String(row.date || row.incidentDate || row.scheduledDate || row.dueDate || row.createdAt || '');
const statusOf = (row: Row) => String(row.status_id || row.status || row.statusId || 'Open').toLowerCase();
const isClosed = (row: Row) => ['closed', 'close', 'resolved', 'completed', 'complete', 'verified', 'approved'].includes(statusOf(row));
const departmentOf = (row: Row) => String(row.department_id || row.departmentId || row.department?.id || row.department?.code || row.department?.name || '').toLowerCase();
const categoryOf = (row: Row) => String(row.incident_category_id || row.incidentType || row.category || '').replaceAll('_', ' ').toLowerCase();

const Panel = ({ title, children }: { title: string; children: React.ReactNode }) => <section className="overflow-hidden rounded-xl border border-[#D9E1EC] bg-white shadow-sm"><div className="flex items-center gap-2 border-b border-[#E5E7EB] bg-[#F8FAFC] px-5 py-3"><span className="h-4 w-1 rounded-full bg-[#CB0017]" /><h2 className="text-xs font-bold uppercase tracking-wider text-[#374151]">{title}</h2></div><div className="p-5">{children}</div></section>;

export const LeadingIndicatorDetails = ({ kind }: { kind: IndicatorKind }) => {
  const { filters } = useFilters();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [hazardSummary, setHazardSummary] = useState<{ total: number; closed: number } | null>(null);
  const config = titles[kind];

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const params = { limit: 10000, offset: 0, year: filters.year, department: filters.department, fromDate: filters.fromDate, toDate: filters.toDate };
        const overviewPromise = kind === 'hazard-closing'
          ? dashboardClient.getOverview({ year: filters.year, department: filters.department, fromDate: filters.fromDate, toDate: filters.toDate })
          : Promise.resolve(null);
        const response = kind === 'hazard-closing'
          ? await moduleService.getAll('hazard-reporting', params)
          : kind === 'incident-investigation'
            ? await moduleService.getAll('incident-log', params)
            : kind === 'emergency-drills'
              ? await moduleService.getAll('training-records', { ...params, trainingType: 'emergency_response' })
              : await moduleService.getAll('action-tracker', params);
        if (!cancelled) {
          setRows(response.data || []);
          if (overviewPromise) {
            const overviewResponse = await overviewPromise;
            const summary = overviewResponse?.data?.data?.summary?.hazards;
            setHazardSummary(summary ? { total: Number(summary.total || 0), closed: Number(summary.closed || 0) } : null);
          }
        }
      } catch (error) {
        console.error(`${config.title} data fetch failed`, error);
        if (!cancelled) setRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    const refresh = () => load();
    window.addEventListener('dashboard-refresh', refresh);
    const interval = window.setInterval(refresh, 30000);
    return () => { cancelled = true; window.removeEventListener('dashboard-refresh', refresh); window.clearInterval(interval); };
  }, [kind, config.title, filters.year, filters.department, filters.fromDate, filters.toDate]);

  const filteredRows = useMemo(() => rows.filter(row => {
    const date = dateOf(row);
    if (filters.department !== 'All' && filters.department && departmentOf(row) !== String(filters.department).toLowerCase()) return false;
    if (filters.year !== 'All' && filters.year && !date.startsWith(filters.year)) return false;
    if (filters.fromDate && date.slice(0, 10) < filters.fromDate) return false;
    if (filters.toDate && date.slice(0, 10) > filters.toDate) return false;
    return true;
  }), [rows, filters]);

  const total = kind === 'hazard-closing' && hazardSummary ? hazardSummary.total : filteredRows.length;
  const closed = kind === 'hazard-closing' && hazardSummary ? hazardSummary.closed : filteredRows.filter(isClosed).length;
  const pending = Math.max(0, total - closed);
  const closure = total ? Math.round((closed / total) * 100) : 0;
  const headers = kind === 'hazard-closing' ? ['Date', 'Description', 'Department', 'Risk', 'Status']
    : kind === 'incident-investigation' ? ['Date', 'Description', 'Category', 'Severity', 'Investigation / Status']
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
    {loading ? <div className="flex min-h-[300px] items-center justify-center"><RefreshCw className="h-8 w-8 animate-spin text-[#CB0017]" /></div> : <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4"><KpiTile label="Total Records" value={total} icon={<Activity />} accent="info" /><KpiTile label="Closed / Completed" value={closed} icon={<CheckCircle2 />} accent="success" /><KpiTile label="Pending / Open" value={pending} icon={<AlertTriangle />} accent={pending ? 'warning' : 'success'} /><KpiTile label="Closure Rate" value={`${closure}%`} icon={<ClipboardCheck />} accent={closure >= 80 ? 'success' : 'warning'} /></div>
      <Panel title={`${config.title} — Live Backend Records`}><div className="overflow-x-auto"><table className="min-w-[850px] w-full border-collapse text-sm"><thead><tr className="bg-[#4777BE] text-white">{headers.map(header => <th key={header} className="border border-[#1F2937] px-3 py-3 text-left">{header}</th>)}</tr></thead><tbody>{filteredRows.length ? filteredRows.map((row, index) => <tr key={row.id || index} className="odd:bg-white even:bg-[#F8FAFC]">{cells(row).map((cell, cellIndex) => <td key={`${row.id || index}-${cellIndex}`} className={`border border-[#CBD5E1] px-3 py-3 ${cellIndex === headers.length - 1 ? (isClosed(row) ? 'bg-[#C6E0B4] font-semibold' : 'bg-[#F8CBAD] font-semibold') : ''}`}>{String(cell)}</td>)}</tr>) : <tr><td colSpan={headers.length} className="border border-[#CBD5E1] px-4 py-10 text-center text-[#6B7280]">No records match the selected filters.</td></tr>}</tbody></table></div></Panel>
    </>}
  </main></Layout>;
};
