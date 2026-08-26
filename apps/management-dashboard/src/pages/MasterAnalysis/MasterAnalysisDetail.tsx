import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../../components/Layout';
import { OriginalReportPanel } from './components/OriginalReportPanel';
import { AnalysisForm } from './components/AnalysisForm';
import { moduleService } from '../../services/api/moduleService';
import type { UnifiedReport, MasterAnalysisData, AnalysisStatus } from './types';
import { ArrowLeft } from 'lucide-react';

export const MasterAnalysisDetail = () => {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<UnifiedReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const requestId = useRef(0);

  useEffect(() => {
    const request = ++requestId.current;
    setLoading(true); setError('');
    moduleService.getMasterAnalysisRecord(id).then(response => {
      if (request === requestId.current) setReport(response.data);
    }).catch(loadError => {
      if (request === requestId.current) setError(loadError?.response?.data?.message || 'Unable to load the source report.');
    }).finally(() => { if (request === requestId.current) setLoading(false); });
  }, [id]);

  const handleSave = async (data: MasterAnalysisData, status: AnalysisStatus) => {
    await moduleService.saveMasterAnalysis(id, data, status);
    navigate('/master-analysis');
  };

  if (loading) return <Layout><div className="p-8 text-[#6B7280]">Loading report…</div></Layout>;
  if (error || !report) return <Layout><div className="p-8 space-y-4"><div role="alert" className="rounded-md border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-[#B91C1C]">{error || 'Report not found.'}</div><button onClick={() => navigate('/master-analysis')} className="text-[#CB0017] font-semibold">Back to Master Analysis</button></div></Layout>;

  return <Layout>
    <div className="bg-white border-b border-[#E5E7EB] px-6 py-3 flex items-center gap-4 sticky top-0 z-10"><button aria-label="Back to Master Analysis" onClick={() => navigate('/master-analysis')} className="p-1.5 hover:bg-[#F3F4F6] rounded-md text-[#6B7280]"><ArrowLeft className="w-5 h-5" /></button><div><h1 className="text-[18px] font-bold text-[#111827]">Analysis Review: {report.originalReportId}</h1><div className="text-[13px] text-[#6B7280] flex items-center gap-2"><span>{report.reportType}</span><span className="w-1 h-1 rounded-full bg-[#D1D5DB]" /><span>Reported by {report.reportedBy}</span></div></div></div>
    <div className="p-6 h-[calc(100vh-140px)] flex gap-6"><div className="w-[45%] h-full"><OriginalReportPanel report={report} /></div><div className="flex-1 h-full"><AnalysisForm initialData={report.analysisData} initialStatus={report.analysisStatus} onSave={handleSave} /></div></div>
  </Layout>;
};
