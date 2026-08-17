import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { ContextHeader } from '../components/ContextHeader';
import { dashboardClient } from '@cbl/api';
import { KpiTile } from '../components/KpiTile';
import { CHART_COLORS, PIE_COLORS } from '../config/constants';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  PieChart, Pie, Cell, ResponsiveContainer,
  Tooltip as RechartsTooltip, Legend,
} from 'recharts';
import {
  AlertTriangle, Target, Flame, Activity, FileWarning, ShieldAlert, GraduationCap, ClipboardCheck, SearchCheck
} from 'lucide-react';

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

export const LeadingLaggingIndicators = () => {
  const [data, setData] = useState({
    fatalities: 0,
    lti: 0,
    firstAid: 0,
    mtc: 0,
    rwc: 0,
    majorFire: 0,
    minorFire: 0,
    hazards: 0,
    nearMisses: 0,
    training: 0,
    audits: 0,
    inspections: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await dashboardClient.getAnalyticsOverview();
        const overview = response.data?.data;
        if (!overview) throw new Error('Analytics overview returned no data');
        const hazardSummary = overview.summary?.hazards || {};
        const nearMissSummary = overview.summary?.nearMisses || {};
        const incidentSummary = overview.summary?.incidents || {};
        const trainingSummary = overview.summary?.training || {};

        let fatalities = 0;
        let lti = 0;
        let firstAid = 0;
        let mtc = 0;
        let rwc = 0;
        let majorFire = 0;
        let minorFire = 0;

        const byType = incidentSummary.byType || {};
        fatalities = Number(byType.fatality || incidentSummary.fatalities || 0);
        lti = Number(byType.lti || incidentSummary.lti || 0);
        firstAid = Number(byType.first_aid || incidentSummary.firstAid || 0);
        mtc = Number(byType.mtc || incidentSummary.mtc || 0);
        rwc = Number(byType.rwc || incidentSummary.rwc || 0);
        majorFire = Number(byType.major_fire || 0);
        minorFire = Number(byType.minor_fire || 0);

        if (cancelled) return;
        setData({
          fatalities,
          lti,
          firstAid,
          mtc,
          rwc,
          majorFire,
          minorFire,
          hazards: Number(hazardSummary.total || 0),
          nearMisses: Number(nearMissSummary.total || 0),
          training: Number(trainingSummary.total || 0),
          audits: Number(overview.summary?.audits || 0),
          inspections: Number(overview.summary?.inspections || 0),
        });
      } catch (err) {
        console.error('Error fetching data for leading/lagging indicators:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    const refreshHandler = () => fetchData();
    window.addEventListener('dashboard-refresh', refreshHandler);
    const interval = window.setInterval(refreshHandler, 30000);
    return () => {
      cancelled = true;
      window.removeEventListener('dashboard-refresh', refreshHandler);
      window.clearInterval(interval);
    };
  }, []);

  const laggingData = [
    { name: 'Fatalities', value: data.fatalities, fill: PIE_COLORS[5] },
    { name: 'LTI', value: data.lti, fill: PIE_COLORS[0] },
    { name: 'RWC', value: data.rwc, fill: PIE_COLORS[1] },
    { name: 'MTC', value: data.mtc, fill: PIE_COLORS[2] },
    { name: 'First Aid', value: data.firstAid, fill: PIE_COLORS[2] },
    { name: 'Fire', value: data.majorFire + data.minorFire, fill: PIE_COLORS[3] },
  ];

  const leadingData = [
    { name: 'Training', value: data.training, fill: CHART_COLORS.success },
    { name: 'Audits', value: data.audits, fill: CHART_COLORS.primary },
    { name: 'Inspections', value: data.inspections, fill: CHART_COLORS.info },
    { name: 'Hazards', value: data.hazards, fill: CHART_COLORS.warning },
    { name: 'Near Misses', value: data.nearMisses, fill: CHART_COLORS.danger },
  ];

  // Only keep metrics with values > 0 for the pie chart to keep it clean
  const incidentBreakdown = laggingData.filter(d => d.value > 0);
  if (incidentBreakdown.length === 0) {
    incidentBreakdown.push({ name: 'No Incidents', value: 1, fill: CHART_COLORS.neutral });
  }

  return (
    <Layout>
      <div className="flex-1 overflow-y-auto bg-gray-50/50">
        <ContextHeader 
          title="Leading and Lagging Indicator" 
          breadcrumbs={['Reporting', 'Leading and Lagging Indicator']}
          subtitle="Visual dashboard of HSE key performance indicators"
        />
        
        <div className="p-6 max-w-[1600px] mx-auto space-y-6">
          {loading ? (
            <div className="p-12 text-center text-gray-500 flex flex-col items-center">
               <div className="w-8 h-8 border-4 border-[#CB0017] border-t-transparent rounded-full animate-spin mb-4"></div>
               Loading metrics...
            </div>
          ) : (
            <>
              <section className="rounded-2xl border border-[#DDEFE2] bg-[#F8FCF9] p-5 sm:p-6">
                <div className="flex items-start gap-3 border-b border-[#DDEFE2] pb-4">
                  <div className="rounded-lg bg-[#E8F6EC] p-2 text-[#15803D]"><Activity className="h-5 w-5" /></div>
                  <div><h2 className="text-xl font-bold text-[#1A1818]">Leading Indicators</h2><p className="mt-1 text-[12px] text-[#6B7280]">Proactive activities that help prevent incidents.</p></div>
                </div>
                <div className="mt-5 space-y-5">
                  <div><h3 className="mb-3 flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-[#374151]"><GraduationCap className="h-4 w-4 text-[#15803D]" /> Engagement & reporting</h3><div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"><KpiTile label="HSE Training" value={data.training} icon={<GraduationCap />} accent="success" /><KpiTile label="Hazard Reports" value={data.hazards} icon={<AlertTriangle />} accent="success" /><KpiTile label="Near-Miss Reports" value={data.nearMisses} icon={<Target />} accent="warning" /></div></div>
                  <div><h3 className="mb-3 flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-[#374151]"><SearchCheck className="h-4 w-4 text-[#2563EB]" /> Assurance activities</h3><div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><KpiTile label="HSE Audits" value={data.audits} icon={<ClipboardCheck />} accent="info" /><KpiTile label="HSE Inspections" value={data.inspections} icon={<SearchCheck />} accent="info" /></div></div>
                </div>
              </section>

              <section className="rounded-2xl border border-[#F3DADA] bg-[#FFF9F9] p-5 sm:p-6">
                <div className="flex items-start gap-3 border-b border-[#F3DADA] pb-4">
                  <div className="rounded-lg bg-[#FDECEC] p-2 text-[#B91C1C]"><ShieldAlert className="h-5 w-5" /></div>
                  <div><h2 className="text-xl font-bold text-[#1A1818]">Lagging Indicators</h2><p className="mt-1 text-[12px] text-[#6B7280]">Recordable outcomes retrieved from incident records.</p></div>
                </div>
                <div className="mt-5 space-y-5">
                  <div><h3 className="mb-3 flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-[#374151]"><FileWarning className="h-4 w-4 text-[#B91C1C]" /> Injury and illness outcomes</h3><div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"><KpiTile label="First-Aid Cases" value={data.firstAid} icon={<Activity />} accent="info" /><KpiTile label="Medical Treatment Cases" value={data.mtc} icon={<FileWarning />} accent={data.mtc > 0 ? 'warning' : 'success'} /><KpiTile label="Restricted Work Cases" value={data.rwc} icon={<FileWarning />} accent={data.rwc > 0 ? 'warning' : 'success'} /><KpiTile label="Lost-Time Injuries" value={data.lti} icon={<AlertTriangle />} accent={data.lti > 0 ? 'danger' : 'success'} /></div></div>
                  <div><h3 className="mb-3 flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-[#374151]"><ShieldAlert className="h-4 w-4 text-[#B91C1C]" /> Severe events</h3><div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"><KpiTile label="Fatalities" value={data.fatalities} icon={<ShieldAlert />} accent={data.fatalities > 0 ? 'danger' : 'success'} /><KpiTile label="Fire Incidents" value={data.majorFire + data.minorFire} icon={<Flame />} accent={data.majorFire + data.minorFire > 0 ? 'danger' : 'success'} /></div></div>
                </div>
              </section>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                
                {/* Lagging Breakdown Bar Chart */}
                <Panel title="Lagging Indicators Breakdown">
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={laggingData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                        <RechartsTooltip content={<EnterpriseTooltip />} cursor={{ fill: '#F3F4F6' }} />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={60} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Panel>

                {/* Leading Comparison Bar Chart */}
                <Panel title="Leading Indicators Comparison">
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={leadingData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                        <RechartsTooltip content={<EnterpriseTooltip />} cursor={{ fill: '#F3F4F6' }} />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={60} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Panel>

                {/* Incident Distribution Pie Chart */}
                <Panel title="Incident Categorization Distribution">
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={incidentBreakdown}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={90}
                          paddingAngle={2}
                          dataKey="value"
                          stroke="none"
                        >
                          {incidentBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <RechartsTooltip content={<EnterpriseTooltip />} />
                        <Legend 
                          verticalAlign="bottom" 
                          height={36} 
                          iconType="circle" 
                          wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} 
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </Panel>

              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};
