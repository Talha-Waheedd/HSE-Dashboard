import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Flame, RefreshCw } from 'lucide-react';
import { apiClient } from '@cbl/api';
import { Layout } from '../components/Layout';
import { ContextHeader } from '../components/ContextHeader';
import { FilterBar } from '../components/FilterBar';
import { KpiTile } from '../components/KpiTile';
import { useFilters } from '../context/FilterContext';
import { moduleService } from '../services/api/moduleService';

type Kind = 'fire' | 'ltir' | 'trir';
type Row = Record<string, any>;
const titles: Record<Kind, string> = { fire: 'Fire', ltir: 'LTIR', trir: 'TRIR' };
const dateOf = (row: Row) => String(row.date || row.incidentDate || row.reportedAt || row.createdAt || '');
const categoryOf = (row: Row) => String(row.incident_category_id || row.incidentType || row.category || '').replaceAll('_', ' ').toLowerCase();
const field = (row: Row, names: string[]) => names.map(name => row[name]).find(value => value !== undefined && value !== null && value !== '') ?? '—';

const Panel = ({ title, children }: { title: string; children: React.ReactNode }) => <section className="overflow-hidden rounded-xl border border-[#D9E1EC] bg-white shadow-sm"><div className="flex items-center gap-2 border-b border-[#E5E7EB] bg-[#F8FAFC] px-5 py-3"><span className="h-4 w-1 rounded-full bg-[#CB0017]" /><h2 className="text-xs font-bold uppercase tracking-wider text-[#374151]">{title}</h2></div><div className="p-5">{children}</div></section>;

export const LaggingIndicatorDetails = ({ kind }: { kind: Kind }) => {
  const { filters } = useFilters();
  const [incidents, setIncidents] = useState<Row[]>([]);
  const [workers, setWorkers] = useState('0');
  const [workingDays, setWorkingDays] = useState('365');
  const [workingHours, setWorkingHours] = useState('8');
  const [calculatedRate, setCalculatedRate] = useState<number | null>(null);
  const [calculationError, setCalculationError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [incidentResponse, employeeResponse] = await Promise.all([
          moduleService.getAll('incident-log', { limit: 10000, offset: 0, department: filters.department }),
          apiClient.get('/employees', { params: { limit: 10000, offset: 0 } }),
        ]);
        const employeePayload = employeeResponse.data;
        const employeeRows = Array.isArray(employeePayload?.data) ? employeePayload.data : employeePayload?.data?.rows || [];
        if (!cancelled) { setIncidents(incidentResponse.data || []); if (employeeRows.length) setWorkers(String(employeeRows.length)); }
      } catch (error) {
        console.error(`${titles[kind]} data fetch failed`, error);
        if (!cancelled) { setIncidents([]); setWorkers('0'); }
      } finally { if (!cancelled) setLoading(false); }
    };
    load();
    const refresh = () => load();
    window.addEventListener('dashboard-refresh', refresh);
    const interval = window.setInterval(refresh, 30000);
    return () => { cancelled = true; window.removeEventListener('dashboard-refresh', refresh); window.clearInterval(interval); };
  }, [kind, filters.department]);

  const filteredIncidents = useMemo(() => incidents.filter(row => {
    const date = dateOf(row);
    if (filters.year !== 'All' && filters.year && !date.startsWith(filters.year)) return false;
    if (filters.fromDate && date.slice(0, 10) < filters.fromDate) return false;
    if (filters.toDate && date.slice(0, 10) > filters.toDate) return false;
    return true;
  }), [incidents, filters]);
  const fireRows = filteredIncidents.filter(row => categoryOf(row).includes('fire'));
  const injuryRows = filteredIncidents.filter(row => ['lti', 'lost time', 'restricted', 'rwc', 'medical treatment', 'mtc'].some(value => categoryOf(row).includes(value)));
  const ltiRows = filteredIncidents.filter(row => categoryOf(row).includes('lti') || categoryOf(row).includes('lost time'));
  const formulaInjuries = kind === 'ltir' ? ltiRows.length : injuryRows.length;
  const calculateRate = () => {
    const workerCount = Number(workers);
    const dayCount = Number(workingDays);
    const hourCount = Number(workingHours);
    if (!Number.isFinite(workerCount) || !Number.isFinite(dayCount) || !Number.isFinite(hourCount) || workers.trim() === '' || workingDays.trim() === '' || workingHours.trim() === '') {
      setCalculationError('Enter valid numeric values for workers, working days, and daily working hours.');
      setCalculatedRate(null);
      return;
    }
    if (workerCount <= 0 || dayCount <= 0 || hourCount <= 0) {
      setCalculationError('Workers, working days, and daily working hours must all be greater than zero.');
      setCalculatedRate(null);
      return;
    }
    setCalculationError('');
    setCalculatedRate((formulaInjuries * 200000) / (workerCount * dayCount * hourCount));
  };

  return <Layout><ContextHeader title={`${titles[kind]}${kind !== 'fire' ? ' — Rate Calculation' : ' Incidents'}`} breadcrumbs={['Lagging Indicators', titles[kind]]} subtitle={kind === 'fire' ? 'Fire-related incidents from the incident database.' : 'Automatically calculated from live incident and workforce records.'}><FilterBar /></ContextHeader><main className="mx-auto max-w-[1500px] space-y-6 p-4 sm:p-6">
    {loading ? <div className="flex min-h-[300px] items-center justify-center"><RefreshCw className="h-8 w-8 animate-spin text-[#CB0017]" /></div> : kind === 'fire' ? <><div className="grid grid-cols-2 gap-4 lg:grid-cols-3"><KpiTile label="Total Fire Incidents" value={fireRows.length} icon={<Flame />} accent={fireRows.length ? 'danger' : 'success'} /><KpiTile label="Major Fire" value={fireRows.filter(row => categoryOf(row).includes('major')).length} icon={<AlertTriangle />} accent="warning" /><KpiTile label="Minor Fire" value={fireRows.filter(row => categoryOf(row).includes('minor')).length} icon={<Flame />} accent="info" /></div><Panel title="Fire Incidents — Live Records"><IncidentTable rows={fireRows} /></Panel></> : <><Panel title={`${titles[kind]} Formula`}><div className="rounded-lg bg-[#F8FAFC] p-5 text-center text-lg font-semibold text-[#1F2937]">{titles[kind]} = (Total Injuries × 200,000) ÷ (Total Workers × Working Days × Daily Working Hours)</div><div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">{[['Total Injuries', String(formulaInjuries), false], ['Total Workers', workers, true], ['Working Days', workingDays, true], ['Daily Working Hours', workingHours, true]].map(([label, value, editable]) => <label key={String(label)} className="text-sm font-semibold text-[#374151]">{label}{label === 'Total Injuries' && <span className="ml-1 text-xs font-normal text-[#64748B]">(from backend)</span>}<input type="number" min="0" value={String(value)} readOnly={!editable} onChange={event => editable && (label === 'Total Workers' ? setWorkers(event.target.value) : label === 'Working Days' ? setWorkingDays(event.target.value) : setWorkingHours(event.target.value))} className={`mt-1 w-full rounded-md border px-3 py-2 text-base ${editable ? 'border-[#CBD5E1]' : 'border-[#94A3B8] bg-[#F1F5F9]'}`} /></label>)}</div><div className="mt-5 flex flex-col items-center gap-3"><button type="button" onClick={calculateRate} className="rounded-md bg-[#CB0017] px-8 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#A80013]">Calculate {titles[kind]}</button>{calculationError && <p role="alert" className="text-sm font-semibold text-[#B91C1C]">{calculationError}</p>}</div><div className="mt-5 rounded-xl border-2 border-[#CB0017] p-5 text-center"><p className="text-sm font-semibold uppercase tracking-wide text-[#64748B]">Calculated {titles[kind]}</p><p className="mt-1 text-4xl font-bold text-[#CB0017]">{calculatedRate === null ? '—' : calculatedRate.toFixed(2)}</p>{calculatedRate === null && !calculationError && <p className="mt-2 text-xs text-[#64748B]">Enter valid inputs, then click Calculate.</p>}</div></Panel><Panel title="Included Injury Records"><IncidentTable rows={kind === 'ltir' ? ltiRows : injuryRows} /></Panel></>}
  </main></Layout>;
};

const IncidentTable = ({ rows }: { rows: Row[] }) => <div className="overflow-x-auto"><table className="min-w-[720px] w-full border-collapse text-sm"><thead><tr className="bg-[#4777BE] text-white">{['Date', 'Description', 'Category', 'Severity', 'Department'].map(header => <th key={header} className="border border-[#1F2937] px-3 py-3 text-left">{header}</th>)}</tr></thead><tbody>{rows.length ? rows.map((row, index) => <tr key={row.id || index} className="odd:bg-white even:bg-[#F8FAFC]"><td className="border border-[#CBD5E1] px-3 py-3">{dateOf(row)}</td><td className="border border-[#CBD5E1] px-3 py-3">{field(row, ['description', 'title'])}</td><td className="border border-[#CBD5E1] px-3 py-3">{categoryOf(row) || 'General'}</td><td className="border border-[#CBD5E1] px-3 py-3">{field(row, ['risk_rating_id', 'severityLevel', 'severity'])}</td><td className="border border-[#CBD5E1] px-3 py-3">{field(row, ['department_id', 'departmentId', 'department'])}</td></tr>) : <tr><td colSpan={5} className="border border-[#CBD5E1] px-4 py-10 text-center text-[#6B7280]">No records match the selected filters.</td></tr>}</tbody></table></div>;
