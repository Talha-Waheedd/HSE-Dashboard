import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/Layout';
import { ContextHeader } from '../../components/ContextHeader';
import { moduleService } from '../../services/api/moduleService';
import type { UnifiedReport } from './types';
import { Search, Filter, Activity, FileText, CheckCircle2, Clock } from 'lucide-react';
import { PaginationControls } from '../../components/PaginationControls';

const PAGE_SIZE = 10;
export const MasterAnalysisDashboard = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [reports, setReports] = useState<UnifiedReport[]>([]);
  const [meta, setMeta] = useState({ currentPage: 1, pageSize: PAGE_SIZE, totalRecords: 0, totalPages: 0 });
  const [summary, setSummary] = useState({ totalReports: 0, notReviewed: 0, underReview: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const requestId = useRef(0);

  useEffect(() => {
    const id = ++requestId.current;
    const timer = window.setTimeout(async () => {
      setLoading(true); setError('');
      try {
        const response = await moduleService.getMasterAnalysis({
          page, limit: PAGE_SIZE, search: searchTerm.trim(), reportType: typeFilter,
          analysisStatus: ({ 'Not Reviewed': 'not_reviewed', 'Under Review': 'under_review', 'Analysis Completed': 'completed' } as Record<string, string>)[statusFilter] || statusFilter,
        });
        if (id !== requestId.current) return;
        setReports(response.data); setMeta(response.meta || { currentPage: page, pageSize: PAGE_SIZE, totalRecords: 0, totalPages: 0 });
        setSummary(response.meta?.summary || { totalReports: 0, notReviewed: 0, underReview: 0, completed: 0 });
      } catch (loadError: any) {
        if (id === requestId.current) setError(loadError?.response?.data?.message || 'Unable to load master analysis records.');
      } finally { if (id === requestId.current) setLoading(false); }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [page, searchTerm, typeFilter, statusFilter]);

  const cards = [
    ['Total Reports', summary.totalReports, FileText, 'bg-[#F3F4F6] text-[#374151]'],
    ['Not Reviewed', summary.notReviewed, Activity, 'bg-[#FEE2E2] text-[#B91C1C]'],
    ['Under Review', summary.underReview, Clock, 'bg-[#FEF3C7] text-[#D97706]'],
    ['Completed', summary.completed, CheckCircle2, 'bg-[#D1FAE5] text-[#059669]'],
  ] as const;

  return <Layout>
    <ContextHeader title="Master Analysis" breadcrumbs={['Reporting', 'Master Analysis']} subtitle="Centralized dashboard for deep HSE analysis and classification" />
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">{cards.map(([label, value, Icon, iconClass]) => <div key={label} className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-sm flex items-center justify-between"><div><p className="text-[12px] font-bold text-[#6B7280] uppercase tracking-wider">{label}</p><p className="text-[28px] font-bold text-[#111827] mt-1 leading-none">{value}</p></div><div className={`w-10 h-10 rounded-full flex items-center justify-center ${iconClass}`}><Icon className="w-5 h-5" /></div></div>)}</div>
      <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-[#E5E7EB] bg-[#FAFAFA] flex flex-wrap items-center gap-3"><div className="relative"><Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" /><input aria-label="Search reports" type="search" placeholder="Search ID, Name, Details..." className="pl-9 pr-4 py-2 w-72 max-w-full text-[13px] border border-[#D1D5DB] rounded-md focus:outline-none focus:border-[#CB0017]" value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setPage(1); }} /></div><div className="flex items-center gap-2 border-l border-[#D1D5DB] pl-3"><Filter className="w-4 h-4 text-[#6B7280]" /><select aria-label="Filter by report type" className="py-2 pl-3 pr-8 text-[13px] border border-[#D1D5DB] rounded-md" value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}><option>All</option><option>Hazard Reporting</option><option>Near Miss</option><option>Incident Log</option></select><select aria-label="Filter by analysis status" className="py-2 pl-3 pr-8 text-[13px] border border-[#D1D5DB] rounded-md" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}><option>All</option><option>Not Reviewed</option><option>Under Review</option><option>Analysis Completed</option></select></div></div>
        {error && <div role="alert" className="m-4 rounded-md border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-[13px] text-[#B91C1C]">{error}</div>}
        <div className={`overflow-x-auto min-h-[400px] ${loading ? 'opacity-60' : ''}`}><table className="w-full text-left border-collapse whitespace-nowrap"><thead><tr className="bg-white border-b border-[#E5E7EB]">{['Report ID', 'Type', 'Date', 'Department & Location', 'Original Status', 'Analysis Status', 'Action'].map(heading => <th key={heading} className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">{heading}</th>)}</tr></thead><tbody className="text-[13px]">{!loading && reports.length === 0 ? <tr><td colSpan={7} className="px-5 py-8 text-center text-[#6B7280]">No reports found matching the criteria.</td></tr> : reports.map(report => <tr key={report.id} className="border-b border-[#E5E7EB] hover:bg-[#F9FAFB] transition-colors"><td className="px-5 py-3"><div className="font-bold text-[#111827]">{report.originalReportId}</div><div className="text-[11px] text-[#6B7280]">{report.id}</div></td><td className="px-5 py-3 font-medium text-[#374151]">{report.reportType}</td><td className="px-5 py-3 text-[#6B7280]">{report.date}</td><td className="px-5 py-3"><div className="text-[#111827]">{report.department}</div><div className="text-[11px] text-[#6B7280] max-w-[200px] truncate" title={report.location}>{report.location}</div></td><td className="px-5 py-3"><span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#FEF3C7] text-[#D97706]">{report.originalStatus}</span></td><td className="px-5 py-3"><span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${report.analysisStatus === 'Analysis Completed' ? 'bg-[#ECFDF5] text-[#059669]' : report.analysisStatus === 'Under Review' ? 'bg-[#FEF3C7] text-[#D97706]' : 'bg-[#F3F4F6] text-[#4B5563]'}`}>{report.analysisStatus}</span></td><td className="px-5 py-3 text-right"><button onClick={() => navigate(`/master-analysis/${report.id}`)} className="h-8 px-3 rounded text-[12px] font-bold bg-[#CB0017] text-white hover:bg-[#A30012]">{report.analysisStatus === 'Analysis Completed' ? 'View Analysis' : 'Review'}</button></td></tr>)}</tbody></table></div>
        <PaginationControls currentPage={page} totalPages={meta.totalPages} totalRecords={meta.totalRecords} pageSize={PAGE_SIZE} onPageChange={setPage} disabled={loading} itemLabel="reports" />
      </div>
    </div>
  </Layout>;
};
