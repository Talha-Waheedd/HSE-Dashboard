import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { ContextHeader } from '../components/ContextHeader';
import { moduleService } from '../services/api/moduleService';
import { Triangle } from 'lucide-react';

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

  const StatusIcon = ({ status }: { status: 'up' | 'down' | 'neutral' }) => {
    if (status === 'up') return <Triangle className="w-5 h-5 text-[#1B7C1B]" fill="currentColor" />;
    if (status === 'down') return <Triangle className="w-5 h-5 text-[#CB0017] rotate-180" fill="currentColor" />;
    return <Triangle className="w-5 h-5 text-[#DC8E00]" fill="currentColor" />;
  };

  const TableHeader = () => (
    <thead className="bg-[#4172B8] text-white">
      <tr>
        <th className="py-2 px-4 text-left font-bold border border-gray-300">Indicators</th>
        <th className="py-2 px-4 text-center font-bold border border-gray-300">Unit</th>
        <th className="py-2 px-4 text-center font-bold border border-gray-300">2024</th>
        <th className="py-2 px-4 text-center font-bold border border-gray-300">2025</th>
        <th className="py-2 px-4 text-center font-bold border border-gray-300">Tar2026</th>
        <th className="py-2 px-4 text-center font-bold border border-gray-300">YTD-2026</th>
        <th className="py-2 px-4 text-center font-bold border border-gray-300">Status</th>
        <th className="py-2 px-4 text-left font-bold border border-gray-300 w-1/3">Remarks</th>
      </tr>
    </thead>
  );

  return (
    <Layout>
      <div className="flex-1 overflow-y-auto">
        <ContextHeader 
          title="Leading and Lagging Indicator" 
          breadcrumbs={['Reporting', 'Leading and Lagging Indicator']}
        />
        <div className="p-6 max-w-[1600px] mx-auto">
          <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold text-[#1A1818]">HSE KPI Performance Summary – 2026</h2>
            </div>
            
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading metrics...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <TableHeader />
                  <tbody>
                    {/* Lagging Indicators */}
                    <tr className="bg-[#4172B8]/10 font-bold">
                      <td colSpan={8} className="py-2 px-4 border border-gray-300 text-[#1A1818]">Lagging Indicators</td>
                    </tr>
                    
                    <tr>
                      <td className="py-2 px-4 border border-gray-300 font-semibold">Fatal Incidents</td>
                      <td className="py-2 px-4 border border-gray-300 text-center font-bold">No</td>
                      <td className="py-2 px-4 border border-gray-300 text-center font-bold">0</td>
                      <td className="py-2 px-4 border border-gray-300 text-center font-bold">0</td>
                      <td className="py-2 px-4 border border-gray-300 text-center font-bold">0</td>
                      <td className="py-2 px-4 border border-gray-300 text-center font-bold">{data.fatalities}</td>
                      <td className="py-2 px-4 border border-gray-300 text-center"><div className="flex justify-center"><StatusIcon status="up" /></div></td>
                      <td className="py-2 px-4 border border-gray-300 font-semibold">Zero fatalities</td>
                    </tr>
                    
                    <tr className="bg-gray-50">
                      <td className="py-2 px-4 border border-gray-300 font-semibold">LTI</td>
                      <td className="py-2 px-4 border border-gray-300 text-center font-bold">No</td>
                      <td className="py-2 px-4 border border-gray-300 text-center font-bold">4</td>
                      <td className="py-2 px-4 border border-gray-300 text-center font-bold">10</td>
                      <td className="py-2 px-4 border border-gray-300 text-center font-bold">0</td>
                      <td className="py-2 px-4 border border-gray-300 text-center font-bold">{data.lti}</td>
                      <td className="py-2 px-4 border border-gray-300 text-center"><div className="flex justify-center"><StatusIcon status={data.lti > 0 ? 'down' : 'up'} /></div></td>
                      <td className="py-2 px-4 border border-gray-300 font-semibold">Tracked via system</td>
                    </tr>

                    <tr>
                      <td className="py-2 px-4 border border-gray-300 font-semibold">RWC / MTC</td>
                      <td className="py-2 px-4 border border-gray-300 text-center font-bold">No</td>
                      <td className="py-2 px-4 border border-gray-300 text-center font-bold">8</td>
                      <td className="py-2 px-4 border border-gray-300 text-center font-bold">1</td>
                      <td className="py-2 px-4 border border-gray-300 text-center font-bold">0</td>
                      <td className="py-2 px-4 border border-gray-300 text-center font-bold">{data.rwc_mtc}</td>
                      <td className="py-2 px-4 border border-gray-300 text-center"><div className="flex justify-center"><StatusIcon status={data.rwc_mtc > 0 ? 'down' : 'up'} /></div></td>
                      <td className="py-2 px-4 border border-gray-300 font-semibold">Tracked via system</td>
                    </tr>

                    <tr className="bg-gray-50">
                      <td className="py-2 px-4 border border-gray-300 font-semibold">First Aid</td>
                      <td className="py-2 px-4 border border-gray-300 text-center font-bold">No</td>
                      <td className="py-2 px-4 border border-gray-300 text-center font-bold">25</td>
                      <td className="py-2 px-4 border border-gray-300 text-center font-bold">23</td>
                      <td className="py-2 px-4 border border-gray-300 text-center font-bold">-</td>
                      <td className="py-2 px-4 border border-gray-300 text-center font-bold">{data.firstAid}</td>
                      <td className="py-2 px-4 border border-gray-300 text-center"><div className="flex justify-center"><StatusIcon status="up" /></div></td>
                      <td className="py-2 px-4 border border-gray-300 font-semibold">Tracked via system</td>
                    </tr>

                    <tr>
                      <td rowSpan={2} className="py-2 px-4 border border-gray-300 font-semibold align-middle">Fire Incidents</td>
                      <td className="py-2 px-4 border border-gray-300 text-center font-bold">Major</td>
                      <td className="py-2 px-4 border border-gray-300 text-center font-bold">1</td>
                      <td className="py-2 px-4 border border-gray-300 text-center font-bold">0</td>
                      <td className="py-2 px-4 border border-gray-300 text-center font-bold">-</td>
                      <td className="py-2 px-4 border border-gray-300 text-center font-bold">{data.majorFire}</td>
                      <td className="py-2 px-4 border border-gray-300 text-center"><div className="flex justify-center"><StatusIcon status={data.majorFire > 0 ? 'down' : 'up'} /></div></td>
                      <td className="py-2 px-4 border border-gray-300 font-semibold">Tracked via system</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4 border border-gray-300 text-center font-bold bg-gray-50">Minor</td>
                      <td className="py-2 px-4 border border-gray-300 text-center font-bold bg-gray-50">30</td>
                      <td className="py-2 px-4 border border-gray-300 text-center font-bold bg-gray-50">8</td>
                      <td className="py-2 px-4 border border-gray-300 text-center font-bold bg-gray-50">-</td>
                      <td className="py-2 px-4 border border-gray-300 text-center font-bold bg-gray-50">{data.minorFire}</td>
                      <td className="py-2 px-4 border border-gray-300 text-center bg-gray-50"><div className="flex justify-center"><StatusIcon status="neutral" /></div></td>
                      <td className="py-2 px-4 border border-gray-300 font-semibold bg-gray-50">Tracked via system</td>
                    </tr>

                    {/* Leading Indicators */}
                    <tr className="bg-[#4172B8]/10 font-bold">
                      <td colSpan={8} className="py-2 px-4 border border-gray-300 text-[#1A1818]">Leading Indicators</td>
                    </tr>

                    <tr>
                      <td className="py-2 px-4 border border-gray-300 font-semibold">Hazard Spotting</td>
                      <td className="py-2 px-4 border border-gray-300 text-center font-bold">No</td>
                      <td className="py-2 px-4 border border-gray-300 text-center font-bold">2864</td>
                      <td className="py-2 px-4 border border-gray-300 text-center font-bold">4011</td>
                      <td className="py-2 px-4 border border-gray-300 text-center font-bold">3000</td>
                      <td className="py-2 px-4 border border-gray-300 text-center font-bold">{data.hazards}</td>
                      <td className="py-2 px-4 border border-gray-300 text-center"><div className="flex justify-center"><StatusIcon status={data.hazards >= 3000 ? 'up' : 'neutral'} /></div></td>
                      <td className="py-2 px-4 border border-gray-300 font-semibold">Auto-calculated from records</td>
                    </tr>

                    <tr className="bg-gray-50">
                      <td className="py-2 px-4 border border-gray-300 font-semibold">Near miss</td>
                      <td className="py-2 px-4 border border-gray-300 text-center font-bold">No</td>
                      <td className="py-2 px-4 border border-gray-300 text-center font-bold">186</td>
                      <td className="py-2 px-4 border border-gray-300 text-center font-bold">183</td>
                      <td className="py-2 px-4 border border-gray-300 text-center font-bold">264</td>
                      <td className="py-2 px-4 border border-gray-300 text-center font-bold">{data.nearMisses}</td>
                      <td className="py-2 px-4 border border-gray-300 text-center"><div className="flex justify-center"><StatusIcon status={data.nearMisses >= 264 ? 'up' : 'neutral'} /></div></td>
                      <td className="py-2 px-4 border border-gray-300 font-semibold">Auto-calculated from records</td>
                    </tr>

                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};
