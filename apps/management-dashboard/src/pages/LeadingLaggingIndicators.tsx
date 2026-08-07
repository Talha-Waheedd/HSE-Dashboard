import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { ContextHeader } from '../components/ContextHeader';
import { moduleService } from '../services/api/moduleService';
import { KpiTile } from '../components/KpiTile';
import { CHART_COLORS, PIE_COLORS } from '../config/constants';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  PieChart, Pie, Cell, ResponsiveContainer,
  Tooltip as RechartsTooltip, Legend,
} from 'recharts';
import {
  AlertTriangle, Target, Flame, Activity, FileWarning, ShieldAlert
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
    rwc_mtc: 0,
    firstAid: 0,
    majorFire: 0,
    minorFire: 0,
    hazards: 0,
    nearMisses: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [hazardsRes, nearMissRes, incidentsRes] = await Promise.all([
          moduleService.getAll('hazard-reporting'),
          moduleService.getAll('near-miss'),
          moduleService.getAll('incident-log')
        ]);

        const hazards = hazardsRes.data || [];
        const nearMisses = nearMissRes.data || [];
        const incidents = incidentsRes.data || [];

        let fatalities = 0;
        let lti = 0;
        let rwc_mtc = 0;
        let firstAid = 0;
        let majorFire = 0;
        let minorFire = 0;

        incidents.forEach(inc => {
          const cat = inc.incident_category_id?.toLowerCase() || '';
          if (cat.includes('fatality')) fatalities++;
          else if (cat.includes('lti')) lti++;
          else if (cat.includes('rwc') || cat.includes('mtc')) rwc_mtc++;
          else if (cat.includes('first aid')) firstAid++;
          else if (cat.includes('major fire')) majorFire++;
          else if (cat.includes('minor fire')) minorFire++;
        });

        setData({
          fatalities,
          lti,
          rwc_mtc,
          firstAid,
          majorFire,
          minorFire,
          hazards: hazards.length,
          nearMisses: nearMisses.length,
        });
      } catch (err) {
        console.error('Error fetching data for leading/lagging indicators:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const laggingData = [
    { name: 'Fatalities', value: data.fatalities, fill: PIE_COLORS[5] },
    { name: 'LTI', value: data.lti, fill: PIE_COLORS[0] },
    { name: 'RWC/MTC', value: data.rwc_mtc, fill: PIE_COLORS[1] },
    { name: 'First Aid', value: data.firstAid, fill: PIE_COLORS[2] },
    { name: 'Fire', value: data.majorFire + data.minorFire, fill: PIE_COLORS[3] },
  ];

  const leadingData = [
    { name: 'Hazards', value: data.hazards, fill: CHART_COLORS.success },
    { name: 'Near Misses', value: data.nearMisses, fill: CHART_COLORS.warning },
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
              {/* Lagging Indicators KPI Tiles */}
              <div>
                <h2 className="text-lg font-bold text-[#1A1818] mb-4">Lagging Indicators</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  <KpiTile title="Fatal Incidents" value={data.fatalities} icon={ShieldAlert} color={data.fatalities > 0 ? "danger" : "success"} />
                  <KpiTile title="LTI" value={data.lti} icon={AlertTriangle} color={data.lti > 0 ? "danger" : "success"} />
                  <KpiTile title="RWC / MTC" value={data.rwc_mtc} icon={FileWarning} color={data.rwc_mtc > 0 ? "warning" : "success"} />
                  <KpiTile title="First Aid" value={data.firstAid} icon={Activity} color="info" />
                  <KpiTile title="Fire Incidents" value={data.majorFire + data.minorFire} icon={Flame} color={data.majorFire + data.minorFire > 0 ? "danger" : "success"} />
                </div>
              </div>

              {/* Leading Indicators KPI Tiles */}
              <div>
                <h2 className="text-lg font-bold text-[#1A1818] mb-4">Leading Indicators</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <KpiTile title="Hazard Spotting" value={data.hazards} icon={AlertTriangle} color="success" />
                  <KpiTile title="Near Misses" value={data.nearMisses} icon={Target} color="warning" />
                </div>
              </div>

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
