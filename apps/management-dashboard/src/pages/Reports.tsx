import { useEffect, useState } from 'react';
import { usePermissions }  from '@cbl/auth';
import { Layout }          from '../components/Layout';
import { ContextHeader }   from '../components/ContextHeader';
import { StatusBadge }     from '../components/StatusBadge';
import {
  Download, Printer, Table as TableIcon, RefreshCw, ChevronRight
} from 'lucide-react';
import { STATUSES, RISK_RATINGS, INCIDENT_CATEGORIES } from '../config/constants';
import { departmentLabel, useDepartments } from '../hooks/useDepartments';
import { moduleService }   from '../services/api/moduleService';
import { ALL_SECTIONS }    from '../config/sectionSchemas';
import { reportClient } from '@cbl/api';

// ============================================================
// Reports — Enterprise Reporting Center
// SAP-style: filter configuration panel + data preview table
// ============================================================

const REPORT_TYPES = [
  { id: 'incident-log',       label: 'Incident Log',        icon: '📋' },
  { id: 'hazard-reporting',   label: 'Hazard Reporting',    icon: '⚠️' },
  { id: 'near-miss',          label: 'Near Miss',           icon: '🎯' },
  { id: 'training-records',   label: 'Training Records',    icon: '👥' },
  { id: 'action-tracker',     label: 'Actions / CAPA',      icon: '✅' },
];

const inputClass =
  'h-8 text-[12px] border border-[#E0E0E0] rounded-md bg-white text-[#1A1818] px-2 ' +
  'focus:outline-none focus:border-[#CB0017] focus:ring-1 focus:ring-[#CB0017]/20 w-full';

const labelClass = 'block text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide mb-1.5';

export const Reports = () => {
  const { departments } = useDepartments();
  const { canExportCSV, isDepartmentRestricted, userDepartment } = usePermissions();
  const [currentReportId, setCurrentReportId] = useState(REPORT_TYPES[0].id);
  const [generating, setGenerating]            = useState(false);
  const [activeTemplate, setActiveTemplate]    = useState<number | null>(null);

  // Filter state
  const [department,       setDepartment]       = useState(isDepartmentRestricted() ? userDepartment : 'All');
  const [fromDate,         setFromDate]         = useState('');
  const [toDate,           setToDate]           = useState('');
  const [status,           setStatus]           = useState('All');
  const [riskRating,       setRiskRating]       = useState('All');
  const [incidentCategory, setIncidentCategory] = useState('All');

  // Preview state
  const [previewData,   setPreviewData]   = useState<any[]>([]);
  const [previewSchema, setPreviewSchema] = useState<any>(null);
  const [hasGenerated,  setHasGenerated]  = useState(false);
  const [savedTemplates, setSavedTemplates] = useState<any[]>([]);

  useEffect(() => {
    reportClient.list({ page: 1, limit: 20 }).then((response) => {
      const payload = response.data?.data ?? response.data;
      setSavedTemplates(Array.isArray(payload) ? payload : payload?.rows || []);
    }).catch((error) => console.error('Saved reports load failed', error));
  }, []);

  const currentSchema = ALL_SECTIONS.find(s => s.id === currentReportId);
  const showRiskFilter     = ['incident-log', 'hazard-reporting'].includes(currentReportId);
  const showCategoryFilter = currentReportId === 'incident-log';
  const showStatusFilter   = currentReportId !== 'training-records';

  const fetchAndFilterData = async () => {
    try {
      const res = await moduleService.getAll(currentReportId, {
        page: 1,
        limit: 20,
        department: department !== 'All' ? department : undefined,
        status: status !== 'All' ? status : undefined,
        risk: riskRating !== 'All' ? riskRating : undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
      });
      let data: any[] = res.data || [];
      if (department !== 'All') data = data.filter(d => d.department_id === department);
      if (status !== 'All' && showStatusFilter)   data = data.filter(d => d.status_id === status);
      if (riskRating !== 'All' && showRiskFilter) data = data.filter(d => d.risk_rating_id === riskRating);
      if (incidentCategory !== 'All' && showCategoryFilter) data = data.filter(d => d.incident_category_id === incidentCategory);
      if (fromDate) data = data.filter(d => { const rd = d.date || d.target_date || d.due_date; return rd && rd >= fromDate; });
      if (toDate)   data = data.filter(d => { const rd = d.date || d.target_date || d.due_date; return rd && rd <= toDate;   });
      return data;
    } catch (err) {
      console.error('Report data fetch error', err);
      alert('Failed to load report data.');
      return [];
    }
  };

  const handleGeneratePreview = async () => {
    setGenerating(true);
    const data = await fetchAndFilterData();
    setPreviewData(data);
    setPreviewSchema(currentSchema);
    setHasGenerated(true);
    setGenerating(false);
  };

  const loadTemplate = (t: any) => {
    setActiveTemplate(t.id);
    setCurrentReportId(t.type);
    setHasGenerated(false);
    // In a real app we'd load saved filter states here
  };

  const handleExportCSV = async () => {
    const response = await reportClient.exportPerformance({ exportType: 'CSV', filters: { department, status, riskRating, incidentCategory, fromDate, toDate } });
    const filePath = response.data?.data?.filePath || response.data?.filePath;
    if (filePath) window.open(filePath, '_blank', 'noopener,noreferrer');
  };

  const handlePrint = () => window.print();

  return (
    <Layout>
      <ContextHeader
        title="Management Reports"
        breadcrumbs={['Reporting', 'Reports']}
        subtitle="Configure, preview, and export HSE data reports"
        actions={[
          ...(hasGenerated ? [{
            label: 'Print / PDF',
            icon: <Printer />,
            onClick: handlePrint,
            variant: 'outlined' as const,
          }] : []),
          ...(canExportCSV() ? [{
            label: 'Export CSV',
            icon: <Download />,
            onClick: handleExportCSV,
            variant: 'primary' as const,
          }] : []),
        ]}
      />

      <div className="flex h-[calc(100vh-120px)] overflow-hidden print-hide">
        
        {/* ===== LEFT PANEL: SAVED TEMPLATES ===== */}
        <div className="w-[260px] bg-white border-r border-[#E0E0E0] shrink-0 overflow-y-auto hidden md:block">
          <div className="p-4 border-b border-[#F0F0F0]">
            <h3 className="text-[12px] font-bold text-[#374151] uppercase tracking-wider">Saved Templates</h3>
            <p className="text-[11px] text-[#9CA3AF] mt-0.5">Quickly run common reports</p>
          </div>
          <div className="p-2 space-y-1">
            {savedTemplates.map(t => {
              const isActive = activeTemplate === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => loadTemplate(t)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-left rounded-md transition-colors ${
                    isActive ? 'bg-[#FFF7F7] text-[#CB0017]' : 'text-[#374151] hover:bg-[#F5F5F5]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <t.icon className={`h-4 w-4 ${isActive ? 'text-[#CB0017]' : 'text-[#9CA3AF]'}`} />
                    <span className="text-[13px] font-medium">{t.name}</span>
                  </div>
                  {isActive && <ChevronRight className="h-4 w-4 text-[#CB0017]" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* ===== MAIN CONTENT ===== */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#F5F5F5]">

          {/* ===== REPORT TYPE SELECTOR ===== */}
          <div
            className="bg-white border border-[#E0E0E0] rounded-lg p-4"
            style={{ boxShadow: '0 1px 4px 0 rgba(0,0,0,0.06)' }}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-4 rounded-full bg-[#CB0017]" />
              <h2 className="text-[12px] font-bold text-[#374151] uppercase tracking-wider">Report Module</h2>
            </div>

          <div className="flex flex-wrap gap-2">
            {REPORT_TYPES.map(rt => (
              <button
                key={rt.id}
                onClick={() => { setCurrentReportId(rt.id); setHasGenerated(false); }}
                className={`flex items-center gap-2 h-9 px-4 text-[13px] font-medium rounded-md border transition-colors ${
                  currentReportId === rt.id
                    ? 'bg-[#CB0017] text-white border-[#CB0017]'
                    : 'bg-white text-[#374151] border-[#E0E0E0] hover:bg-[#F5F5F5] hover:border-[#AAAAAA]'
                }`}
              >
                <span>{rt.icon}</span>
                {rt.label}
              </button>
            ))}
          </div>
        </div>

        {/* ===== FILTER CONFIGURATION ===== */}
        <div
          className="bg-white border border-[#E0E0E0] rounded-lg p-5"
          style={{ boxShadow: '0 1px 4px 0 rgba(0,0,0,0.06)' }}
        >
          <div className="flex items-center gap-2 mb-5">
            <div className="w-1 h-4 rounded-full bg-[#CB0017]" />
            <h2 className="text-[12px] font-bold text-[#374151] uppercase tracking-wider">Filter Configuration</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Date Range */}
            <div>
              <label className={labelClass}>From Date</label>
              <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>To Date</label>
              <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className={inputClass} />
            </div>

            {/* Department */}
            <div>
              <label className={labelClass}>Department</label>
              <select
                value={department}
                onChange={e => setDepartment(e.target.value)}
                disabled={isDepartmentRestricted()}
                className={`${inputClass} ${isDepartmentRestricted() ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <option value="All">All Departments</option>
                {departments.map(item => <option key={item.id} value={departmentLabel(item)}>{departmentLabel(item)}</option>)}
              </select>
            </div>

            {/* Status */}
            {showStatusFilter && (
              <div>
                <label className={labelClass}>Status</label>
                <select value={status} onChange={e => setStatus(e.target.value)} className={inputClass}>
                  <option value="All">All Statuses</option>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}

            {/* Risk Rating */}
            {showRiskFilter && (
              <div>
                <label className={labelClass}>Risk Rating</label>
                <select value={riskRating} onChange={e => setRiskRating(e.target.value)} className={inputClass}>
                  <option value="All">All Ratings</option>
                  {RISK_RATINGS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            )}

            {/* Incident Category */}
            {showCategoryFilter && (
              <div>
                <label className={labelClass}>Inc. Category</label>
                <select value={incidentCategory} onChange={e => setIncidentCategory(e.target.value)} className={inputClass}>
                  <option value="All">All Categories</option>
                  {INCIDENT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* Generate button */}
          <div className="flex justify-end mt-5 pt-4 border-t border-[#F0F0F0]">
            <button
              onClick={handleGeneratePreview}
              disabled={generating}
              className="flex items-center gap-2 h-9 px-6 text-[13px] font-medium text-white rounded-md transition-colors disabled:opacity-60"
              style={{ backgroundColor: '#1A1818' }}
              onMouseEnter={e => { if (!generating) (e.currentTarget as HTMLElement).style.backgroundColor = '#333'; }}
              onMouseLeave={e => { if (!generating) (e.currentTarget as HTMLElement).style.backgroundColor = '#1A1818'; }}
            >
              {generating
                ? <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Generating…</>
                : <><TableIcon className="h-3.5 w-3.5" /> Generate Preview</>
              }
            </button>
          </div>
        </div>

        {/* ===== DATA PREVIEW TABLE ===== */}
        {hasGenerated && previewSchema && (
          <div
            className="bg-white border border-[#E0E0E0] rounded-lg overflow-hidden"
            style={{ boxShadow: '0 1px 4px 0 rgba(0,0,0,0.06)' }}
          >
            {/* Table header bar */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E0E0E0] bg-[#FAFAFA]">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 rounded-full bg-[#CB0017]" />
                <h3 className="text-[12px] font-bold text-[#374151] uppercase tracking-wider">
                  {REPORT_TYPES.find(r => r.id === currentReportId)?.label} Preview
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-md"
                  style={{
                    backgroundColor: previewData.length > 0 ? '#ECFDF5' : '#FEF2F2',
                    color:           previewData.length > 0 ? '#065F46' : '#991B1B',
                    border: `1px solid ${previewData.length > 0 ? '#6EE7B7' : '#FECACA'}`,
                  }}
                >
                  {previewData.length} Records
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full enterprise-table">
                <thead>
                  <tr>
                    <th className="w-10 text-center">#</th>
                    {previewSchema.columns.filter((c: any) => !c.hideFromForm).map((col: any) => (
                      <th key={col.key}>{col.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewData.length === 0 ? (
                    <tr>
                      <td
                        colSpan={previewSchema.columns.length + 1}
                        className="text-center py-12"
                      >
                        <p className="text-[14px] text-[#9CA3AF] font-medium">
                          No records match the selected filters
                        </p>
                      </td>
                    </tr>
                  ) : (
                    previewData.map((entry: any, rowIdx: number) => (
                      <tr key={entry.id} className={rowIdx % 2 !== 0 ? 'bg-[#FAFAFA]' : 'bg-white'}>
                        <td className="text-center text-[11px] text-[#9CA3AF] font-medium tabular-nums">
                          {rowIdx + 1}
                        </td>
                        {previewSchema.columns.filter((c: any) => !c.hideFromForm).map((col: any) => (
                          <td key={col.key}>
                            {col.key === 'status_id' && entry[col.key] ? (
                              <StatusBadge status={entry[col.key]} size="xs" />
                            ) : col.key === 'risk_rating_id' && entry[col.key] ? (
                              <StatusBadge status={entry[col.key]} size="xs" />
                            ) : (
                              <span className="text-[13px] text-[#1A1818]">
                                {entry[col.key] || <span className="text-[#D0D0D0]">—</span>}
                              </span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer summary */}
            {previewData.length > 0 && (
              <div className="px-5 py-3 border-t border-[#F0F0F0] bg-[#FAFAFA] flex items-center justify-between">
                <p className="text-[11px] text-[#9CA3AF]">
                  Report generated at {new Date().toLocaleString()}
                </p>
                {canExportCSV() && (
                  <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-1.5 h-8 px-3 text-[12px] font-medium text-white rounded-md bg-[#CB0017] hover:bg-[#A8001A] transition-colors"
                  >
                    <Download className="h-3 w-3" /> Export CSV
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      </div>

      {/* ===== PRINT-ONLY CONTENT ===== */}
      {hasGenerated && previewSchema && (
        <div className="print-show hidden p-8">
          <div className="mb-6 border-b-2 border-[#1A1818] pb-4">
            <h1 className="text-2xl font-bold text-[#1A1818]">
              {REPORT_TYPES.find(r => r.id === currentReportId)?.label}
            </h1>
            <p className="text-sm text-[#6B7280] mt-1">
              CBL HSE Management System · LU Sukkur Plant
            </p>
            <p className="text-xs text-[#9CA3AF] mt-1">
              Generated: {new Date().toLocaleString()} · {previewData.length} records
            </p>
          </div>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-[#1A1818]">
                {previewSchema.columns.filter((c: any) => !c.hideFromForm).map((col: any) => (
                  <th key={col.key} className="text-left py-2 pr-4 text-xs font-bold uppercase tracking-wide">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewData.map((entry: any, i: number) => (
                <tr key={entry.id} className={i % 2 === 0 ? '' : 'bg-gray-50'}>
                  {previewSchema.columns.filter((c: any) => !c.hideFromForm).map((col: any) => (
                    <td key={col.key} className="py-1.5 pr-4 border-b border-gray-200 text-xs">
                      {entry[col.key] || '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
};
