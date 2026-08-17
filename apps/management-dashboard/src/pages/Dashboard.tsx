import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
} from 'recharts';
import { Layout }               from '../components/Layout';
import { CenterModal }          from '../components/CenterModal';
import { KpiTile }              from '../components/KpiTile';
import { FilterBar }            from '../components/FilterBar';
import { ContextHeader }        from '../components/ContextHeader';
import { StatusBadge }          from '../components/StatusBadge';
import { PlantPhotoCard }       from '../components/PlantPhotoCard';
import { useFilters }           from '../context/FilterContext';
import {
  CheckCircle2, FileWarning,
  Users, BookOpen, AlertTriangle, ArrowRight, ShieldAlert,
  CheckCircle, XCircle, Info, RefreshCw,
  ChevronUp, ChevronDown,
} from 'lucide-react';
import { dashboardClient }      from '@cbl/api';
import { CHART_COLORS, PIE_COLORS } from '../config/constants';
import { useDashboardMetrics, type DashboardRawData, type MetricItem } from '../hooks/useDashboardMetrics';

const LOCATION_CARD_CONFIG = [
  {
    id: 'lu-sukkur-plant',
    imageUrl: '/plant_image_21_1200x800.webp',
    title: 'LU Sukkur Plant',
    subtitle: 'Operational Excellence & Safety Compliance',
    location: 'Sukkur Plant Operations',
    alt: 'LU Sukkur Plant industrial facility',
    route: '/hazard-reporting',
  },
  {
    id: 'asset-safety-mapping',
    imageUrl: '/inspector-reviews-power-plant-safety-checklist-using-laptop-near-dam-inspector-reviews-power-plant-safety-checklist-using-laptop-456123604.webp',
    title: 'Asset Safety Mapping',
    subtitle: 'Real-time Hazard Tracking Grid',
    badge: 'REPORT INCIDENT',
    alt: 'Safety inspector reviewing a power plant checklist',
    route: '/incident-log',
  },
] as const;

// ===== Enterprise Chart Tooltip =====
const EnterpriseTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#E0E0E0] rounded-lg px-3 py-2"
         style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
      <p className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide mb-1">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 text-[13px] font-medium">
          <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color || p.fill }} />
          <span className="text-[#1A1818]">{p.name ? `${p.name}: ` : ''}{p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ===== Metric Detail Row (for leading/lagging modals) =====
const MetricRow = ({ metric }: { metric: MetricItem }) => {
  const navigate = useNavigate();
  const isClickable = metric.path && !metric.isPendingModule;

  const iconEl =
    metric.status === 'success' ? <CheckCircle  className="w-4 h-4" /> :
    metric.status === 'warning' ? <AlertTriangle className="w-4 h-4" /> :
    metric.status === 'danger'  ? <XCircle       className="w-4 h-4" /> :
                                  <Info          className="w-4 h-4" />;

  const iconBg =
    metric.status === 'success' ? { bg: '#ECFDF5', color: '#059669' } :
    metric.status === 'warning' ? { bg: '#FFFBEB', color: '#D97706' } :
    metric.status === 'danger'  ? { bg: '#FEF2F2', color: '#DC2626' } :
                                  { bg: '#F3F4F6', color: '#6B7280' };

  return (
    <div
      onClick={() => isClickable && navigate(metric.path!)}
      className={`flex items-center justify-between gap-4 py-3 px-4 border-b border-[#F3F4F6] last:border-0 ${
        isClickable ? 'cursor-pointer hover:bg-[#F9FAFB] transition-colors' : ''
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="p-1.5 rounded" style={{ backgroundColor: iconBg.bg, color: iconBg.color }}>
          {iconEl}
        </div>
        <div className="min-w-0">
          <span className="text-[13px] font-medium text-[#1A1818] block truncate">{metric.name}</span>
          {metric.isPendingModule && (
            <span className="text-[10px] text-[#9CA3AF] font-medium uppercase tracking-wide">Pending Module</span>
          )}
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-[15px] font-bold text-[#1A1818] tabular-nums">
          {metric.value}
          {metric.unit && <span className="text-[12px] font-normal text-[#9CA3AF] ml-1">{metric.unit}</span>}
        </div>
        {metric.target !== undefined && (
          <div className="text-[11px] text-[#9CA3AF]">Target: {metric.target}</div>
        )}
      </div>
    </div>
  );
};

// ===== Section Header =====
const SectionHeader = ({ title, onViewAll, onToggle, expanded }: {
  title: string; onViewAll?: () => void; onToggle?: () => void; expanded?: boolean;
}) => (
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-2">
      <div className="w-1 h-5 rounded-full" style={{ backgroundColor: '#7B1010' }} />
      <h2 className="text-[13px] font-bold text-[#374151] uppercase tracking-wider">{title}</h2>
    </div>
    <div className="flex items-center gap-2">
      {onViewAll && (
        <button
          onClick={onViewAll}
          className="flex items-center gap-1 text-[12px] font-medium hover:underline transition-colors"
          style={{ color: '#7B1010' }}
        >
          View Details <ArrowRight className="h-3 w-3" />
        </button>
      )}
      {onToggle && (
        <button onClick={onToggle} className="p-1 rounded hover:bg-[#F5F5F5] text-[#9CA3AF] hover:text-[#374151] transition-colors">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      )}
    </div>
  </div>
);

// ===== Enterprise Panel =====
const Panel = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white border border-[#E8E0C8] rounded-lg ${className}`}
       style={{ boxShadow: '0 1px 3px 0 rgba(0,0,0,0.08)' }}>
    {children}
  </div>
);

// ===== Stitch Design Brand Colors for charts =====
const STITCH_CHART = {
  maroon:   '#7B1010',
  maroonMid:'#A01515',
  olive:    '#6B5A1E',
  oliveLight:'#A08C3A',
  amber:    '#D97706',
  grey:     '#6B7280',
};

const PIE_COLORS_RISK_STITCH  = [STITCH_CHART.maroon, '#B91C1C', STITCH_CHART.amber, STITCH_CHART.grey];
const PIE_COLORS_STATUS_STITCH = [STITCH_CHART.amber, '#16A34A', '#B91C1C'];
const PIE_COLORS_STATUS = PIE_COLORS_STATUS_STITCH;
const PIE_COLORS_RISK   = PIE_COLORS_RISK_STITCH;

export const Dashboard = () => {
  const navigate    = useNavigate();
  const { filters } = useFilters();
  const [loading,   setLoading]   = useState(true);
  const [isLeadingOpen, setIsLeadingOpen] = useState(false);
  const [isLaggingOpen, setIsLaggingOpen] = useState(false);

  const [hazards,    setHazards]    = useState<any[]>([]);
  const [hazardTotal, setHazardTotal] = useState(0);
  const [incidents,  setIncidents]  = useState<any[]>([]);
  const [capas,      setCapas]      = useState<any[]>([]);
  const [training,   setTraining]   = useState<any[]>([]);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [dashboardOverview, setDashboardOverview] = useState<any>(null);
  const requestSequence = useRef(0);
  const hasLoadedDashboard = useRef(false);

  const [rawData, setRawData] = useState<DashboardRawData>({
    hazards: [], nearMisses: [], incidents: [], capas: [],
    training: [], inspections: [], drills: [], legal: [], audits: []
  });

  useEffect(() => {
    const fetchData = async () => {
      const requestId = ++requestSequence.current;
      // Keep the last successful dashboard visible while polling in the
      // background. A transient request failure must never turn valid counts
      // into zeroes or blank cards.
      if (!hasLoadedDashboard.current) setLoading(true);
      try {
        const response = await dashboardClient.getOverview(filters as unknown as Record<string, unknown>);
        if (requestId !== requestSequence.current) return;
        const overview = response.data?.data;
        if (!overview) throw new Error('Dashboard overview returned no data');
        const summary = overview.summary || {};
        const stats = {
          hazards: { total: summary.hazards?.total || 0, Open: summary.hazards?.open || 0, Closed: summary.hazards?.closed || 0, severity: summary.hazards?.severity || {} },
          nearMisses: { total: summary.nearMisses?.total || 0 },
          incidents: { total: summary.incidents?.total || 0, LTI: summary.incidents?.lti || 0, RWC: summary.incidents?.rwc || 0, MTC: summary.incidents?.mtc || 0, 'First Aid': summary.incidents?.firstAid || 0, Fatality: summary.incidents?.fatalities || 0 },
          training: { total: summary.training?.total || 0, manhours: summary.training?.manhours || 0 },
          correctiveActions: { total: summary.correctiveActions?.total || 0, Open: summary.correctiveActions?.open || 0, Closed: summary.correctiveActions?.closed || 0 },
          audits: { total: summary.assurance?.audits || 0 }, inspections: { total: summary.assurance?.inspections || 0 },
        };
        const recent = overview.recent || {};
        const hazardRows = recent.hazards || []; const nearMissRows = recent.nearMisses || []; const incidentRows = recent.incidents || [];
        setDashboardOverview(overview);
        setDashboardStats(stats);
        setHazards(hazardRows); setHazardTotal(summary.hazards?.total || 0);
        setIncidents(incidentRows);
        setCapas([]); setTraining([]);

        // Ignore results from an older polling cycle that completed after a
        // newer request. This prevents count flicker from out-of-order APIs.
        setRawData(previous => ({ ...previous, hazards: hazardRows, nearMisses: nearMissRows, incidents: incidentRows, capas: [], training: [], inspections: [], audits: [], aggregate: stats }));
        hasLoadedDashboard.current = true;
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        if (requestId === requestSequence.current) setLoading(false);
      }
    };
    fetchData();

     // Refresh the compact aggregate snapshot every 5 minutes.
    const refreshInterval = window.setInterval(fetchData, 300000);

    const handleRefresh = () => {
      fetchData();
    };
    window.addEventListener('dashboard-refresh', handleRefresh);
    return () => {
      window.removeEventListener('dashboard-refresh', handleRefresh);
      window.clearInterval(refreshInterval);
    };
  }, [filters]);

  const { leadingMetricsDetail, laggingMetricsDetail } = useDashboardMetrics(rawData);

  // ===== KPI Computations (unchanged business logic) =====
  // The aggregate endpoint applies the same year, date, department, and
  // status filters as the dashboard. Always use it for KPI cards; falling
  // back to the module page total can reintroduce an unfiltered/paginated
  // Hazard Reporting count and make Hazard Spotting disagree with the API.
  const useAggregateStats    = Boolean(dashboardStats);
  const totalIncidents       = useAggregateStats ? dashboardStats.incidents?.total : incidents.length;
  const ltiCases             = useAggregateStats ? dashboardStats.incidents?.LTI ?? 0 : incidents.filter(i => i.incident_category_id === 'LTI').length;
  const firstAidCases        = useAggregateStats ? dashboardStats.incidents?.['First Aid'] ?? 0 : incidents.filter(i => i.incident_category_id === 'First Aid').length;
  const fatalities           = useAggregateStats ? dashboardStats.incidents?.Fatality ?? 0 : incidents.filter(i => i.incident_category_id === 'Fatality').length;

  const totalHazards         = useAggregateStats ? dashboardStats.hazards?.total ?? 0 : hazardTotal;
  const highCriticalHazards  = useAggregateStats && dashboardStats.hazards?.severity
    ? (Number(dashboardStats.hazards.severity.High) || 0) + (Number(dashboardStats.hazards.severity.Critical) || 0)
    : hazards.filter(h => ['High', 'Critical'].includes(h.risk_rating_id)).length;

  const totalTrainingSessions  = useAggregateStats ? dashboardStats.training?.total ?? 0 : training.length;
  const totalTrainingManhours  = useAggregateStats ? Number(dashboardStats.training?.manhours || 0) : Math.round(training.reduce((sum, t) => sum + (Number(t.manhours) || 0), 0));

  const totalOpenCapas   = useAggregateStats && dashboardStats.correctiveActions
    ? ['Open', 'Pending', 'Work in Progress'].reduce((sum, status) => sum + (Number(dashboardStats.correctiveActions[status]) || 0), 0)
    : capas.filter(c => ['Open', 'Pending', 'Work in Progress'].includes(c.status_id)).length;
  const totalClosedCapas = useAggregateStats && dashboardStats.correctiveActions
    ? (Number(dashboardStats.correctiveActions.Closed) || 0) + (Number(dashboardStats.correctiveActions.Close) || 0)
    : capas.filter(c => c.status_id === 'Close' || c.status_id === 'Closed').length;
  const overdueCapas     = Number(dashboardOverview?.summary?.correctiveActions?.overdue || 0);
  const totalCapas       = useAggregateStats ? dashboardStats.correctiveActions?.total ?? 0 : capas.length;
  const closureRateCAPA  = totalCapas > 0 ? Math.round((totalClosedCapas / totalCapas) * 100) : 0;

  // ===== Chart Data (unchanged) =====
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const trendData: Array<{ name: string; Incidents: number; Hazards: number; 'Near Misses': number }> = [];
  const overviewTrend = dashboardOverview?.charts?.monthly || {};
  const selectedYear = filters.year && filters.year !== 'All' ? Number(filters.year) : new Date().getFullYear();
  const endDate = filters.toDate
    ? new Date(`${filters.toDate}T12:00:00`)
    : filters.year && filters.year !== 'All'
      ? new Date(Math.min(new Date().getTime(), new Date(selectedYear, 11, 31, 12).getTime()))
      : new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(endDate.getFullYear(), endDate.getMonth() - i, 1);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    trendData.push({
      name: monthNames[d.getMonth()],
      Incidents: Number(overviewTrend.incidents?.[monthKey] || 0),
      Hazards: Number(overviewTrend.hazards?.[monthKey] || 0),
      'Near Misses': Number(overviewTrend.nearMisses?.[monthKey] || 0),
    });
  }

  const capaStatusData = [
    { name: 'Open (In Time)', value: totalOpenCapas - overdueCapas },
    { name: 'Closed',         value: totalClosedCapas },
    { name: 'Overdue',        value: overdueCapas },
  ];

  const incDeptData = (dashboardOverview?.departmentStatistics?.incidents || []).map((row: any) => ({
    name: row.department || row.departmentName || 'Unassigned',
    count: Number(row.total || row.count || 0),
  })).sort((a: any, b: any) => b.count - a.count).slice(0, 7);

  const hazCatData = Object.entries(dashboardOverview?.charts?.hazards || {}).map(([name, count]) => ({ name, count: Number(count) })).sort((a,b)=>b.count-a.count).slice(0,6);

  const trDeptData = (dashboardOverview?.departmentStatistics?.training || []).map((row: any) => ({
    name: row.department || row.departmentName || 'Unassigned',
    count: Math.round(Number(row.manhours || row.count || 0)),
  })).sort((a: any, b: any) => b.count - a.count).slice(0, 7);

  const incCatData = Object.entries(dashboardOverview?.summary?.incidents?.byType || {}).map(([name, value]) => ({ name, value }));

  const riskData = Object.entries(dashboardOverview?.charts?.hazardSeverity || {}).map(([name, value]) => ({ name, value }));

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
          <RefreshCw className="h-8 w-8 animate-spin" style={{ color: '#7B1010' }} />
          <p className="text-[13px] text-[#6B7280]">Loading dashboard data…</p>
        </div>
      </Layout>
    );
  }

  // ===== Enterprise chart axis/grid styles =====
  const axisStyle = { fontSize: 11, fill: '#9CA3AF' };
  const gridStyle = { stroke: '#F0F0F0', strokeDasharray: '4 4' };

  return (
    <Layout>
      {/* Context Header */}
      <ContextHeader
        title="Executive Dashboard"
        breadcrumbs={['Dashboard']}
        subtitle={`Showing data for ${filters.department !== 'All' ? filters.department : 'all departments'} · ${filters.year !== 'All' ? filters.year : 'all time'}`}
      >
        <FilterBar />
      </ContextHeader>

      <div className="p-6 space-y-6">

        {/* ============ ROW 1 — KPI TILES (Stitch layout) ============ */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <KpiTile
            label="Total Hazards"
            value={totalHazards}
            accent="warning"
            icon={<AlertTriangle />}
            trend={12}
            trendLabel="vs last month"
            subtleLine="Reports vs Prev Year"
            onClick={() => navigate('/hazard-reporting')}
          />
          <KpiTile
            label="Total Incidents"
            value={totalIncidents}
            accent="danger"
            icon={<FileWarning />}
            trend={-5}
            trendLabel="vs last year"
            subtleLine="Safety events logged"
            onClick={() => navigate('/incident-log')}
          />
          <KpiTile
            label="Training Hrs"
            value={totalTrainingManhours.toLocaleString()}
            accent="success"
            icon={<BookOpen />}
            subtleLine={`${totalTrainingSessions} participants`}
            onClick={() => navigate('/training-records')}
          />
          <KpiTile
            label="CAPA Closure %"
            value={closureRateCAPA}
            unit="%"
            accent={closureRateCAPA >= 80 ? 'success' : closureRateCAPA >= 50 ? 'warning' : 'danger'}
            icon={<CheckCircle2 />}
            subtleLine={`${totalClosedCapas}/${totalCapas} CAPAs done`}
            onClick={() => navigate('/action-tracker')}
          />
          <KpiTile
            label="High-Risk Hazards"
            value={highCriticalHazards}
            accent={highCriticalHazards > 0 ? 'danger' : 'success'}
            icon={<ShieldAlert />}
            subtleLine="Requires immediate action"
            onClick={() => navigate('/hazard-reporting')}
          />
        </div>

        {/* ============ LEADING & LAGGING STRIP (Stitch design) ============ */}
        <Panel className="p-5">
          <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest mb-4">Leading &amp; Lagging Indicators</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
            {[
              { label: 'Fatalities',    value: fatalities,        color: '#7B1010',  bg: '#FEF2F2',  onClick: () => navigate('/incident-log') },
              { label: 'LTI',          value: ltiCases,          color: '#1C1C1E',  bg: 'white',    onClick: () => navigate('/incident-log') },
              { label: 'LTIR',         value: (ltiCases / Math.max(1, totalTrainingManhours / 200000)).toFixed(2), color: '#1C1C1E', bg: 'white', onClick: undefined },
              { label: 'TRIR',         value: ((ltiCases + firstAidCases) / Math.max(1, totalTrainingManhours / 200000)).toFixed(2), color: '#1C1C1E', bg: 'white', onClick: undefined },
              { label: 'Hazard Spotting', value: totalHazards.toLocaleString(), color: '#92400E', bg: '#FEF9EC', onClick: () => navigate('/hazard-reporting') },
            ].map(({ label, value, color, bg, onClick: hdl }) => (
              <div
                key={label}
                onClick={hdl}
                className={`flex flex-col items-center justify-center text-center rounded-lg p-4 ${hdl ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`}
                style={{ backgroundColor: bg, border: '1px solid #E8E0C8' }}
              >
                <span className="text-[28px] font-bold tabular-nums" style={{ color }}>{value}</span>
                <span className="text-[11px] font-medium mt-1" style={{ color: '#9CA3AF' }}>{label}</span>
              </div>
            ))}
          </div>
        </Panel>

        {/* ============ ROW 2 — Leading / Lagging Summary ============ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Leading Indicators */}
          <Panel className="p-5">
            <SectionHeader
              title="Leading Indicators"
              onViewAll={() => setIsLeadingOpen(true)}
            />
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Hazards Reported', value: totalHazards,          icon: FileWarning,   path: '/hazard-reporting' },
                { label: 'Training Sessions', value: totalTrainingSessions, icon: Users,          path: '/training-records' },
                { label: 'CAPA Closure',      value: `${closureRateCAPA}%`, icon: CheckCircle2, path: '/action-tracker'   },
              ].map(({ label, value, icon: Icon, path }) => (
                <div
                  key={label}
                  onClick={() => navigate(path)}
                  className="flex flex-col items-center text-center cursor-pointer p-3 rounded-lg hover:bg-[#F9FAFB] transition-colors border border-[#F0F0F0]"
                >
                  <Icon className="h-5 w-5 text-[#1B7C1B] mb-2" />
                  <p className="text-[20px] font-bold text-[#1A1818] tabular-nums">{value}</p>
                  <p className="text-[11px] text-[#6B7280] mt-0.5 leading-tight">{label}</p>
                </div>
              ))}
            </div>
          </Panel>

          {/* Lagging Indicators */}
          <Panel className="p-5">
            <SectionHeader
              title="Lagging Indicators"
              onViewAll={() => setIsLaggingOpen(true)}
            />
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Total',     value: totalIncidents, color: '#6B7280' },
                { label: 'First Aid', value: firstAidCases,  color: '#DC8E00' },
                { label: 'LTI',       value: ltiCases,       color: '#CB0017' },
                { label: 'Fatality',  value: fatalities,     color: '#7F1D1D' },
              ].map(({ label, value, color }) => (
                <div
                  key={label}
                  onClick={() => navigate('/incident-log')}
                  className="flex flex-col items-center text-center cursor-pointer p-3 rounded-lg hover:bg-[#F9FAFB] transition-colors border border-[#F0F0F0]"
                >
                  <p className="text-[22px] font-bold tabular-nums" style={{ color }}>{value}</p>
                  <p className="text-[11px] text-[#6B7280] mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* ============ ROW 3 — TREND CHART + CAPA DONUT ============ */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Safety Trends (60%) */}
          <Panel className="lg:col-span-3 p-5">
            <SectionHeader title="Safety Trends — Last 6 Months" />
            {/* Legend */}
            <div className="flex items-center gap-4 mb-4">
              {[
                { label: 'Incidents',   color: CHART_COLORS.danger },
                { label: 'Hazards',     color: CHART_COLORS.amber  },
                { label: 'Near Misses', color: CHART_COLORS.info   },
              ].map(({ label, color }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <span className="inline-block w-3 h-0.5 rounded" style={{ backgroundColor: color }} />
                  <span className="text-[11px] text-[#6B7280]">{label}</span>
                </div>
              ))}
            </div>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid vertical={false} {...gridStyle} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={axisStyle} />
                  <YAxis axisLine={false} tickLine={false} tick={axisStyle} />
                  <RechartsTooltip content={<EnterpriseTooltip />} />
                  <Line type="monotone" dataKey="Incidents"   stroke={CHART_COLORS.danger} strokeWidth={2.5} dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
                  <Line type="monotone" dataKey="Hazards"     stroke={CHART_COLORS.amber}  strokeWidth={2.5} dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
                  <Line type="monotone" dataKey="Near Misses" stroke={CHART_COLORS.info}   strokeWidth={2.5} dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          {/* CAPA Status Donut (40%) */}
          <Panel className="lg:col-span-2 p-5">
            <SectionHeader title="CAPA Status Distribution" onViewAll={() => navigate('/action-tracker')} />
            <div className="h-[240px] flex items-center justify-center">
              {totalCapas > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={capaStatusData}
                      cx="50%" cy="50%"
                      innerRadius={65} outerRadius={95}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {capaStatusData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS_STATUS[i % PIE_COLORS_STATUS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<EnterpriseTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center">
                  <CheckCircle2 className="h-12 w-12 text-[#E0E0E0] mx-auto mb-2" />
                  <p className="text-[13px] text-[#9CA3AF]">No CAPA data</p>
                </div>
              )}
            </div>
            {/* Donut Legend */}
            <div className="flex flex-col gap-1.5 mt-2">
              {capaStatusData.map((entry, i) => (
                <div key={entry.name} className="flex items-center justify-between text-[12px]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: PIE_COLORS_STATUS[i % PIE_COLORS_STATUS.length] }} />
                    <span className="text-[#374151]">{entry.name}</span>
                  </div>
                  <span className="font-semibold text-[#1A1818] tabular-nums">{entry.value}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* ============ ROW 4 — BAR CHARTS ============ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Department Incidents */}
          <Panel className="p-5">
            <SectionHeader title="Incidents by Department" onViewAll={() => navigate('/incident-log')} />
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={incDeptData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                  <CartesianGrid vertical={false} {...gridStyle} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ ...axisStyle, fontSize: 10 }} />
                  <YAxis axisLine={false} tickLine={false} tick={axisStyle} />
                  <RechartsTooltip content={<EnterpriseTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                  <Bar dataKey="count" name="Incidents" fill={CHART_COLORS.danger} radius={[3,3,0,0]} barSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          {/* Top Hazard Categories */}
          <Panel className="p-5">
            <SectionHeader title="Top Hazard Categories" onViewAll={() => navigate('/hazard-reporting')} />
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hazCatData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                  <CartesianGrid vertical={false} {...gridStyle} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ ...axisStyle, fontSize: 10 }} />
                  <YAxis axisLine={false} tickLine={false} tick={axisStyle} />
                  <RechartsTooltip content={<EnterpriseTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                  <Bar dataKey="count" name="Hazards" fill={CHART_COLORS.amber} radius={[3,3,0,0]} barSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          {/* Training Hours by Dept */}
          <Panel className="p-5">
            <SectionHeader title="Training Manhours by Dept" onViewAll={() => navigate('/training-records')} />
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trDeptData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                  <CartesianGrid vertical={false} {...gridStyle} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ ...axisStyle, fontSize: 10 }} />
                  <YAxis axisLine={false} tickLine={false} tick={axisStyle} />
                  <RechartsTooltip content={<EnterpriseTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                  <Bar dataKey="count" name="Hours" fill={CHART_COLORS.success} radius={[3,3,0,0]} barSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        {/* ============ ROW 5 — DISTRIBUTION PIE CHARTS ============ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[
            { title: 'Incident Categories', data: incCatData,    colors: PIE_COLORS,        path: '/incident-log'      },
            { title: 'Hazard Risk Ratings', data: riskData,      colors: PIE_COLORS_RISK,   path: '/hazard-reporting'  },
          ].map(({ title, data, colors, path }) => (
            <Panel key={title} className="p-5">
              <SectionHeader title={title} onViewAll={() => navigate(path)} />
              <div className="h-[200px]">
                {data.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={2} dataKey="value">
                        {data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
                      </Pie>
                      <RechartsTooltip content={<EnterpriseTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-[13px] text-[#9CA3AF]">No data available</p>
                  </div>
                )}
              </div>
              {/* Compact legend */}
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                {(data as Array<{ name: string; value: number }>).slice(0,5).map((entry, i) => (
                  <div key={entry.name} className="flex items-center gap-1.5 text-[11px] text-[#6B7280]">
                    <span className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: colors[i % colors.length] }} />
                    {entry.name} ({entry.value})
                  </div>
                ))}
              </div>
            </Panel>
          ))}

          {/* Recent Incidents Quick View */}
          <Panel className="p-5">
            <SectionHeader title="Recent Incidents" onViewAll={() => navigate('/incident-log')} />
            {incidents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle2 className="h-10 w-10 text-[#1B7C1B] mb-2 opacity-60" />
                <p className="text-[13px] font-medium text-[#374151]">No incidents recorded</p>
                <p className="text-[11px] text-[#9CA3AF] mt-0.5">All clear for the selected filters</p>
              </div>
            ) : (
              <div className="space-y-2">
                {incidents.slice(0,5).map((inc) => (
                  <div
                    key={inc.id}
                    onClick={() => navigate('/incident-log')}
                    className="flex items-center justify-between gap-3 p-2.5 rounded border border-[#F3F4F6] hover:border-[#E0E0E0] hover:bg-[#FAFAFA] cursor-pointer transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-[12px] font-medium text-[#1A1818] truncate">{inc.description || '—'}</p>
                      <p className="text-[11px] text-[#9CA3AF]">{inc.date} · {inc.department_id}</p>
                    </div>
                    <StatusBadge status={inc.status_id || 'Open'} size="xs" />
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>

        {/* ============ ROW 6 — PLANT PHOTO CARDS (Stitch Dashboard) ============ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <PlantPhotoCard
            imageUrl={LOCATION_CARD_CONFIG.find(card => card.id === 'lu-sukkur-plant')!.imageUrl}
            title="LU Sukkur Plant"
            subtitle="Operational Excellence & Safety Compliance"
            location="Sukkur Plant Operations"
            alt="LU Sukkur Plant industrial facility"
            fallbackImageUrl="/image.png"
            onClick={() => navigate('/hazard-reporting')}
          />
          <PlantPhotoCard
            imageUrl={LOCATION_CARD_CONFIG.find(card => card.id === 'asset-safety-mapping')!.imageUrl}
            title="Asset Safety Mapping"
            subtitle="Real-time Hazard Tracking Grid"
            badge="REPORT INCIDENT"
            alt="Safety inspector reviewing a power plant checklist"
            fallbackImageUrl="/image.png"
            onClick={() => navigate('/incident-log')}
          />
        </div>

      </div>

      {/* ===== Detail Modals ===== */}
      <CenterModal
        isOpen={isLeadingOpen}
        onClose={() => setIsLeadingOpen(false)}
        title="Leading Indicators — Full Breakdown"
        description="Proactive safety measures and prevention metrics"
      >
        <div className="bg-white border border-[#E0E0E0] rounded-lg overflow-hidden">
          {leadingMetricsDetail.map(metric => (
            <MetricRow key={metric.id} metric={metric} />
          ))}
        </div>
      </CenterModal>

      <CenterModal
        isOpen={isLaggingOpen}
        onClose={() => setIsLaggingOpen(false)}
        title="Lagging Indicators — Full Breakdown"
        description="Reactive safety measures from past incidents"
      >
        <div className="bg-white border border-[#E0E0E0] rounded-lg overflow-hidden">
          {laggingMetricsDetail.map(metric => (
            <MetricRow key={metric.id} metric={metric} />
          ))}
        </div>
      </CenterModal>
    </Layout>
  );
};
