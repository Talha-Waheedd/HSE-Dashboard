import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../../components/Layout';
import { ContextHeader } from '../../components/ContextHeader';
import { OriginalReportPanel } from './components/OriginalReportPanel';
import { AnalysisForm } from './components/AnalysisForm';
import { MOCK_UNIFIED_REPORTS, type UnifiedReport, type MasterAnalysisData, type AnalysisStatus } from './mockData';
import { ArrowLeft } from 'lucide-react';

export const MasterAnalysisDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<UnifiedReport | null>(null);

  useEffect(() => {
    // Mock fetch
    const found = MOCK_UNIFIED_REPORTS.find(r => r.id === id);
    if (found) {
      setReport(found);
    }
  }, [id]);

  const handleSave = (data: MasterAnalysisData, status: AnalysisStatus) => {
    if (!report) return;
    
    // Update local state (in a real app, this would be an API call)
    setReport({
      ...report,
      analysisData: data,
      analysisStatus: status
    });
    
    // Simulate successful save and navigate back
    setTimeout(() => {
      navigate('/master-analysis');
    }, 400);
  };

  if (!report) {
    return (
      <Layout>
        <div className="flex h-full items-center justify-center text-[#6B7280]">
          Report not found.
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-white border-b border-[#E5E7EB] px-6 py-3 flex items-center gap-4 sticky top-0 z-10">
        <button 
          onClick={() => navigate('/master-analysis')}
          className="p-1.5 hover:bg-[#F3F4F6] rounded-md transition-colors text-[#6B7280] hover:text-[#111827]"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-[18px] font-bold text-[#111827]">Analysis Review: {report.id}</h1>
          <div className="text-[13px] text-[#6B7280] flex items-center gap-2">
            <span>{report.reportType}</span>
            <span className="w-1 h-1 rounded-full bg-[#D1D5DB]" />
            <span>Reported by {report.reportedBy}</span>
          </div>
        </div>
      </div>

      {/* Split View */}
      <div className="p-6 h-[calc(100vh-140px)] flex gap-6">
        {/* Left Side: Original Read-Only Report */}
        <div className="w-[45%] h-full">
          <OriginalReportPanel report={report} />
        </div>

        {/* Right Side: Deep Analysis Form */}
        <div className="flex-1 h-full">
          <AnalysisForm 
            initialData={report.analysisData} 
            initialStatus={report.analysisStatus}
            onSave={handleSave}
          />
        </div>
      </div>
    </Layout>
  );
};
