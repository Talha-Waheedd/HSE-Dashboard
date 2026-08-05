import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  PieChart, Pie, Cell, ResponsiveContainer,
  Tooltip as RechartsTooltip, LineChart, Line,
} from 'recharts';
import { Layout }           from '../components/Layout';
import { FilterBar }        from '../components/FilterBar';
import { ContextHeader }    from '../components/ContextHeader';
import { KpiTile }          from '../components/KpiTile';
import { useFilters }       from '../context/FilterContext';
import { moduleService }    from '../services/api/moduleService';
import { CHART_COLORS, PIE_COLORS } from '../config/constants';
import {
  BarChart3, ShieldCheck, Timer, TrendingUp, AlertTriangle,
  FileText, RefreshCw, CheckCircle2,
} from 'lucide-react';

// ============================================================
// Analytics — Enterprise BI Analytics Center
// SAP Fiori / Power BI visual language
// ============================================================

const EnterpriseTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#E0E0E0] rounded-lg px-3 py-2"
         style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
      <p className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide mb-1">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey ?? p.name} className="flex items-center gap-2 text-[13px] font-medium">
          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: p.color || p.fill }} />
          <span className="text-[#1A1818]">{p.name ? `${p.name}: ` : ''}{p.value}</span>
        </div>
      ))}
    </div>
  );
};

const Panel = ({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) => (
  <div
    className={`bg-white border border-[#E0E0E0] rounded-lg overflow-hidden ${className}`}
    style={{ boxShadow: '0 1px 4px 0 rgba(0,0,0,0.06)' }}
  >
    <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[#F0F0F0] bg-[#FAFAFA]">
      <div className="w-1 h-4 rounded-full bg-[#CB0017]" />
      <h3 className="text-[12px] font-bold text-[#374151] uppercase tracking-wider">{title}</h3>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const axisStyle  = { fontSize: 11, fill: '#9CA3AF' };
const gridStyle  = { stroke: '#F0F0F0', strokeDasharray: '4 4' };
const PIE_COLORS_RISK = [CHART_COLORS.success, CHART_COLORS.warning, CHART_COLORS.danger, '#7F1D1D'];

export const Analytics = () => {
  const { filters }     = useFilters();
  const [hazards,    setHazards]    = useState<any[]>([]);
  const [incidents,  setIncidents]  = useState<any[]>([]);
  const [nearMisses, setNearMisses] = useState<any[]>([]);
  const [capas,      setCapas]      = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [hRes, iRes, nmRes, capRes] = await Promise.all([
          moduleService.getAll('hazard-reporting'),
          moduleService.getAll('incident-log'),
          moduleService.getAll('near-miss'),
          moduleService.getAll('action-tracker'),
        ]);

        const applyFilters = (data: any[]) => {
          let f = [...data];
          if (filters.department && filters.department !== 'All') f = f.filter(d => d.department_id === filters.department);
          if (filters.year       && filters.year       !== 'All') f = f.filter(d => d.date?.startsWith(filters.year));
          if (filters.fromDate) f = f.filter(d => d.date && d.date >= filters.fromDate);
          if (filters.toDate)   f = f.filter(d => d.date && d.date <= filters.toDate);
          return f;
        };

        setHazards(applyFilters(hRes.data));
        setIncidents(applyFilters(iRes.data));
        setNearMisses(applyFilters(nmRes.data));
        setCapas(applyFilters(capRes.data));
      } catch (err) {
        console.error('Analytics fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filters]);

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
          <RefreshCw className="h-8 w-8 text-[#CB0017] animate-spin" />
          <p className="text-[13px] text-[#6B7280]">Loading analytics data…</p>
        </div>
      </Layout>
    );
  }

  // ===== KPI Computations =====
  const total             = hazards.length;
  const closed            = hazards.filter(o => ['Closed','Close'].includes(o.status_id)).length;
  const closureRate       = total > 0 ? Math.round((closed / total) * 100) : 0;
  const highPriority      = hazards.filter(o => ['High','Critical'].includes(o.risk_rating_id)).length;
  const highPriorityPct   = total > 0 ? Math.round((highPriority / total) * 100) : 0;
  const totalIncidents    = incidents.length;
  const totalNM           = nearMisses.length;
  const overdueCapas      = capas.filter(c => {
    if (['Close','Closed'].includes(c.status_id)) return false;
    return c.due_date && new Date(c.due_date) < new Date();
  }).length;

  // ===== Distribution helpers =====
  const getDistribution = (data: any[], key: string) => {
    const counts = data.reduce((acc, curr) => {
      const val = curr[key] as string;
      if (val) acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return (Object.entries(counts) as Array<[string, number]>)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  };

  const statusData   = getDistribution(hazards,   'status_id');
  const riskData     = getDistribution(hazards,   'risk_rating_id');
  const deptData     = getDistribution(hazards,   'department_id');
  const categoryData = getDistribution(hazards,   'hazard_category_id');
  const incCatData   = getDistribution(incidents, 'incident_category_id');
  const incDeptData  = getDistribution(incidents, 'department_id');

  // ===== 6-month trend =====
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const trendData = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    const m = d.getMonth(), y = d.getFullYear();
    trendData.push({
      name: monthNames[m],
      Hazards:     hazards.filter(x => { const dt = new Date(x.date); return dt.getMonth()===m && dt.getFullYear()===y; }).length,
      Incidents:   incidents.filter(x => { const dt = new Date(x.date); return dt.getMonth()===m && dt.getFullYear()===y; }).length,
      'Near Miss': nearMisses.filter(x => { const dt = new Date(x.date); return dt.getMonth()===m && dt.getFullYear()===y; }).length,
    });
  }

  return (
    <Layout>
      <ContextHeader
        title="HSE Analytics"
        breadcrumbs={['Reporting', 'Analytics']}
        subtitle="Comprehensive data analysis across all HSE modules"
      >
        <FilterBar />
      </ContextHeader>

      <div className="p-6 space-y-6">

        {/* KPI Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <KpiTile label="Total Hazards"      value={total}           accent="warning" icon={<AlertTriangle />} trendLabel="logged" />
          <KpiTile label="Hazard Closure Rate" value={`${closureRate}%`} accent={closureRate >= 80 ? 'success' : 'warning'} icon={<ShieldCheck />} />
          <KpiTile label="High/Critical"       value={highPriority}    accent={highPriority > 0 ? 'danger' : 'success'} icon={<TrendingUp />} unit={`${highPriorityPct}%`} />
          <KpiTile label="Total Incidents"     value={totalIncidents}  accent="danger"  icon={<FileText />}    trendLabel="total" />
          <KpiTile label="Near Misses"          value={totalNM}         accent="neutral" icon={<BarChart3 />}   trendLabel="reported" />
          <KpiTile label="Overdue CAPAs"        value={overdueCapas}    accent={overdueCapas > 0 ? 'danger' : 'success'} icon={<Timer />} trendLabel="past due" />
        </div>

        {/* Trend Chart */}
        <Panel title="Safety Incident Trends — Last 6 Months" className="">
          <div className="flex items-center gap-5 mb-4">
            {[
              { label: 'Hazards',    color: CHART_COLORS.warning },
              { label: 'Incidents',  color: CHART_COLORS.danger },
              { label: 'Near Miss',  color: CHART_COLORS.info },
            ].map(({ label, color }) => (
              <div key={label} className="flex items-center gap-1.5 text-[11px] text-[#6B7280]">
                <span className="inline-block w-3 h-0.5 rounded" style={{ backgroundColor: color }} />
                {label}
              </div>
            ))}
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid vertical={false} {...gridStyle} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={axisStyle} />
                <YAxis axisLine={false} tickLine={false} tick={axisStyle} />
                <RechartsTooltip content={<EnterpriseTooltip />} />
                <Line type="monotone" dataKey="Hazards"    stroke={CHART_COLORS.warning} strokeWidth={2.5} dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
                <Line type="monotone" dataKey="Incidents"  stroke={CHART_COLORS.danger}  strokeWidth={2.5} dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
                <Line type="monotone" dataKey="Near Miss"  stroke={CHART_COLORS.info}    strokeWidth={2.5} dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        {/* Row 1: Dept + Incident Category bars */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Panel title="Hazards by Department">
            <div className="h-[240px]">
              {deptData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={deptData} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid horizontal={false} {...gridStyle} />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={axisStyle} />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ ...axisStyle, fontSize: 11 }} width={48} />
                    <RechartsTooltip content={<EnterpriseTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                    <Bar dataKey="value" name="Hazards" fill={CHART_COLORS.warning} radius={[0,3,3,0]} barSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-[13px] text-[#9CA3AF]">No data available</p>
                </div>
              )}
            </div>
          </Panel>

          <Panel title="Incidents by Category">
            <div className="h-[240px]">
              {incCatData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={incCatData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                    <CartesianGrid vertical={false} {...gridStyle} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ ...axisStyle, fontSize: 10 }} />
                    <YAxis axisLine={false} tickLine={false} tick={axisStyle} />
                    <RechartsTooltip content={<EnterpriseTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                    <Bar dataKey="value" name="Incidents" fill={CHART_COLORS.danger} radius={[3,3,0,0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-[13px] text-[#9CA3AF]">No data available</p>
                </div>
              )}
            </div>
          </Panel>
        </div>

        {/* Row 2: Distribution pies */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: 'Hazard Status',      data: statusData,   colors: PIE_COLORS },
            { title: 'Risk Ratings',       data: riskData,     colors: PIE_COLORS_RISK },
            { title: 'Hazard Categories',  data: categoryData, colors: PIE_COLORS },
            { title: 'Incident Dept',      data: incDeptData,  colors: PIE_COLORS },
          ].map(({ title, data, colors }) => (
            <div
              key={title}
              className="bg-white border border-[#E0E0E0] rounded-lg p-4"
              style={{ boxShadow: '0 1px 4px 0 rgba(0,0,0,0.06)' }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-4 rounded-full bg-[#CB0017]" />
                <h3 className="text-[11px] font-bold text-[#374151] uppercase tracking-wider">{title}</h3>
              </div>
              {data.length > 0 ? (
                <>
                  <div className="h-[150px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={data} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={2} dataKey="value">
                          {data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
                        </Pie>
                        <RechartsTooltip content={<EnterpriseTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-1.5 mt-2">
                    {data.slice(0,4).map((entry: { name: string; value: number }, i: number) => (
                      <div key={entry.name} className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: colors[i % colors.length] }} />
                          <span className="text-[#6B7280] truncate">{entry.name}</span>
                        </div>
                        <span className="font-semibold text-[#1A1818] tabular-nums ml-2">{entry.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-[150px]">
                  <p className="text-[12px] text-[#9CA3AF]">No data</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Hazard Category Bar */}
        <Panel title="Hazard Categories — Full Breakdown">
          <div className="h-[240px]">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                  <CartesianGrid vertical={false} {...gridStyle} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ ...axisStyle, fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={axisStyle} />
                  <RechartsTooltip content={<EnterpriseTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                  <Bar dataKey="value" name="Hazards" fill={CHART_COLORS.warning} radius={[3,3,0,0]} barSize={28} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-2">
                <CheckCircle2 className="h-10 w-10" style={{ color: '#E0E0E0' }} />
                <p className="text-[13px] text-[#9CA3AF]">No hazard category data for selected filters</p>
              </div>
            )}
          </div>
        </Panel>

      </div>
    </Layout>
  );
};
