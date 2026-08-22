import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/Layout';
import { ContextHeader } from '../../components/ContextHeader';
import { MOCK_UNIFIED_REPORTS, type UnifiedReport, type AnalysisStatus } from './mockData';
import { Search, Filter, Activity, FileText, CheckCircle2, Clock } from 'lucide-react';

export const MasterAnalysisDashboard = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Filtering logic
  const filteredReports = MOCK_UNIFIED_REPORTS.filter(r => {
    const matchesSearch = r.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          r.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.reportedBy.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'All' || r.reportType === typeFilter;
    const matchesStatus = statusFilter === 'All' || r.analysisStatus === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // KPI Calculations
  const totalReports = filteredReports.length;
  const notReviewed = filteredReports.filter(r => r.analysisStatus === 'Not Reviewed').length;
  const underReview = filteredReports.filter(r => r.analysisStatus === 'Under Review').length;
  const completed = filteredReports.filter(r => r.analysisStatus === 'Analysis Completed').length;

  return (
    <Layout>
      <ContextHeader 
        title="Master Analysis" 
        breadcrumbs={['Reporting', 'Master Analysis']} 
        subtitle="Centralized dashboard for deep HSE analysis and classification" 
      />

      <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[12px] font-bold text-[#6B7280] uppercase tracking-wider">Total Reports</p>
              <p className="text-[28px] font-bold text-[#111827] mt-1 leading-none">{totalReports}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#F3F4F6] flex items-center justify-center text-[#374151]">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[12px] font-bold text-[#6B7280] uppercase tracking-wider">Not Reviewed</p>
              <p className="text-[28px] font-bold text-[#111827] mt-1 leading-none">{notReviewed}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#FEE2E2] flex items-center justify-center text-[#B91C1C]">
              <Activity className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[12px] font-bold text-[#6B7280] uppercase tracking-wider">Under Review</p>
              <p className="text-[28px] font-bold text-[#111827] mt-1 leading-none">{underReview}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#FEF3C7] flex items-center justify-center text-[#D97706]">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[12px] font-bold text-[#6B7280] uppercase tracking-wider">Completed</p>
              <p className="text-[28px] font-bold text-[#111827] mt-1 leading-none">{completed}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#D1FAE5] flex items-center justify-center text-[#059669]">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Filters and Table Area */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-sm overflow-hidden flex flex-col">
          {/* Toolbar */}
          <div className="p-4 border-b border-[#E5E7EB] bg-[#FAFAFA] flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text"
                  placeholder="Search ID, Name, Details..."
                  className="pl-9 pr-4 py-2 w-72 text-[13px] border border-[#D1D5DB] rounded-md focus:outline-none focus:border-[#CB0017] focus:ring-1 focus:ring-[#CB0017]"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 border-l border-[#D1D5DB] pl-3">
                <Filter className="w-4 h-4 text-[#6B7280]" />
                <select 
                  className="py-2 pl-3 pr-8 text-[13px] border border-[#D1D5DB] rounded-md focus:outline-none focus:border-[#CB0017]"
                  value={typeFilter}
                  onChange={e => setTypeFilter(e.target.value)}
                >
                  <option value="All">All Report Types</option>
                  <option value="Hazard Reporting">Hazard Reporting</option>
                  <option value="Near Miss">Near Miss</option>
                  <option value="Incident Log">Incident Log</option>
                </select>
                <select 
                  className="py-2 pl-3 pr-8 text-[13px] border border-[#D1D5DB] rounded-md focus:outline-none focus:border-[#CB0017]"
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                >
                  <option value="All">All Analysis Statuses</option>
                  <option value="Not Reviewed">Not Reviewed</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Analysis Completed">Analysis Completed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-white border-b border-[#E5E7EB]">
                  <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">Report ID</th>
                  <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">Type</th>
                  <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">Date</th>
                  <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">Department & Location</th>
                  <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">Original Status</th>
                  <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">Analysis Status</th>
                  <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-[#6B7280] text-right">Action</th>
                </tr>
              </thead>
              <tbody className="text-[13px]">
                {filteredReports.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-[#6B7280]">No reports found matching the criteria.</td>
                  </tr>
                ) : (
                  filteredReports.map(report => (
                    <tr key={report.id} className="border-b border-[#E5E7EB] hover:bg-[#F9FAFB] transition-colors">
                      <td className="px-5 py-3">
                        <div className="font-bold text-[#111827]">{report.id}</div>
                        <div className="text-[11px] text-[#6B7280]">Ref: {report.originalReportId}</div>
                      </td>
                      <td className="px-5 py-3 font-medium text-[#374151]">{report.reportType}</td>
                      <td className="px-5 py-3 text-[#6B7280]">{report.date}</td>
                      <td className="px-5 py-3">
                        <div className="text-[#111827]">{report.department}</div>
                        <div className="text-[11px] text-[#6B7280] max-w-[200px] truncate" title={report.location}>{report.location}</div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                          report.originalStatus === 'Closed' ? 'bg-[#ECFDF5] text-[#059669]' : 'bg-[#FEF3C7] text-[#D97706]'
                        }`}>
                          {report.originalStatus}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                          report.analysisStatus === 'Analysis Completed' ? 'bg-[#ECFDF5] text-[#059669]' :
                          report.analysisStatus === 'Under Review' ? 'bg-[#FEF3C7] text-[#D97706]' :
                          'bg-[#F3F4F6] text-[#4B5563]'
                        }`}>
                          {report.analysisStatus}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button 
                          onClick={() => navigate(`/master-analysis/${report.id}`)}
                          className={`h-8 px-3 rounded text-[12px] font-bold transition-colors ${
                            report.analysisStatus === 'Analysis Completed'
                              ? 'bg-white border border-[#D1D5DB] text-[#374151] hover:bg-[#F3F4F6]'
                              : 'bg-[#CB0017] text-white hover:bg-[#A30012]'
                          }`}
                        >
                          {report.analysisStatus === 'Analysis Completed' ? 'View Analysis' : 'Review'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};
