import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
  LineChart, Line,
} from 'recharts';
import { Layout }               from '../components/Layout';
import { CenterModal }          from '../components/CenterModal';
import { KpiTile }              from '../components/KpiTile';
import { FilterBar }            from '../components/FilterBar';
import { ContextHeader }        from '../components/ContextHeader';
import { StatusBadge }          from '../components/StatusBadge';
import { PlantPhotoCard }       from '../components/PlantPhotoCard';
import { ConfigurableAnalyticsChart } from '../components/ConfigurableAnalyticsChart';
import { useFilters }           from '../context/FilterContext';
import {
  CheckCircle2, FileWarning,
  BookOpen, AlertTriangle, ArrowRight, ShieldAlert,
  CheckCircle, XCircle, Info, RefreshCw,
  ChevronUp, ChevronDown,
} from 'lucide-react';
import { dashboardClient, type DashboardIndicatorPreferences } from '@cbl/api';
import { CHART_COLORS } from '../config/constants';
import { DASHBOARD_CHARTS } from '../config/dashboardAnalytics';
import {
  DEFAULT_DASHBOARD_INDICATOR_IDS,
  useDashboardMetrics,
  type DashboardRawData,
  type MetricItem,
} from '../hooks/useDashboardMetrics';

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
const MetricRow = ({ metric, selected, onSelectionChange, selectionDisabled = false }: {
  metric: MetricItem;
  selected: boolean;
  onSelectionChange: (metricId: string) => void;
  selectionDisabled?: boolean;
}) => {
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
        selected ? 'bg-[#FFF7F7]' : ''
      } ${
        isClickable ? 'cursor-pointer hover:bg-[#F9FAFB] transition-colors' : ''
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <label
          className="flex shrink-0 cursor-pointer items-center"
          onClick={event => event.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={selected}
            disabled={selectionDisabled}
            onChange={() => onSelectionChange(metric.id)}
            aria-label={`Show ${metric.name} on the dashboard`}
            className="h-4 w-4 rounded border-[#CBD5E1] accent-[#9B111E]"
          />
        </label>
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

const DashboardMetricCard = ({ metric, onOpen }: { metric: MetricItem; onOpen: () => void }) => {
  const Icon = metric.status === 'success'
    ? CheckCircle
    : metric.status === 'warning'
      ? AlertTriangle
      : metric.status === 'danger'
        ? XCircle
        : Info;
  const clickable = Boolean(metric.path && !metric.isPendingModule);
  const value = typeof metric.value === 'number'
    ? metric.value.toLocaleString(undefined, { maximumFractionDigits: 2 })
    : metric.value;

  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={!clickable}
      className={`flex min-h-[116px] flex-col items-center justify-center rounded-lg border border-[#F0F0F0] p-3 text-center transition-colors ${metric.bgClass || 'bg-white'} ${
        clickable ? 'cursor-pointer hover:bg-[#F9FAFB]' : 'cursor-default'
      }`}
    >
      <Icon className={`mb-2 h-5 w-5 ${metric.iconClass || 'text-[#6B7280]'}`} />
      <p className="text-[20px] font-bold text-[#1A1818] tabular-nums">
        {value}
        {metric.unit === '%' && <span className="ml-0.5 text-[14px] font-normal">%</span>}
      </p>
      <p className="mt-0.5 text-[11px] leading-tight text-[#4B5563]">{metric.name}</p>
      {metric.unit && metric.unit !== '%' && (
        <p className="mt-1 text-[10px] text-[#9CA3AF]">{metric.unit}</p>
      )}
    </button>
  );
};

// ===== Section Header =====
const SectionHeader = ({ title, onViewAll, onToggle, expanded, control }: {
  title: string; onViewAll?: () => void; onToggle?: () => void; expanded?: boolean; control?: React.ReactNode;
}) => (
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-2">
      <div className="w-1 h-5 rounded-full" style={{ backgroundColor: '#7B1010' }} />
      <h2 className="text-[13px] font-bold text-[#374151] uppercase tracking-wider">{title}</h2>
    </div>
    <div className="flex items-center gap-2">
      {control}
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

export const Dashboard = () => {
  const navigate    = useNavigate();
  const { filters } = useFilters();
  const [loading,   setLoading]   = useState(true);
  const [isLeadingOpen, setIsLeadingOpen] = useState(false);
  const [isLaggingOpen, setIsLaggingOpen] = useState(false);
  const [indicatorPreferences, setIndicatorPreferences] = useState<DashboardIndicatorPreferences>({
    leadingIndicatorIds: [...DEFAULT_DASHBOARD_INDICATOR_IDS.leading],
    laggingIndicatorIds: [...DEFAULT_DASHBOARD_INDICATOR_IDS.lagging],
    customized: false,
  });
  const [leadingSelection, setLeadingSelection] = useState<string[]>([
    ...DEFAULT_DASHBOARD_INDICATOR_IDS.leading,
  ]);
  const [laggingSelection, setLaggingSelection] = useState<string[]>([
    ...DEFAULT_DASHBOARD_INDICATOR_IDS.lagging,
  ]);
  const [leadingSelectionMessage, setLeadingSelectionMessage] = useState<string | null>(null);
  const [laggingSelectionMessage, setLaggingSelectionMessage] = useState<string | null>(null);
  const [savingPreference, setSavingPreference] = useState<'leading' | 'lagging' | null>(null);
  const [safetyTrendSelection, setSafetyTrendSelection] = useState('all');

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
    let active = true;
    dashboardClient.getIndicatorPreferences()
      .then(response => {
        if (!active) return;
        const preferences = response.data.data;
        setIndicatorPreferences(preferences);
        setLeadingSelection([...preferences.leadingIndicatorIds]);
        setLaggingSelection([...preferences.laggingIndicatorIds]);
      })
      .catch(error => {
        console.error('Unable to load dashboard indicator preferences:', error);
      });
    return () => { active = false; };
  }, []);

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
          hazards: { total: summary.hazards?.total || 0, Open: summary.hazards?.open || 0, Closed: summary.hazards?.closed || 0, severity: summary.hazards?.severity || {}, byCategory: overview.charts?.hazards || {} },
          nearMisses: { total: summary.nearMisses?.total || 0 },
          incidents: { total: summary.incidents?.total || 0, LTI: summary.incidents?.lti || 0, RWC: summary.incidents?.rwc || 0, MTC: summary.incidents?.mtc || 0, 'First Aid': summary.incidents?.firstAid || 0, Fatality: summary.incidents?.fatalities || 0, Fire: summary.incidents?.fire || 0 },
          training: {
            total: summary.training?.total || 0,
            participants: summary.training?.participants || 0,
            manhours: summary.training?.manhours || 0,
          },
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

  const selectedMetrics = (ids: string[], available: MetricItem[], fallbackIds: readonly string[]) => {
    const byId = new Map(available.map(metric => [metric.id, metric]));
    const selected = ids.map(id => byId.get(id)).filter((metric): metric is MetricItem => Boolean(metric));
    return selected.length > 0
      ? selected
      : fallbackIds.map(id => byId.get(id)).filter((metric): metric is MetricItem => Boolean(metric));
  };

  const selectedLeadingMetrics = selectedMetrics(
    indicatorPreferences.leadingIndicatorIds,
    leadingMetricsDetail,
    DEFAULT_DASHBOARD_INDICATOR_IDS.leading,
  );
  const selectedLaggingMetrics = selectedMetrics(
    indicatorPreferences.laggingIndicatorIds,
    laggingMetricsDetail,
    DEFAULT_DASHBOARD_INDICATOR_IDS.lagging,
  );

  const openLeadingSelection = () => {
    setLeadingSelection([...indicatorPreferences.leadingIndicatorIds]);
    setLeadingSelectionMessage(null);
    setIsLeadingOpen(true);
  };

  const openLaggingSelection = () => {
    setLaggingSelection([...indicatorPreferences.laggingIndicatorIds]);
    setLaggingSelectionMessage(null);
    setIsLaggingOpen(true);
  };

  const toggleIndicatorSelection = (kind: 'leading' | 'lagging', metricId: string) => {
    const selection = kind === 'leading' ? leadingSelection : laggingSelection;
    const setSelection = kind === 'leading' ? setLeadingSelection : setLaggingSelection;
    const setMessage = kind === 'leading' ? setLeadingSelectionMessage : setLaggingSelectionMessage;

    if (selection.includes(metricId)) {
      setSelection(selection.filter(id => id !== metricId));
      setMessage(null);
      return;
    }
    if (selection.length >= 3) {
      setMessage('You can select up to 3 indicators.');
      return;
    }
    setSelection([...selection, metricId]);
    setMessage(null);
  };

  const saveIndicatorSelection = async (kind: 'leading' | 'lagging') => {
    const selection = kind === 'leading' ? leadingSelection : laggingSelection;
    const setMessage = kind === 'leading' ? setLeadingSelectionMessage : setLaggingSelectionMessage;
    if (selection.length === 0) {
      setMessage('Select at least one indicator.');
      return;
    }

    setSavingPreference(kind);
    setMessage(null);
    try {
      const response = await dashboardClient.updateIndicatorPreferences({
        leadingIndicatorIds: kind === 'leading' ? selection : indicatorPreferences.leadingIndicatorIds,
        laggingIndicatorIds: kind === 'lagging' ? selection : indicatorPreferences.laggingIndicatorIds,
      });
      setIndicatorPreferences(response.data.data);
      if (kind === 'leading') setIsLeadingOpen(false);
      else setIsLaggingOpen(false);
    } catch (error) {
      console.error('Unable to save dashboard indicator preferences:', error);
      setMessage('Unable to save the selection. Please try again.');
    } finally {
      setSavingPreference(null);
    }
  };

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

  const totalTrainingParticipants = useAggregateStats ? dashboardStats.training?.participants ?? 0 : 0;
  const totalTrainingManhours  = useAggregateStats ? Number(dashboardStats.training?.manhours || 0) : Math.round(training.reduce((sum, t) => sum + (Number(t.manhours) || 0), 0));
  const hazardComparison = dashboardOverview?.comparisons?.hazards;
  const incidentComparison = dashboardOverview?.comparisons?.incidents;

  const totalClosedCapas = useAggregateStats && dashboardStats.correctiveActions
    ? (Number(dashboardStats.correctiveActions.Closed) || 0) + (Number(dashboardStats.correctiveActions.Close) || 0)
    : capas.filter(c => c.status_id === 'Close' || c.status_id === 'Closed').length;
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

  const safetyTrendSeries = [
    { key: 'Incidents', color: CHART_COLORS.danger },
    { key: 'Hazards', color: CHART_COLORS.amber },
    { key: 'Near Misses', color: CHART_COLORS.info },
  ].filter(series => safetyTrendSelection === 'all' || series.key === safetyTrendSelection);

  const analyticsFilters = useMemo(() => ({
    year: filters.year,
    department: filters.department,
    status: filters.status,
    severity: filters.riskRating,
    fromDate: filters.fromDate || undefined,
    toDate: filters.toDate || undefined,
  }), [filters.department, filters.fromDate, filters.riskRating, filters.status, filters.toDate, filters.year]);

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
            trend={Number(hazardComparison?.delta || 0)}
            trendLabel={`vs ${hazardComparison?.previousPeriod || 'previous month'}`}
            subtleLine="Reports in selected scope"
            onClick={() => navigate('/hazard-reporting')}
          />
          <KpiTile
            label="Total Incidents"
            value={totalIncidents}
            accent="danger"
            icon={<FileWarning />}
            trend={Number(incidentComparison?.delta || 0)}
            trendLabel={`vs ${incidentComparison?.previousPeriod || 'previous year'}`}
            subtleLine="Safety events logged"
            onClick={() => navigate('/incident-log')}
          />
          <KpiTile
            label="Training Hrs"
            value={totalTrainingManhours.toLocaleString()}
            accent="success"
            icon={<BookOpen />}
            subtleLine={`${totalTrainingParticipants.toLocaleString()} participant attendances`}
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
              onViewAll={openLeadingSelection}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {selectedLeadingMetrics.map(metric => (
                <DashboardMetricCard
                  key={metric.id}
                  metric={metric}
                  onOpen={() => metric.path && navigate(metric.path)}
                />
              ))}
            </div>
          </Panel>

          {/* Lagging Indicators */}
          <Panel className="p-5">
            <SectionHeader
              title="Lagging Indicators"
              onViewAll={openLaggingSelection}
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {selectedLaggingMetrics.map(metric => (
                <DashboardMetricCard
                  key={metric.id}
                  metric={metric}
                  onOpen={() => metric.path && navigate(metric.path)}
                />
              ))}
            </div>
          </Panel>
        </div>

        {/* ============ ROW 3 — TREND CHART + CAPA DONUT ============ */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Safety Trends (60%) */}
          <Panel className="lg:col-span-3 p-5">
            <SectionHeader
              title="Safety Trends — Last 6 Months"
              control={(
                <>
                  <label className="sr-only" htmlFor="safety-trend-series">Safety trend series</label>
                  <select
                    id="safety-trend-series"
                    value={safetyTrendSelection}
                    onChange={event => setSafetyTrendSelection(event.target.value)}
                    className="max-w-[150px] rounded-md border border-[#D8DCE3] bg-white px-2 py-1.5 text-[11px] font-medium text-[#374151] outline-none focus:border-[#9B111E] focus:ring-1 focus:ring-[#9B111E]"
                  >
                    <option value="all">All Sources</option>
                    <option value="Incidents">Incidents</option>
                    <option value="Hazards">Hazards</option>
                    <option value="Near Misses">Near Misses</option>
                  </select>
                </>
              )}
            />
            {/* Legend */}
            <div className="flex items-center gap-4 mb-4">
              {safetyTrendSeries.map(({ key, color }) => (
                <div key={key} className="flex items-center gap-1.5">
                  <span className="inline-block w-3 h-0.5 rounded" style={{ backgroundColor: color }} />
                  <span className="text-[11px] text-[#6B7280]">{key}</span>
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
                  {safetyTrendSeries.map(({ key, color }) => (
                    <Line key={key} type="monotone" dataKey={key} stroke={color} strokeWidth={2.5} dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <ConfigurableAnalyticsChart
            definition={DASHBOARD_CHARTS.capa}
            filters={analyticsFilters}
            className="lg:col-span-2"
            chartHeight={240}
          />
        </div>

        {/* ============ ROW 4 — CONFIGURABLE ANALYTICS ============ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <ConfigurableAnalyticsChart definition={DASHBOARD_CHARTS.incidentDepartment} filters={analyticsFilters} />
          <ConfigurableAnalyticsChart definition={DASHBOARD_CHARTS.hazardCategory} filters={analyticsFilters} />
          <ConfigurableAnalyticsChart definition={DASHBOARD_CHARTS.training} filters={analyticsFilters} />
        </div>

        {/* ============ ROW 5 — CONFIGURABLE DISTRIBUTIONS ============ */}
        <div>

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
                      <p className="text-[11px] text-[#9CA3AF]">{inc.date} · {inc.department || 'Unassigned'}</p>
                    </div>
                    <StatusBadge status={inc.status || inc.status_id || 'Open'} size="xs" />
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>

        {/* ============ ROW 6 — ADDITIONAL HSE ANALYTICS ============ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <ConfigurableAnalyticsChart definition={DASHBOARD_CHARTS.nearMiss} filters={analyticsFilters} />
          <ConfigurableAnalyticsChart definition={DASHBOARD_CHARTS.fire} filters={analyticsFilters} />
          <ConfigurableAnalyticsChart definition={DASHBOARD_CHARTS.audits} filters={analyticsFilters} />
        </div>

        {/* ============ ROW 7 — PLANT PHOTO CARDS (Stitch Dashboard) ============ */}
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
        description="Proactive safety measures and prevention metrics. Select up to 3 for your dashboard."
      >
        <div className="bg-white border border-[#E0E0E0] rounded-lg overflow-hidden">
          {leadingMetricsDetail.map(metric => (
            <MetricRow
              key={metric.id}
              metric={metric}
              selected={leadingSelection.includes(metric.id)}
              selectionDisabled={savingPreference === 'leading'}
              onSelectionChange={metricId => toggleIndicatorSelection('leading', metricId)}
            />
          ))}
        </div>
        <div className="mt-4 flex flex-col gap-3 border-t border-[#E5E7EB] pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[12px] font-medium text-[#4B5563]">{leadingSelection.length} of 3 selected</p>
            {leadingSelectionMessage && <p className="mt-1 text-[12px] text-[#B91C1C]">{leadingSelectionMessage}</p>}
          </div>
          <button
            type="button"
            onClick={() => saveIndicatorSelection('leading')}
            disabled={savingPreference !== null}
            className="rounded-md bg-[#9B111E] px-5 py-2.5 text-[12px] font-semibold text-white hover:bg-[#7B1010] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {savingPreference === 'leading' ? 'Saving…' : 'Save Selection'}
          </button>
        </div>
      </CenterModal>

      <CenterModal
        isOpen={isLaggingOpen}
        onClose={() => setIsLaggingOpen(false)}
        title="Lagging Indicators — Full Breakdown"
        description="Reactive safety measures from past incidents. Select up to 3 for your dashboard."
      >
        <div className="bg-white border border-[#E0E0E0] rounded-lg overflow-hidden">
          {laggingMetricsDetail.map(metric => (
            <MetricRow
              key={metric.id}
              metric={metric}
              selected={laggingSelection.includes(metric.id)}
              selectionDisabled={savingPreference === 'lagging'}
              onSelectionChange={metricId => toggleIndicatorSelection('lagging', metricId)}
            />
          ))}
        </div>
        <div className="mt-4 flex flex-col gap-3 border-t border-[#E5E7EB] pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[12px] font-medium text-[#4B5563]">{laggingSelection.length} of 3 selected</p>
            {laggingSelectionMessage && <p className="mt-1 text-[12px] text-[#B91C1C]">{laggingSelectionMessage}</p>}
          </div>
          <button
            type="button"
            onClick={() => saveIndicatorSelection('lagging')}
            disabled={savingPreference !== null}
            className="rounded-md bg-[#9B111E] px-5 py-2.5 text-[12px] font-semibold text-white hover:bg-[#7B1010] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {savingPreference === 'lagging' ? 'Saving…' : 'Save Selection'}
          </button>
        </div>
      </CenterModal>
    </Layout>
  );
};
