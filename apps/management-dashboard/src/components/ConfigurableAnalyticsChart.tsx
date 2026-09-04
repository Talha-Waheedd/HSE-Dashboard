import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AlertCircle, ArrowRight, LoaderCircle } from 'lucide-react';
import {
  dashboardClient,
  type DashboardAnalyticsPoint,
  type DashboardAnalyticsResult,
} from '@cbl/api';
import type { DashboardChartDefinition } from '../config/dashboardAnalytics';

const SERIES_COLORS = ['#9B111E', '#D97706', '#16A34A', '#2563EB', '#7C3AED', '#0891B2', '#6B7280', '#BE185D'];

type AnalyticsFilters = {
  year?: string;
  department?: string;
  status?: string;
  severity?: string;
  fromDate?: string;
  toDate?: string;
};

type Props = {
  definition: DashboardChartDefinition;
  filters: AnalyticsFilters;
  className?: string;
  chartHeight?: number;
};

const formatValue = (value: number) => value.toLocaleString(undefined, { maximumFractionDigits: 2 });
const shortenLabel = (value: string) => value.length > 14 ? `${value.slice(0, 12)}…` : value;

const AnalyticsTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  const fullLabel = item?.payload?.label || item?.name || label;
  return (
    <div className="rounded-lg border border-[#E0E0E0] bg-white px-3 py-2 shadow-lg">
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#6B7280]">{fullLabel}</p>
      <p className="text-[13px] font-medium text-[#1A1818]">{formatValue(Number(item.value || 0))}</p>
    </div>
  );
};

export const ConfigurableAnalyticsChart = ({
  definition,
  filters,
  className = '',
  chartHeight = 220,
}: Props) => {
  const navigate = useNavigate();
  const [selectedOption, setSelectedOption] = useState(definition.defaultOption);
  const [result, setResult] = useState<DashboardAnalyticsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestSequence = useRef(0);

  const option = useMemo(
    () => definition.options.find(item => item.value === selectedOption) || definition.options[0],
    [definition.options, selectedOption],
  );

  useEffect(() => {
    let active = true;
    const requestId = ++requestSequence.current;
    setLoading(true);
    setError(null);

    dashboardClient.getAnalytics(definition.dataset, {
      groupBy: option.groupBy,
      metric: option.metric,
      limit: option.groupBy === 'month' ? 12 : 10,
      ...filters,
    }).then(response => {
      if (!active || requestId !== requestSequence.current) return;
      setResult(response.data.data);
    }).catch(requestError => {
      if (!active || requestId !== requestSequence.current) return;
      console.error(`Unable to load ${definition.dataset} analytics:`, requestError);
      setResult(null);
      setError('Analytics data could not be loaded.');
    }).finally(() => {
      if (active && requestId === requestSequence.current) setLoading(false);
    });

    return () => { active = false; };
  }, [definition.dataset, filters, option.groupBy, option.metric]);

  const data = result?.data || [];
  const hasData = data.some(item => Number(item.value) > 0);
  const chartType = result?.chartType || (['month', 'year'].includes(option.groupBy) ? 'line' : 'bar');

  const chart = () => {
    if (chartType === 'line') {
      return (
        <LineChart data={data} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#F0F0F0" strokeDasharray="4 4" />
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} tickFormatter={shortenLabel} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} allowDecimals={result?.metric === 'manhours'} />
          <Tooltip content={<AnalyticsTooltip />} />
          <Line type="monotone" dataKey="value" name={result?.unit || 'Count'} stroke={definition.color} strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5, strokeWidth: 0 }} />
        </LineChart>
      );
    }

    if (chartType === 'donut') {
      return (
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="label" cx="50%" cy="50%" innerRadius={52} outerRadius={82} paddingAngle={2}>
            {data.map((item, index) => <Cell key={item.key} fill={SERIES_COLORS[index % SERIES_COLORS.length]} />)}
          </Pie>
          <Tooltip content={<AnalyticsTooltip />} />
        </PieChart>
      );
    }

    return (
      <BarChart data={data} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="#F0F0F0" strokeDasharray="4 4" />
        <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} tickFormatter={shortenLabel} />
        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} allowDecimals={result?.metric === 'manhours'} />
        <Tooltip content={<AnalyticsTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
        <Bar dataKey="value" name={result?.unit || 'Count'} fill={definition.color} radius={[3, 3, 0, 0]} maxBarSize={32} />
      </BarChart>
    );
  };

  return (
    <section
      className={`rounded-lg border border-[#E8E0C8] bg-white p-5 ${className}`}
      style={{ boxShadow: '0 1px 3px 0 rgba(0,0,0,0.08)' }}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className="h-5 w-1 shrink-0 rounded-full bg-[#7B1010]" />
          <h2 className="truncate text-[13px] font-bold uppercase tracking-wider text-[#374151]">{option.title}</h2>
        </div>
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor={`${definition.dataset}-${definition.defaultOption}-grouping`}>Chart grouping</label>
          <select
            id={`${definition.dataset}-${definition.defaultOption}-grouping`}
            value={selectedOption}
            onChange={event => setSelectedOption(event.target.value)}
            className="max-w-[170px] rounded-md border border-[#D8DCE3] bg-white px-2 py-1.5 text-[11px] font-medium text-[#374151] outline-none focus:border-[#9B111E] focus:ring-1 focus:ring-[#9B111E]"
          >
            {definition.options.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
          <button
            type="button"
            onClick={() => navigate(definition.path)}
            className="flex shrink-0 items-center gap-1 text-[11px] font-medium text-[#7B1010] hover:underline"
          >
            View Details <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>

      <div className="relative" style={{ height: chartHeight }}>
        {loading ? (
          <div className="flex h-full items-center justify-center gap-2 text-[12px] text-[#9CA3AF]">
            <LoaderCircle className="h-5 w-5 animate-spin" /> Loading analytics…
          </div>
        ) : error ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-[12px] text-[#B91C1C]">
            <AlertCircle className="h-6 w-6" /> {error}
          </div>
        ) : !hasData ? (
          <div className="flex h-full items-center justify-center text-[13px] text-[#9CA3AF]">No data available</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">{chart()}</ResponsiveContainer>
        )}
      </div>

      {!loading && !error && hasData && chartType === 'donut' && (
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
          {data.map((item: DashboardAnalyticsPoint, index) => (
            <div key={item.key} className="flex items-center gap-1.5 text-[11px] text-[#6B7280]">
              <span className="h-2 w-2 shrink-0 rounded-sm" style={{ backgroundColor: SERIES_COLORS[index % SERIES_COLORS.length] }} />
              <span>{item.label} ({formatValue(item.value)})</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
