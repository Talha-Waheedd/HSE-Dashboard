import React from 'react';
import type { UnifiedReport } from '../mockData';
import { ALL_SECTIONS } from '../../../config/sectionSchemas';

export const OriginalReportPanel: React.FC<{ report: UnifiedReport }> = ({ report }) => {
  // Find the schema based on report type to get pretty labels if possible
  const sectionIdMap: Record<string, string> = {
    'Hazard Reporting': 'hazard-reporting',
    'Near Miss': 'near-miss',
    'Incident Log': 'incident-log',
  };
  
  const schema = ALL_SECTIONS.find(s => s.id === sectionIdMap[report.reportType]);
  
  const formatLabel = (key: string) => {
    if (schema) {
      const col = schema.columns.find(c => c.key === key);
      if (col) return col.label;
    }
    return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden flex flex-col h-full">
      <div className="bg-[#FAFAFA] border-b border-[#E5E7EB] px-5 py-4">
        <h3 className="text-[15px] font-bold text-[#111827]">Original Report Information</h3>
        <p className="text-[12px] text-[#6B7280] mt-0.5">Read-only view of the submitted {report.reportType}</p>
      </div>
      
      <div className="p-5 overflow-y-auto flex-1">
        <div className="space-y-5">
          {/* Highlight Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#F3F4F6] p-3 rounded-lg border border-[#E5E7EB]">
              <div className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Report ID</div>
              <div className="text-[14px] font-bold text-[#111827] mt-1">{report.originalReportId}</div>
            </div>
            <div className="bg-[#F3F4F6] p-3 rounded-lg border border-[#E5E7EB]">
              <div className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Current Status</div>
              <div className="text-[14px] font-bold text-[#111827] mt-1 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${report.originalStatus === 'Closed' ? 'bg-[#10B981]' : 'bg-[#F59E0B]'}`} />
                {report.originalStatus}
              </div>
            </div>
          </div>

          <div className="h-px bg-[#E5E7EB] w-full" />

          {/* Details */}
          <div className="grid grid-cols-1 gap-y-4 text-[13px]">
            {Object.entries(report.originalData).map(([key, value]) => {
              if (key === 's_no' || key === 'status_id' || key === 'status') return null; // Skip redundant
              if (!value) return null;
              
              const isLongText = String(value).length > 50;

              return (
                <div key={key} className={isLongText ? 'col-span-1' : ''}>
                  <dt className="font-semibold text-[#6B7280] mb-1">{formatLabel(key)}</dt>
                  <dd className={`text-[#111827] ${isLongText ? 'bg-[#F9FAFB] p-3 rounded border border-[#F3F4F6]' : 'font-medium'}`}>
                    {value}
                  </dd>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
