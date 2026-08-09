import { useEffect, useMemo, useState } from 'react';
import { BarChart, Bar, CartesianGrid, LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Cell, Legend } from 'recharts';
import { Activity, AlertTriangle, CheckCircle2, ClipboardCheck, FileText, Flame, RefreshCw, ShieldAlert, Target, Users } from 'lucide-react';
import { Layout } from '../components/Layout';
import { ContextHeader } from '../components/ContextHeader';
import { FilterBar } from '../components/FilterBar';
import { KpiTile } from '../components/KpiTile';
import { useFilters } from '../context/FilterContext';
import { moduleService } from '../services/api/moduleService';
import { CHART_COLORS } from '../config/constants';

type RecordSet = { hazards: any[]; incidents: any[]; nearMisses: any[]; trainings: any[]; audits: any[]; inspections: any[]; capas: any[] };
type IndicatorRow = { label: string; unit: string; key: string; target?: number; remark: string; category?: string };

const emptyRecords: RecordSet = { hazards: [], incidents: [], nearMisses: [], trainings: [], audits: [], inspections: [], capas: [] };
const yearOf = (record: any) => String(record.date || record.incidentDate || record.reportedAt || record.scheduledDate || record.due_date || record.createdAt || '').slice(0, 4);
const categoryOf = (record: any) => String(record.incident_category_id || record.incidentType || record.category || '').toLowerCase().replaceAll('_', ' ').trim();
const isCategory = (record: any, values: string[]) => values.some(value => categoryOf(record) === value || categoryOf(record).includes(value));
const countCategories = (records: any[], values: string[]) => records.filter(record => isCategory(record, values)).length;

const formatValue = (value: number | string | undefined) => value === undefined || value === '' ? '—' : value;
const statusFor = (value: number, target: number | undefined, lowerIsBetter = false) => {
  if (target === undefined) return 'neutral';
  return lowerIsBetter ? (value <= target ? 'good' : 'bad') : (value >= target ? 'good' : 'bad');
};

const Panel = ({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) => (
  <section className={`overflow-hidden rounded-xl border border-[#D9E1EC] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)] ${className}`}>
    <div className="flex items-center gap-2 border-b border-[#E5E7EB] bg-[#F8FAFC] px-5 py-3">
      <span className="h-4 w-1 rounded-full bg-[#CB0017]" />
      <h2 className="text-[12px] font-bold uppercase tracking-wider text-[#374151]">{title}</h2>
    </div>
    <div className="p-5">{children}</div>
  </section>
);

const StatusMark = ({ status }: { status: string }) => (
  <span className={`inline-block h-0 w-0 border-l-[13px] border-r-[13px] border-b-[22px] border-l-transparent border-r-transparent ${status === 'good' ? 'border-b-[#16A34A]' : status === 'bad' ? 'border-b-[#EF1111]' : 'border-b-[#F59E0B]'}`} title={status === 'good' ? 'On target' : status === 'bad' ? 'Below target' : 'Watch'} />
);

export const Analytics = () => {
  const { filters } = useFilters();
  const [records, setRecords] = useState<RecordSet>(emptyRecords);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'summary' | 'pyramid'>('summary');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [hazards, incidents, nearMisses, trainings, audits, inspections, capas] = await Promise.all([
          moduleService.getAll('hazard-reporting'), moduleService.getAll('incident-log'), moduleService.getAll('near-miss'),
          moduleService.getAll('training-records'), moduleService.getAll('audit-management'), moduleService.getAll('inspection-records'), moduleService.getAll('action-tracker'),
        ]);
        if (!cancelled) setRecords({ hazards: hazards.data || [], incidents: incidents.data || [], nearMisses: nearMisses.data || [], trainings: trainings.data || [], audits: audits.data || [], inspections: inspections.data || [], capas: capas.data || [] });
      } catch (error) {
        console.error('Analytics data fetch failed', error);
        if (!cancelled) setRecords(emptyRecords);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    const refresh = () => load();
    window.addEventListener('dashboard-refresh', refresh);
    const interval = window.setInterval(refresh, 30000);
    return () => { cancelled = true; window.removeEventListener('dashboard-refresh', refresh); window.clearInterval(interval); };
  }, []);

  const applyFilters = (items: any[]) => items.filter(item => {
    const date = String(item.date || item.incidentDate || item.reportedAt || item.scheduledDate || item.due_date || item.createdAt || '');
    if (filters.department !== 'All' && filters.department && item.department_id !== filters.department && item.departmentId !== filters.department) return false;
    if (filters.year !== 'All' && filters.year && !date.startsWith(filters.year)) return false;
    if (filters.fromDate && date.slice(0, 10) < filters.fromDate) return false;
    if (filters.toDate && date.slice(0, 10) > filters.toDate) return false;
    return true;
  });

  const current = useMemo(() => ({
    hazards: applyFilters(records.hazards), incidents: applyFilters(records.incidents), nearMisses: applyFilters(records.nearMisses),
    trainings: applyFilters(records.trainings), audits: applyFilters(records.audits), inspections: applyFilters(records.inspections), capas: applyFilters(records.capas),
  }), [records, filters]);

  const metrics = useMemo(() => {
    const incidents = current.incidents;
    const hazards = current.hazards;
    const fatal = countCategories(incidents, ['fatal']);
    const lti = countCategories(incidents, ['lost time', 'lti']);
    const rwc = countCategories(incidents, ['restricted', 'rwc']);
    const mtc = countCategories(incidents, ['medical treatment', 'mtc']);
    const firstAid = countCategories(incidents, ['first aid']);
    const majorFire = countCategories(incidents, ['major fire']);
    const minorFire = countCategories(incidents, ['minor fire']);
    const closedHazards = hazards.filter(item => ['closed', 'close'].includes(String(item.status_id || '').toLowerCase())).length;
    const closure = hazards.length ? Math.round((closedHazards / hazards.length) * 100) : 0;
    const unsafeActs = hazards.filter(item => String(item.unsafe_type || item.category || '').toLowerCase().includes('unsafe act')).length;
    const incidentActions = current.capas.filter(item => String(item.source || item.module_source || '').toLowerCase().includes('incident'));
    const closedActions = incidentActions.filter(item => ['closed', 'close'].includes(String(item.status_id || '').toLowerCase())).length;
    const actionClosure = incidentActions.length ? Math.round((closedActions / incidentActions.length) * 100) : 0;
    return { fatal, lti, rwc, mtc, firstAid, majorFire, minorFire, closure, unsafeActs, actionClosure, recordable: lti + rwc + mtc + majorFire + minorFire };
  }, [current]);

  const leadingRows: IndicatorRow[] = [
    { label: 'Monthly HSE Improvement Initiatives', unit: '', key: 'initiatives', remark: 'Tracked through the relevant HSE modules.' },
    { label: 'Hazard Spotting', unit: 'No', key: 'hazards', target: 3000, remark: 'Hazard spotting activity for the selected period.' },
    { label: 'Near Miss', unit: 'No', key: 'nearMisses', target: 264, remark: 'Near-miss reporting for the selected period.' },
    { label: 'Unsafe Acts', unit: 'No', key: 'unsafeActs', target: 0, remark: 'Unsafe behaviors identified in hazard records.' },
    { label: 'Hazard Closure', unit: '%', key: 'closure', target: 100, remark: 'Closure rate for reported hazards.' },
    { label: 'HSE Training Manhours', unit: 'No', key: 'training', target: 15000, remark: 'Training sessions currently available in the backend.' },
    { label: 'HSE Inspections / Audits', unit: 'No', key: 'assurance', target: 100, remark: 'Combined audit and inspection records.' },
    { label: 'Incident Investigation Actions Closure', unit: '%', key: 'actionClosure', target: 100, remark: 'Closure rate for incident-linked CAPAs.' },
    { label: 'Emergency Drills', unit: 'No', key: 'drills', remark: 'No emergency-drill API source is currently configured.' },
    { label: 'Action Plans Closure Tracker', unit: '%', key: 'capaClosure', target: 100, remark: 'Overall CAPA closure rate.' },
    { label: 'Legal Compliance', unit: '%', key: 'legal', remark: 'No legal-compliance API source is currently configured.' },
  ];

  const valueFor = (key: string) => ({ hazards: current.hazards.length, nearMisses: current.nearMisses.length, unsafeActs: metrics.unsafeActs, closure: metrics.closure, training: current.trainings.length, assurance: current.audits.length + current.inspections.length, actionClosure: metrics.actionClosure, capaClosure: current.capas.length ? Math.round((current.capas.filter(item => ['closed', 'close'].includes(String(item.status_id || '').toLowerCase())).length / current.capas.length) * 100) : 0, initiatives: '—', drills: '—', legal: '—' }[key] ?? '—');
  const laggingRows: IndicatorRow[] = [
    { label: 'Fatal Incidents', unit: 'No', key: 'fatal', target: 0, remark: 'Zero fatalities target.' },
    { label: 'LTI', unit: 'No', key: 'lti', target: 0, remark: 'Lost-time injury count.' },
    { label: 'LTIR', unit: 'Rate', key: 'ltir', target: 0, remark: 'Calculated when organization manhours are available.' },
    { label: 'RWC / MTC', unit: 'No', key: 'rwcMtc', target: 0, remark: 'Restricted work and medical treatment cases.' },
    { label: 'TRIR', unit: 'Rate', key: 'trir', target: 0, remark: 'Calculated when organization manhours are available.' },
    { label: 'First Aid', unit: 'No', key: 'firstAid', remark: 'First-aid incident count.' },
    { label: 'Fire Incidents — Major', unit: 'No', key: 'majorFire', target: 0, remark: 'Major fire incident count.' },
    { label: 'Fire Incidents — Minor', unit: 'No', key: 'minorFire', target: 0, remark: 'Minor fire incident count.' },
  ];
  const laggingValue = (key: string) => ({ fatal: metrics.fatal, lti: metrics.lti, ltir: '—', rwcMtc: metrics.rwc + metrics.mtc, trir: '—', firstAid: metrics.firstAid, majorFire: metrics.majorFire, minorFire: metrics.minorFire }[key] ?? '—');

  const yearValue = (items: any[], key: string, year: string) => {
    const yearItems = items.filter(item => yearOf(item) === year);
    if (key === 'hazards') return yearItems.length;
    if (key === 'nearMisses') return yearItems.length;
    if (key === 'training') return yearItems.length;
    if (key === 'assurance') return yearItems.length;
    if (key === 'fatal' || key === 'lti' || key === 'firstAid' || key === 'majorFire' || key === 'minorFire') return countCategories(yearItems, key === 'fatal' ? ['fatal'] : key === 'lti' ? ['lost time', 'lti'] : key === 'firstAid' ? ['first aid'] : [key.replace('Fire', ' fire')]);
    return '—';
  };

  const trendData = useMemo(() => Array.from({ length: 6 }, (_, index) => {
    const date = new Date(); date.setMonth(date.getMonth() - (5 - index));
    const month = date.getMonth(); const year = date.getFullYear();
    const inMonth = (items: any[]) => items.filter(item => { const value = new Date(item.date || item.incidentDate || item.reportedAt || item.createdAt || ''); return value.getMonth() === month && value.getFullYear() === year; }).length;
    return { name: date.toLocaleString('default', { month: 'short' }), Hazards: inMonth(records.hazards), Incidents: inMonth(records.incidents), 'Near Misses': inMonth(records.nearMisses) };
  }), [records]);

  const incidentSummary = useMemo(() => {
    const year = filters.year === 'All' ? String(new Date().getFullYear()) : filters.year;
    const dated = [...records.incidents, ...records.nearMisses].filter(item => yearOf(item) === year);
    const latestDate = dated.reduce((latest, item) => {
      const value = String(item.date || item.incidentDate || item.reportedAt || item.createdAt || '');
      return value > latest ? value : latest;
    }, `${year}-01-01`);
    const monthIndex = Math.max(0, Math.min(11, Number(latestDate.slice(5, 7)) - 1));
    const monthName = new Date(Number(year), monthIndex, 1).toLocaleString('default', { month: 'long' });
    const inMonth = (item: any) => yearOf(item) === year && Number(String(item.date || item.incidentDate || item.reportedAt || item.createdAt || '').slice(5, 7)) - 1 === monthIndex;
    const recordable = (item: any) => isCategory(item, ['fatal', 'lost time', 'lti', 'restricted', 'rwc', 'medical treatment', 'mtc']);
    const categoryCount = (category: string[], month = false) => [...records.incidents, ...records.nearMisses].filter(item => (month ? inMonth(item) : yearOf(item) === year) && isCategory(item, category)).length;
    const monthly = Array.from({ length: monthIndex + 1 }, (_, index) => {
      const monthItems = [...records.incidents, ...records.nearMisses].filter(item => yearOf(item) === year && Number(String(item.date || item.incidentDate || item.reportedAt || item.createdAt || '').slice(5, 7)) - 1 === index);
      return {
        name: new Date(Number(year), index, 1).toLocaleString('default', { month: 'short' }),
        'First Aid Cases': monthItems.filter(item => isCategory(item, ['first aid'])).length,
        'Recordable Injuries': monthItems.filter(recordable).length,
        'Potential Incidents': monthItems.filter(item => records.nearMisses.includes(item)).length,
        'Fire Incidents': monthItems.filter(item => isCategory(item, ['fire'])).length,
      };
    });
    const ytd = {
      recordable: records.incidents.filter(item => yearOf(item) === year && recordable(item)).length,
      firstAid: categoryCount(['first aid']),
      shortCircuit: categoryCount(['short circuit', 'short-circuiting']),
      fire: categoryCount(['fire']),
      potential: records.nearMisses.filter(item => yearOf(item) === year).length,
    };
    const month = {
      recordable: [...records.incidents].filter(item => inMonth(item) && recordable(item)).length,
      firstAid: categoryCount(['first aid'], true),
      shortCircuit: categoryCount(['short circuit', 'short-circuiting'], true),
      fire: categoryCount(['fire'], true),
      potential: records.nearMisses.filter(item => inMonth(item)).length,
    };
    return { year, monthName, ytd, month, monthly };
  }, [records, filters.year]);

  const renderIncidentSummary = () => {
    const rows = [
      ['RECORDABLE INJURIES', incidentSummary.month.recordable, incidentSummary.ytd.recordable],
      ['FIRST AID CASES', incidentSummary.month.firstAid, incidentSummary.ytd.firstAid],
      ['SHORT-CIRCUITING', incidentSummary.month.shortCircuit, incidentSummary.ytd.shortCircuit],
      ['FIRE INCIDENTS', incidentSummary.month.fire, incidentSummary.ytd.fire],
      ['POTENTIAL INCIDENTS', incidentSummary.month.potential, incidentSummary.ytd.potential],
    ];
    const totalMonth = rows.reduce((sum, row) => sum + Number(row[1]), 0);
    const totalYtd = rows.reduce((sum, row) => sum + Number(row[2]), 0);
    const trirTarget = 0.14;
    const trirYtd = 0;
    return (
      <Panel title={`Summary of Incidents YTD ${incidentSummary.year} (${incidentSummary.monthName})`}>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(300px,.7fr)_minmax(600px,1.3fr)]">
          <div className="flex min-h-[300px] flex-col items-center justify-center border border-[#C7C7C7] p-4">
            <h3 className="text-center text-[16px] font-bold text-[#1F2937]">Total Recordable Injury Rate YTD<br />({incidentSummary.monthName}-{incidentSummary.year})</h3>
            <div className="mt-3 h-[190px] w-full"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={[{ name: 'Target', value: trirTarget }, { name: 'YTD TRIR', value: trirYtd }]} dataKey="value" innerRadius={0} outerRadius={78} label={({ value }) => Number(value).toFixed(2)}><Cell fill="#5B9BD5" /><Cell fill="#ED7D31" /></Pie><Legend verticalAlign="bottom" iconType="square" /></PieChart></ResponsiveContainer></div>
          </div>
          <div className="overflow-x-auto"><table className="min-w-[480px] w-full border-collapse text-[13px]"><thead><tr className="bg-[#AEBBCD] text-[25px] font-bold"><th className="border border-[#1F2937] px-3 py-2 text-left">INCIDENT</th><th className="border border-[#1F2937] px-3 py-2">{incidentSummary.monthName.slice(0, 3)}</th><th className="border border-[#1F2937] px-3 py-2">YTD</th></tr></thead><tbody>{rows.map(row => <tr key={String(row[0])}><td className="border border-[#1F2937] px-3 py-2 font-medium">{row[0]}</td><td className="border border-[#1F2937] px-3 py-2 text-center">{String(row[1]).padStart(2, '0')}</td><td className="border border-[#1F2937] px-3 py-2 text-center">{String(row[2]).padStart(2, '0')}</td></tr>)}<tr className="bg-[#C6E0B4] font-bold"><td className="border border-[#1F2937] px-3 py-2 text-right">TOTAL</td><td className="border border-[#1F2937] px-3 py-2 text-center">{totalMonth}</td><td className="border border-[#1F2937] px-3 py-2 text-center">{totalYtd}</td></tr></tbody></table></div>
        </div>
        <div className="mt-6 border border-[#C7C7C7] p-4"><h3 className="mb-3 text-center text-xl font-bold text-[#1F2937]">Significant Incidents</h3><div className="h-[320px] min-w-[620px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={incidentSummary.monthly} margin={{ top: 18, right: 16, left: 0, bottom: 0 }}><CartesianGrid vertical={false} stroke="#E5E7EB" /><XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip /><Legend /><Bar dataKey="First Aid Cases" fill="#4472C4" /><Bar dataKey="Recordable Injuries" fill="#ED7D31" /><Bar dataKey="Potential Incidents" fill="#70AD47" /><Bar dataKey="Fire Incidents" fill="#FFC000" /></BarChart></ResponsiveContainer></div></div>
      </Panel>
    );
  };

  const renderFirstAidSummary = () => {
    const firstAid = current.incidents.filter(item => isCategory(item, ['first aid']));
    const field = (item: any, keys: string[]) => keys.map(key => item[key]).find(value => value !== undefined && value !== null && value !== '') || 'Unspecified';
    const grouped = (items: any[], keys: string[]) => Object.entries(items.reduce((result, item) => { const value = String(field(item, keys)); result[value] = (result[value] || 0) + 1; return result; }, {} as Record<string, number>)).map(([name, value]) => ({ name, value: Number(value) }));
    const year = filters.year === 'All' ? String(new Date().getFullYear()) : filters.year;
    const monthly = Array.from({ length: 12 }, (_, month) => ({ name: new Date(Number(year), month, 1).toLocaleString('default', { month: 'short' }), value: firstAid.filter(item => yearOf(item) === year && Number(String(item.date || item.incidentDate || item.createdAt || '').slice(5, 7)) - 1 === month).length }));
    const departmentData = grouped(firstAid, ['department_id', 'departmentId', 'department']);
    const shiftData = grouped(firstAid, ['shift']);
    const genderData = grouped(firstAid, ['gender', 'gender_wise', 'genderWise']);
    const categoryData = grouped(firstAid, ['first_aid_category', 'injury_category', 'incident_subcategory', 'category']);
    const locationData = grouped(firstAid, ['location', 'area', 'area_manager']);
    const chart = (title: string, data: { name: string; value: number }[], color: string, height = 220) => <Panel title={title}><div style={{ height }}><ResponsiveContainer width="100%" height="100%"><BarChart data={data} margin={{ top: 18, right: 12, left: 0, bottom: 4 }}><CartesianGrid vertical={false} stroke="#E5E7EB" /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="value" fill={color} radius={[2, 2, 0, 0]} label={{ position: 'top', fill: '#111827', fontSize: 12, fontWeight: 700 }} /></BarChart></ResponsiveContainer></div></Panel>;
    return (
      <Panel title={`Summary of First Aid Cases YTD ${year} (YTD ${incidentSummary.monthName})`}>
        <div className="mb-5 inline-flex overflow-hidden rounded border border-[#7C2D12] text-[16px] font-bold"><span className="bg-[#F4B183] px-4 py-2">Total No. of First-Aid Cases</span><span className="bg-[#C65911] px-6 py-2 text-white">{firstAid.length}</span></div>
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          {chart(`First Aid Monthly Trend ${year}`, monthly, '#4472C4', 270)}
          {chart('First Aid Cases Dept Wise', departmentData, '#4472C4', 270)}
        </div>
        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {chart('Shift-wise', shiftData, '#4472C4', 190)}
          {chart('Gender Wise', genderData, '#4472C4', 190)}
          {chart('Category Wise', categoryData, '#FFC000', 190)}
          {chart('Location Wise', locationData, '#4472C4', 190)}
        </div>
      </Panel>
    );
  };

  const renderNearMissSummary = () => {
    const nearMisses = current.nearMisses;
    const field = (item: any, keys: string[]) => keys.map(key => item[key]).find(value => value !== undefined && value !== null && value !== '') || 'Unspecified';
    const grouped = (items: any[], keys: string[]) => Object.entries(items.reduce((result, item) => { const value = String(field(item, keys)); result[value] = (result[value] || 0) + 1; return result; }, {} as Record<string, number>)).map(([name, value]) => ({ name, value: Number(value) })).sort((a, b) => b.value - a.value);
    const categoryData = grouped(nearMisses, ['near_miss_category', 'incident_subcategory', 'unsafe_type', 'category', 'details']);
    const departmentData = grouped(nearMisses, ['department_id', 'departmentId', 'department']);
    const locationData = grouped(nearMisses, ['location', 'area', 'area_manager']);
    const chart = (title: string, data: { name: string; value: number }[], color: string, height = 270) => <Panel title={title}><div style={{ height }}><ResponsiveContainer width="100%" height="100%"><BarChart data={data.slice(0, 12)} margin={{ top: 20, right: 12, left: 0, bottom: 30 }}><CartesianGrid vertical={false} stroke="#E5E7EB" /><XAxis dataKey="name" interval={0} angle={data.length > 6 ? -28 : 0} textAnchor={data.length > 6 ? 'end' : 'middle'} tick={{ fontSize: 10 }} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="value" fill={color} radius={[2, 2, 0, 0]} label={{ position: 'top', fill: '#111827', fontSize: 12, fontWeight: 700 }} /></BarChart></ResponsiveContainer></div></Panel>;
    return (
      <Panel title={`Summary of Near-Miss Incidents YTD ${filters.year === 'All' ? new Date().getFullYear() : filters.year} (YTD ${incidentSummary.monthName})`}>
        <div className="mb-5 inline-flex overflow-hidden rounded border border-[#7C2D12] text-[16px] font-bold"><span className="bg-[#F4B183] px-4 py-2">Total Near-Miss Incidents</span><span className="bg-[#C65911] px-6 py-2 text-white">{nearMisses.length}</span></div>
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(560px,1.45fr)_minmax(300px,.75fr)]">
          {chart('Near-Miss Category Wise', categoryData, '#4472C4', 320)}
          <Panel title="Dept Wise Near Miss"><div className="h-[280px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={departmentData} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={88} label={({ value }) => value}><Cell fill="#4472C4" /><Cell fill="#ED7D31" /><Cell fill="#A5A5A5" /><Cell fill="#FFC000" /><Cell fill="#70AD47" /><Tooltip /><Legend verticalAlign="bottom" /></Pie></PieChart></ResponsiveContainer></div></Panel>
        </div>
        <div className="mt-5">{chart('Location Wise (Near-Miss Incidents)', locationData, '#4472C4', 310)}</div>
      </Panel>
    );
  };

  const renderHazardEliminationSummary = () => {
    const departments = [
      ['Production', ['prd', 'production']], ['Stores', ['stores', 'store']], ['Admin', ['adm', 'admin']],
      ['QC/NPD/FS', ['qc/fs/npd', 'qc', 'fs', 'npd']], ['HSE', ['hse']], ['ESD & Utilities', ['esd', 'utilities', 'maintenance']], ['Projects', ['project', 'projects']],
    ] as const;
    const isClosed = (item: any) => ['closed', 'close', 'completed', 'verified'].includes(String(item.status_id || item.status || '').toLowerCase());
    const departmentItems = (aliases: readonly string[]) => current.capas.filter(item => { const value = String(item.department_id || item.departmentId || item.department || '').toLowerCase(); return aliases.some(alias => value === alias || value.includes(alias)); });
    const rowFor = (items: any[]) => { const total = items.length; const completed = items.filter(isClosed).length; const pending = total - completed; return { total, completed, pending, compliance: total ? Math.round((completed / total) * 100) : 0 }; };
    const departmentRows = departments.map(([name, aliases]) => ({ name, ...rowFor(departmentItems(aliases)) }));
    const overall = rowFor(current.capas);
    const riskRows = (['Low', 'Medium', 'High'] as const).map(level => { const items = current.capas.filter(item => String(item.severity || item.risk_rating_id || item.riskLevel || '').toLowerCase() === level.toLowerCase()); return { name: level, ...rowFor(items) }; });
    return (
      <Panel title={`Hazards Elimination Status — YTD ${filters.year === 'All' ? new Date().getFullYear() : filters.year} ${incidentSummary.monthName}`}>
        <div className="overflow-x-auto"><table className="min-w-[760px] w-full border-collapse text-[13px]"><thead><tr className="bg-[#0878C1] text-white"><th className="border border-[#1F2937] px-3 py-3 text-left">Department</th><th className="border border-[#1F2937] px-3 py-3">Total No. of Corrective Actions Assigned</th><th className="border border-[#1F2937] px-3 py-3">Completed</th><th className="border border-[#1F2937] px-3 py-3">Pending</th><th className="border border-[#1F2937] px-3 py-3">Compliance (%)</th></tr></thead><tbody>{departmentRows.map(row => <tr key={row.name}><td className="border border-[#64748B] bg-[#D7E5F3] px-3 py-2 font-semibold">{row.name}</td><td className="border border-[#64748B] px-3 py-2 text-center font-bold">{row.total}</td><td className="border border-[#64748B] px-3 py-2 text-center font-bold">{row.completed}</td><td className="border border-[#64748B] px-3 py-2 text-center font-bold">{row.pending}</td><td className={`border border-[#64748B] px-3 py-2 text-center font-bold ${row.compliance >= 80 ? 'bg-[#C6E0B4]' : 'bg-[#F8CBAD]'}`}>{row.compliance}%</td></tr>)}<tr className="bg-[#E2F0D9] text-[15px]"><td className="border border-[#64748B] px-3 py-2 font-bold">Overall</td><td className="border border-[#64748B] px-3 py-2 text-center font-bold">{overall.total}</td><td className="border border-[#64748B] px-3 py-2 text-center font-bold">{overall.completed}</td><td className="border border-[#64748B] px-3 py-2 text-center font-bold">{overall.pending}</td><td className="border border-[#64748B] px-3 py-2 text-center font-bold">{overall.compliance}%</td></tr></tbody></table></div>
        <div className="mt-6 overflow-x-auto"><table className="min-w-[700px] w-full border-collapse text-[13px]"><thead><tr className="bg-[#0878C1] text-white"><th className="border border-[#1F2937] px-3 py-3 text-left">Risk Level</th><th className="border border-[#1F2937] px-3 py-3">Total</th><th className="border border-[#1F2937] px-3 py-3">Completed</th><th className="border border-[#1F2937] px-3 py-3">Pending</th><th className="border border-[#1F2937] px-3 py-3">% Compliance</th></tr></thead><tbody>{riskRows.map(row => <tr key={row.name}><td className={`border border-[#64748B] px-3 py-2 font-bold ${row.name === 'Low' ? 'bg-[#FFFF00]' : row.name === 'Medium' ? 'bg-[#FFC000]' : 'bg-[#FF0000]'}`}>{row.name}</td><td className="border border-[#64748B] px-3 py-2 text-center font-bold">{row.total}</td><td className="border border-[#64748B] px-3 py-2 text-center font-bold">{row.completed}</td><td className="border border-[#64748B] px-3 py-2 text-center font-bold">{row.pending}</td><td className={`border border-[#64748B] px-3 py-2 text-center font-bold ${row.compliance >= 80 ? 'bg-[#C6E0B4]' : 'bg-[#F8CBAD]'}`}>{row.compliance}%</td></tr>)}<tr className="bg-[#E2F0D9] text-[15px]"><td className="border border-[#64748B] px-3 py-2 text-center font-bold">Total</td><td className="border border-[#64748B] px-3 py-2 text-center font-bold">{overall.total}</td><td className="border border-[#64748B] px-3 py-2 text-center font-bold">{overall.completed}</td><td className="border border-[#64748B] px-3 py-2 text-center font-bold">{overall.pending}</td><td className="border border-[#64748B] px-3 py-2 text-center font-bold">{overall.compliance}%</td></tr></tbody></table></div>
      </Panel>
    );
  };

  const renderHighRiskSummary = () => {
    const highRisk = current.hazards.filter(item => ['high', 'critical'].includes(String(item.risk_rating_id || item.severityLevel || item.severity || '').toLowerCase()));
    const closed = highRisk.filter(item => ['closed', 'close'].includes(String(item.status_id || item.status || '').toLowerCase())).length;
    const grouped = (items: any[], keys: string[]) => Object.entries(items.reduce((result, item) => { const value = String(keys.map(key => item[key]).find(value => value !== undefined && value !== null && value !== '') || 'Unspecified'); result[value] = (result[value] || 0) + 1; return result; }, {} as Record<string, number>)).map(([name, value]) => ({ name, value: Number(value) })).sort((a, b) => b.value - a.value);
    const categoryData = grouped(highRisk, ['hazard_category_id', 'category', 'unsafe_type', 'root_cause']);
    const departments = ['Production', 'ESD & UTY', 'Admin', 'HSE', 'Stores', 'Projects'];
    const departmentData = departments.map(name => { const items = highRisk.filter(item => String(item.department_id || item.departmentId || item.department || '').toLowerCase().includes(name.toLowerCase().split(' ')[0])); const done = items.filter(item => ['closed', 'close'].includes(String(item.status_id || item.status || '').toLowerCase())).length; return { name, Total: items.length, Closed: done, Open: items.length - done }; }).filter(item => item.Total > 0);
    const concerns = categoryData.slice(0, 8).map(item => item.name);
    const chart = (title: string, data: any[], bars: { key: string; color: string }[], height = 300) => <Panel title={title}><div style={{ height }}><ResponsiveContainer width="100%" height="100%"><BarChart data={data} margin={{ top: 24, right: 10, left: 0, bottom: 35 }}><CartesianGrid vertical={false} stroke="#E5E7EB" /><XAxis dataKey="name" interval={0} angle={data.length > 5 ? -20 : 0} textAnchor={data.length > 5 ? 'end' : 'middle'} tick={{ fontSize: 10 }} /><YAxis allowDecimals={false} /><Tooltip /><Legend />{bars.map(bar => <Bar key={bar.key} dataKey={bar.key} fill={bar.color} radius={[2, 2, 0, 0]} label={{ position: 'top', fill: '#111827', fontSize: 11, fontWeight: 700 }} />)}</BarChart></ResponsiveContainer></div></Panel>;
    return (
      <Panel title={`High Risk Observations YTD (${incidentSummary.monthName})-${filters.year === 'All' ? new Date().getFullYear() : filters.year}`}>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(600px,1.45fr)_minmax(270px,.55fr)]">
          <div className="space-y-5"><div>{chart('High-Risk Observations', categoryData, [{ key: 'value', color: '#4472C4' }], 320)}</div><div>{chart('High Risk Observation Dept-Wise', departmentData, [{ key: 'Total', color: '#5B9BD5' }, { key: 'Closed', color: '#ED7D31' }, { key: 'Open', color: '#A5A5A5' }], 300)}</div></div>
          <div className="space-y-5"><div className="rounded-lg bg-[#E7E6E6] p-5 text-center text-[20px] font-bold leading-8 text-[#111827] shadow-[2px_3px_5px_rgba(0,0,0,.25)]">Total ={highRisk.length}<br />Closed = {closed}<br />%Compliance ={highRisk.length ? Math.round((closed / highRisk.length) * 100) : 0}%</div><div className="rounded-[42px] border-[3px] border-[#244579] bg-[#203864] p-5"><div className="bg-[#F21B0C] px-3 py-2 text-center text-[18px] font-bold text-white">TOP CONCERNS</div><div className="mt-5 min-h-[260px] bg-white p-4 text-[15px] font-semibold leading-7 text-[#111827]">{concerns.length ? concerns.map(concern => <div key={concern}>▪ {concern}</div>) : <div>No high-risk concerns found.</div>}</div></div></div>
        </div>
        <div className="mt-4 text-[11px] text-[#6B7280]">High-risk observations include hazard records rated High or Critical. Values reflect the selected Analytics filters.</div>
      </Panel>
    );
  };

  const renderActionsLogSummary = () => {
    const departments = [
      ['Production', ['production', 'prd']], ['ESD & UTY', ['esd', 'uty', 'utilities']], ['ADM', ['adm', 'admin']], ['HSE', ['hse']],
    ] as const;
    const closedStatus = ['closed', 'close', 'completed', 'verified'];
    const rows = departments.map(([name, aliases]) => {
      const items = current.capas.filter(item => { const department = String(item.department_id || item.departmentId || item.department || '').toLowerCase(); return aliases.some(alias => department.includes(alias)); });
      const closed = items.filter(item => closedStatus.includes(String(item.status_id || item.status || '').toLowerCase())).length;
      return { name, Total: items.length, Open: items.length - closed, Closed: closed };
    }).filter(row => row.Total > 0);
    const total = current.capas.length;
    const closed = current.capas.filter(item => closedStatus.includes(String(item.status_id || item.status || '').toLowerCase())).length;
    const closureRate = total ? Math.round((closed / total) * 100) : 0;
    return (
      <Panel title={`HSE Actions Log Status YTD ${filters.year === 'All' ? new Date().getFullYear() : filters.year} ${incidentSummary.monthName}`}>
        <div className="border-t-[6px] border-[#C00000] pt-5"><div className="h-[370px] w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={rows} margin={{ top: 28, right: 18, left: 8, bottom: 20 }}><CartesianGrid vertical={false} stroke="#E5E7EB" /><XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 700 }} /><YAxis allowDecimals={false} /><Tooltip /><Legend /><Bar dataKey="Total" fill="#4472C4" radius={[2, 2, 0, 0]} label={{ position: 'top', fill: '#111827', fontWeight: 700 }} /><Bar dataKey="Open" fill="#ED7D31" radius={[2, 2, 0, 0]} label={{ position: 'top', fill: '#111827', fontWeight: 700 }} /><Bar dataKey="Closed" fill="#A5A5A5" radius={[2, 2, 0, 0]} label={{ position: 'top', fill: '#111827', fontWeight: 700 }} /></BarChart></ResponsiveContainer></div><div className="mx-auto mt-5 max-w-md border border-[#1F2937] px-6 py-3 text-center text-[20px]">Overall Closure Rate = <span className="font-bold text-[#FF0000]">{closureRate}%</span></div><p className="mx-auto mt-10 max-w-5xl bg-[#E7E6E6] px-3 py-1 text-center text-[13px] italic text-[#17365D]">* HSE Champions / Area Owners to close their respective actions and give status / timelines back to HSE for record</p></div>
      </Panel>
    );
  };

  const departmentNames = ['PRD', 'Stores', 'ADM', 'QC/FS/NPD', 'HSE', 'ESD', 'Project'];
  const departmentRecords = (items: any[], department: string) => items.filter(item => {
    const value = String(item.department_id || item.departmentId || item.department?.code || item.department?.name || '').toLowerCase();
    return value === department.toLowerCase() || value.includes(department.toLowerCase());
  });
  const departmentalRows: any[] = [
    { label: 'Hazard Reporting', unit: 'No', target: 3000, actual: (items: RecordSet) => items.hazards.length },
    { label: 'Near Miss', unit: 'No', target: 264, actual: (items: RecordSet) => items.nearMisses.length },
    { label: 'Unsafe Acts', unit: 'No', target: 0, lower: true, actual: (items: RecordSet) => items.hazards.filter(item => String(item.unsafe_type || item.category || '').toLowerCase().includes('unsafe act')).length },
    { label: 'Hazard Closure (%)', unit: '%', target: 100, actual: (items: RecordSet) => items.hazards.length ? Math.round((items.hazards.filter(item => ['closed', 'close'].includes(String(item.status_id || '').toLowerCase())).length / items.hazards.length) * 100) : 0 },
    { label: 'HSE Training Manhours', unit: 'No', target: 15000, actual: (items: RecordSet) => Math.round(items.trainings.reduce((sum, item) => sum + (Number(item.manhours || item.total_manhours) || 0), 0)) },
    { label: 'Incident Investigation Action Closure (%)', unit: '%', target: 100, actual: (items: RecordSet) => items.capas.length ? Math.round((items.capas.filter(item => ['closed', 'close'].includes(String(item.status_id || '').toLowerCase())).length / items.capas.length) * 100) : 0 },
    { label: 'Emergency Drills', unit: 'No', target: 6, actual: (_items: RecordSet) => '—' as number | string },
    { label: 'Actions Plan Closure Tracker (%)', unit: '%', target: 100, actual: (items: RecordSet) => items.capas.length ? Math.round((items.capas.filter(item => ['closed', 'close'].includes(String(item.status_id || '').toLowerCase())).length / items.capas.length) * 100) : 0 },
    { label: 'Fatal Incidents', unit: 'No', target: 0, lower: true, actual: (items: RecordSet) => countCategories(items.incidents, ['fatal']) },
    { label: 'LTI', unit: 'No', target: 0, lower: true, actual: (items: RecordSet) => countCategories(items.incidents, ['lost time', 'lti']) },
    { label: 'LTIR', unit: 'Rate', target: 0, lower: true, actual: (_items: RecordSet) => '—' as number | string },
    { label: 'Recordable Incidents', unit: 'No', target: 0, lower: true, actual: (items: RecordSet) => countCategories(items.incidents, ['lost time', 'lti', 'restricted', 'rwc', 'medical treatment', 'mtc']) },
    { label: 'TRIR', unit: 'Rate', target: 0, lower: true, actual: (_items: RecordSet) => '—' as number | string },
    { label: 'First Aid', unit: 'No', target: 0, actual: (items: RecordSet) => countCategories(items.incidents, ['first aid']) },
    { label: 'Fire Incidents — Major', unit: 'No', target: 0, lower: true, actual: (items: RecordSet) => countCategories(items.incidents, ['major fire']) },
    { label: 'Fire Incidents — Minor', unit: 'No', target: 0, lower: true, actual: (items: RecordSet) => countCategories(items.incidents, ['minor fire']) },
  ];

  const renderDepartmentalTable = () => (
    <Panel title={`Monthly Departmental HSE KPIs — ${filters.year}`}>
      <div className="overflow-x-auto">
        <table className="min-w-[1380px] w-full border-collapse text-[11px]">
          <thead>
            <tr className="bg-[#4777BE] text-white"><th rowSpan={2} className="border border-[#1F2937] px-3 py-2 text-left">HSE KPIs</th>{departmentNames.map(department => <th key={department} colSpan={2} className="border border-[#1F2937] px-2 py-2 text-center">{department}</th>)}<th colSpan={2} className="border border-[#1F2937] px-2 py-2 text-center">{filters.year}</th></tr>
            <tr className="bg-[#D7E5F3] text-[#1F2937]">{[...departmentNames, filters.year].flatMap(department => [<th key={`${department}-target`} className="border border-[#94A3B8] px-2 py-1.5">Tar</th>, <th key={`${department}-actual`} className="border border-[#94A3B8] px-2 py-1.5">Actual</th>])}</tr>
          </thead>
          <tbody>
            <tr><td colSpan={departmentNames.length * 2 + 3} className="border border-[#94A3B8] bg-[#B9D3EA] px-3 py-2 text-center text-[15px] font-bold text-[#008C45]">Leading Indicators</td></tr>
            {departmentalRows.slice(0, 8).map(row => <tr key={row.label}><td className="border border-[#94A3B8] bg-[#D7E5F3] px-2 py-2 font-semibold text-[#1F2937]">{row.label}</td>{departmentNames.map(department => { const subset: RecordSet = { hazards: departmentRecords(current.hazards, department), incidents: departmentRecords(current.incidents, department), nearMisses: departmentRecords(current.nearMisses, department), trainings: departmentRecords(current.trainings, department), audits: departmentRecords(current.audits, department), inspections: departmentRecords(current.inspections, department), capas: departmentRecords(current.capas, department) }; const actual = row.actual(subset); const good = typeof actual === 'number' && (row.lower ? actual <= row.target : actual >= row.target); return <><td key={`${row.label}-${department}-target`} className="border border-[#CBD5E1] px-2 py-2 text-center">{row.target}{row.unit === '%' ? '%' : ''}</td><td key={`${row.label}-${department}-actual`} className={`border border-[#CBD5E1] px-2 py-2 text-center font-bold ${actual === '—' ? '' : good ? 'bg-[#C6E0B4]' : 'bg-[#F8CBAD]'}`}>{actual}{row.unit === '%' && actual !== '—' ? '%' : ''}</td></>; })}<td className="border border-[#CBD5E1] px-2 py-2 text-center font-semibold">{row.target}{row.unit === '%' ? '%' : ''}</td><td className="border border-[#CBD5E1] px-2 py-2 text-center font-bold">{valueFor(row.label === 'Hazard Reporting' ? 'hazards' : row.label === 'Near Miss' ? 'nearMisses' : row.label === 'HSE Training Manhours' ? 'training' : row.label === 'Hazard Closure (%)' ? 'closure' : 'capaClosure')}{row.unit === '%' ? '%' : ''}</td></tr>)}
            <tr><td colSpan={departmentNames.length * 2 + 3} className="border border-[#94A3B8] bg-[#B9D3EA] px-3 py-2 text-center text-[15px] font-bold text-[#EF1111]">Lagging Indicators</td></tr>
            {departmentalRows.slice(8).map(row => <tr key={row.label}><td className="border border-[#94A3B8] bg-[#D7E5F3] px-2 py-2 font-semibold text-[#1F2937]">{row.label}</td>{departmentNames.map(department => { const subset: RecordSet = { hazards: departmentRecords(current.hazards, department), incidents: departmentRecords(current.incidents, department), nearMisses: departmentRecords(current.nearMisses, department), trainings: departmentRecords(current.trainings, department), audits: departmentRecords(current.audits, department), inspections: departmentRecords(current.inspections, department), capas: departmentRecords(current.capas, department) }; const actual = row.actual(subset); const good = typeof actual === 'number' && (row.lower ? actual <= row.target : actual >= row.target); return <><td key={`${row.label}-${department}-target`} className="border border-[#CBD5E1] px-2 py-2 text-center">{row.target}</td><td key={`${row.label}-${department}-actual`} className={`border border-[#CBD5E1] px-2 py-2 text-center font-bold ${actual === '—' ? '' : good ? 'bg-[#C6E0B4]' : 'bg-[#F8CBAD]'}`}>{actual}</td></>; })}<td className="border border-[#CBD5E1] px-2 py-2 text-center font-semibold">{row.target}</td><td className="border border-[#CBD5E1] px-2 py-2 text-center font-bold">{laggingValue(row.key)}</td></tr>)}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[11px] text-[#6B7280]">Department columns are populated from department codes/names on backend records. Green indicates target met; amber indicates attention required.</p>
    </Panel>
  );

  const renderScorecard = (title: string, rows: IndicatorRow[], lagging = false) => (
    <Panel title={title}>
      <div className="overflow-x-auto">
        <table className="min-w-[920px] w-full border-collapse text-[12px]">
          <thead><tr className="bg-[#4777BE] text-white"><th className="border border-[#1F2937] px-3 py-2 text-left">{lagging ? 'Lagging Indicators' : 'Leading Indicators'}</th><th className="border border-[#1F2937] px-3 py-2">Unit</th><th className="border border-[#1F2937] px-3 py-2">2024</th><th className="border border-[#1F2937] px-3 py-2">2025</th><th className="border border-[#1F2937] px-3 py-2">Tar {filters.year}</th><th className="border border-[#1F2937] px-3 py-2">YTD-{filters.year}</th><th className="border border-[#1F2937] px-3 py-2">Status</th><th className="border border-[#1F2937] px-3 py-2 text-left">Remarks</th></tr></thead>
          <tbody>{rows.map(row => { const value = lagging ? laggingValue(row.key) : valueFor(row.key); const numeric = typeof value === 'number' ? value : 0; const status = row.key === 'initiatives' || value === '—' ? 'neutral' : statusFor(numeric, row.target, ['fatal', 'lti', 'rwcMtc', 'majorFire', 'minorFire', 'unsafeActs'].includes(row.key)); return <tr key={row.key} className="odd:bg-white even:bg-[#F8FAFC]"><td className="border border-[#CBD5E1] px-3 py-2 font-semibold text-[#1F2937]">{row.label}</td><td className="border border-[#CBD5E1] px-3 py-2 text-center font-semibold">{row.unit || '—'}</td><td className="border border-[#CBD5E1] px-3 py-2 text-center">{formatValue(yearValue(lagging ? records.incidents : records.hazards, row.key, '2024'))}</td><td className="border border-[#CBD5E1] px-3 py-2 text-center">{formatValue(yearValue(lagging ? records.incidents : records.hazards, row.key, '2025'))}</td><td className="border border-[#CBD5E1] px-3 py-2 text-center font-semibold">{formatValue(row.target)}</td><td className="border border-[#CBD5E1] px-3 py-2 text-center font-bold">{formatValue(value)}</td><td className="border border-[#CBD5E1] px-3 py-2 text-center"><StatusMark status={status} /></td><td className="border border-[#CBD5E1] px-3 py-2 font-medium text-[#374151]">{row.remark}</td></tr>; })}</tbody>
        </table>
      </div>
    </Panel>
  );

  if (loading) return <Layout><div className="flex min-h-[400px] flex-col items-center justify-center gap-3"><RefreshCw className="h-8 w-8 animate-spin text-[#CB0017]" /><p className="text-[13px] text-[#6B7280]">Loading analytics data…</p></div></Layout>;

  return (
    <Layout>
      <ContextHeader title="HSE Analytics" breadcrumbs={['Reporting', 'Analytics']} subtitle="Safety Pyramid and HSE KPI Performance Summary">
        <FilterBar />
      </ContextHeader>
      <main className="mx-auto max-w-[1600px] space-y-6 p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#D9E1EC] bg-white p-3 shadow-sm"><div className="flex gap-2"><button onClick={() => setView('summary')} className={`rounded-md px-4 py-2 text-[12px] font-semibold ${view === 'summary' ? 'bg-[#CB0017] text-white' : 'bg-[#F3F4F6] text-[#374151]'}`}>KPI Performance Summary</button><button onClick={() => setView('pyramid')} className={`rounded-md px-4 py-2 text-[12px] font-semibold ${view === 'pyramid' ? 'bg-[#CB0017] text-white' : 'bg-[#F3F4F6] text-[#374151]'}`}>Safety Pyramid</button></div><span className="text-[11px] text-[#6B7280]">Live data · {filters.year === 'All' ? 'All years' : `YTD ${filters.year}`}</span></div>

        {view === 'pyramid' ? (
          <>
            <Panel title={`Safety Pyramid — YTD ${filters.year}`}>
              <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(440px,1fr)_minmax(360px,.8fr)]">
                <div className="flex min-h-[520px] items-center justify-center bg-[#FCFCFC] p-4"><div className="flex w-full max-w-[520px] flex-col items-center gap-1 text-center font-bold text-white"><div className="w-[24%] bg-[#EF1111] px-3 py-5 text-sm">{metrics.fatal}<br /><span className="text-[11px]">Fatality</span></div><div className="w-[42%] bg-[#FF6B00] px-3 py-6 text-sm">{metrics.lti + metrics.rwc + metrics.mtc}<br /><span className="text-[11px]">Serious / Recordable Injury</span></div><div className="w-[62%] bg-[#5B9BD5] px-3 py-8 text-sm">{metrics.recordable}<br /><span className="text-[11px]">LTI, RWC, MTC, Fire</span></div><div className="w-[82%] bg-[#FFC000] px-3 py-9 text-sm">{current.nearMisses.length + metrics.firstAid}<br /><span className="text-[11px]">Near Misses, First Aids, Minor Incidents</span></div><div className="w-full bg-[#00B050] px-3 py-10 text-sm">{current.hazards.length + metrics.unsafeActs}<br /><span className="text-[11px]">Unsafe Conditions & Unsafe Acts</span></div></div></div>
                <div className="space-y-4"><div className="rounded-xl bg-[#FFF2CC] p-6 text-center text-[18px] font-semibold leading-8 text-[#1F2937]">It is better to report and learn from near misses, minor incidents, and hazards before serious losses occur.</div><div className="grid gap-3"><KpiTile label="Hazards" value={current.hazards.length} icon={<AlertTriangle />} accent="success" /><KpiTile label="Near Misses" value={current.nearMisses.length} icon={<Target />} accent="warning" /><KpiTile label="Recordable Incidents" value={metrics.recordable} icon={<FileText />} accent={metrics.recordable > 0 ? 'danger' : 'success'} /></div></div>
              </div>
            </Panel>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2"><Panel title="Safety Events Trend"><div className="h-72"><ResponsiveContainer width="100%" height="100%"><LineChart data={trendData}><CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip /><Line dataKey="Hazards" stroke={CHART_COLORS.success} strokeWidth={3} /><Line dataKey="Incidents" stroke={CHART_COLORS.danger} strokeWidth={3} /><Line dataKey="Near Misses" stroke={CHART_COLORS.warning} strokeWidth={3} /></LineChart></ResponsiveContainer></div></Panel><Panel title="Pyramid Category Comparison"><div className="h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={[{ name: 'Hazards', value: current.hazards.length }, { name: 'Near Miss', value: current.nearMisses.length }, { name: 'Recordable', value: metrics.recordable }, { name: 'Fatality', value: metrics.fatal }]}><CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="value" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></Panel></div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-6"><KpiTile label="Hazards" value={current.hazards.length} icon={<AlertTriangle />} accent="warning" /><KpiTile label="Near Misses" value={current.nearMisses.length} icon={<Target />} accent="info" /><KpiTile label="Fatalities" value={metrics.fatal} icon={<ShieldAlert />} accent={metrics.fatal ? 'danger' : 'success'} /><KpiTile label="LTI" value={metrics.lti} icon={<FileText />} accent={metrics.lti ? 'danger' : 'success'} /><KpiTile label="Training" value={current.trainings.length} icon={<Users />} accent="success" /><KpiTile label="Audits / Inspections" value={current.audits.length + current.inspections.length} icon={<ClipboardCheck />} accent="info" /></div>
            {renderScorecard('Lagging Indicators', laggingRows, true)}
            {renderScorecard('Leading Indicators', leadingRows)}
            {renderDepartmentalTable()}
            {renderIncidentSummary()}
            {renderFirstAidSummary()}
            {renderNearMissSummary()}
            {renderHazardEliminationSummary()}
            {renderHighRiskSummary()}
            {renderActionsLogSummary()}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2"><Panel title="Monthly Safety Events"><div className="h-72"><ResponsiveContainer width="100%" height="100%"><LineChart data={trendData}><CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip /><Line dataKey="Hazards" stroke={CHART_COLORS.warning} strokeWidth={3} /><Line dataKey="Incidents" stroke={CHART_COLORS.danger} strokeWidth={3} /><Line dataKey="Near Misses" stroke={CHART_COLORS.info} strokeWidth={3} /></LineChart></ResponsiveContainer></div></Panel><Panel title="Current Outcome Breakdown"><div className="grid grid-cols-2 gap-3 sm:grid-cols-4"><KpiTile label="First Aid" value={metrics.firstAid} icon={<Activity />} accent="info" /><KpiTile label="MTC" value={metrics.mtc} icon={<FileText />} accent="warning" /><KpiTile label="RWC" value={metrics.rwc} icon={<FileText />} accent="warning" /><KpiTile label="Fire" value={metrics.majorFire + metrics.minorFire} icon={<Flame />} accent="danger" /></div></Panel></div>
          </>
        )}
        <div className="flex items-center gap-2 text-[11px] text-[#6B7280]"><CheckCircle2 className="h-4 w-4 text-[#16A34A]" /> Values are calculated from the latest backend records and refresh automatically.</div>
      </main>
    </Layout>
  );
};
