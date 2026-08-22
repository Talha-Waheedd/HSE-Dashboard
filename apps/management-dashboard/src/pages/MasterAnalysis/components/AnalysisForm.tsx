import React, { useState } from 'react';
import { type MasterAnalysisData, type AnalysisStatus } from '../mockData';
import { IncidentTypeSelect, LocationConditionSelect, InjuryTypeSelect, BodyPartGroupSelect } from './ClassificationDropdowns';
import { Save, CheckCircle, Clock } from 'lucide-react';

interface Props {
  initialData: MasterAnalysisData;
  initialStatus: AnalysisStatus;
  onSave: (data: MasterAnalysisData, status: AnalysisStatus) => void;
}

export const AnalysisForm: React.FC<Props> = ({ initialData, initialStatus, onSave }) => {
  const [data, setData] = useState<MasterAnalysisData>(initialData || {});
  const [status, setStatus] = useState<AnalysisStatus>(initialStatus);

  const updateNested = (category: keyof MasterAnalysisData, field: string, value: string) => {
    setData(prev => ({
      ...prev,
      [category]: {
        ...(prev[category] as any || {}),
        [field]: value
      }
    }));
  };

  const isCompleted = status === 'Analysis Completed';

  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] flex flex-col h-full relative">
      {/* Header */}
      <div className="bg-[#CB0017] px-5 py-4 rounded-t-xl text-white flex justify-between items-center shrink-0">
        <div>
          <h3 className="text-[16px] font-bold">HSE Supervisor Analysis</h3>
          <p className="text-[12px] text-[#FCA5A5] mt-0.5">Deep classification and root cause mapping</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            className={`h-8 px-3 rounded text-[12px] font-bold border-0 outline-none ${
              status === 'Not Reviewed' ? 'bg-white text-[#4B5563]' :
              status === 'Under Review' ? 'bg-[#FEF3C7] text-[#92400E]' :
              'bg-[#D1FAE5] text-[#065F46]'
            }`}
            value={status} 
            onChange={(e) => setStatus(e.target.value as AnalysisStatus)}
          >
            <option value="Not Reviewed">Not Reviewed</option>
            <option value="Under Review">Under Review</option>
            <option value="Analysis Completed">Analysis Completed</option>
          </select>
          
          <button 
            onClick={() => onSave(data, status)}
            className="flex items-center gap-1.5 h-8 px-4 bg-[#A30012] hover:bg-[#7B000E] text-white rounded text-[12px] font-bold transition-colors shadow-sm"
          >
            <Save className="w-4 h-4" />
            Save Analysis
          </button>
        </div>
      </div>

      {/* Scrollable Form Content */}
      <div className="p-6 overflow-y-auto flex-1 bg-[#FAFAFA]">
        <div className="space-y-8 max-w-3xl">
          
          {/* Incident Classification */}
          <section className="bg-white p-5 rounded-lg border border-[#DEDEDE] shadow-sm">
            <h4 className="text-[14px] font-bold text-[#111827] flex items-center gap-2 mb-4">
              <span className="w-6 h-6 rounded-md bg-[#FEE2E2] text-[#B91C1C] flex items-center justify-center text-[12px]">1</span>
              Incident & Hazard Classification
            </h4>
            <div className="grid grid-cols-2 gap-5">
              <IncidentTypeSelect 
                value={data.incidentClassification?.type || ''} 
                onChange={val => updateNested('incidentClassification', 'type', val)} 
                disabled={isCompleted}
              />
              <LocationConditionSelect 
                value={data.incidentClassification?.locationCondition || ''} 
                onChange={val => updateNested('incidentClassification', 'locationCondition', val)} 
                disabled={isCompleted}
              />
            </div>
          </section>

          {/* Injury Analysis */}
          <section className="bg-white p-5 rounded-lg border border-[#DEDEDE] shadow-sm">
            <div className="flex justify-between items-end mb-4">
              <h4 className="text-[14px] font-bold text-[#111827] flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-[#FEF3C7] text-[#D97706] flex items-center justify-center text-[12px]">2</span>
                Injury & Body Part Analysis
              </h4>
              <span className="text-[11px] text-[#6B7280] italic">(Optional if no injury occurred)</span>
            </div>
            <div className="grid grid-cols-2 gap-5">
              <InjuryTypeSelect 
                value={data.injuryAnalysis?.injuryType || ''} 
                onChange={val => updateNested('injuryAnalysis', 'injuryType', val)} 
                disabled={isCompleted}
              />
              <BodyPartGroupSelect 
                value={data.injuryAnalysis?.bodyPartGroup || ''} 
                onChange={val => updateNested('injuryAnalysis', 'bodyPartGroup', val)} 
                disabled={isCompleted}
              />
              <div className="col-span-2">
                <label className="block text-[12px] font-bold text-[#374151] mb-1">Specific Body Part Description</label>
                <input 
                  type="text" 
                  disabled={isCompleted}
                  placeholder="e.g. Left Index Finger, Right Knee Joint" 
                  className="w-full h-9 px-3 text-[13px] border border-[#DEDEDE] rounded-md focus:outline-none focus:border-[#CB0017]"
                  value={data.injuryAnalysis?.bodyPartSpecific || ''} 
                  onChange={e => updateNested('injuryAnalysis', 'bodyPartSpecific', e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* Root Cause & Severity */}
          <section className="bg-white p-5 rounded-lg border border-[#DEDEDE] shadow-sm">
            <h4 className="text-[14px] font-bold text-[#111827] flex items-center gap-2 mb-4">
              <span className="w-6 h-6 rounded-md bg-[#E0E7FF] text-[#4338CA] flex items-center justify-center text-[12px]">3</span>
              Root Cause & Final Evaluation
            </h4>
            <div className="grid grid-cols-1 gap-5">
              <div>
                <label className="block text-[12px] font-bold text-[#374151] mb-1">Primary Root Cause (Deep Analysis)</label>
                <textarea 
                  disabled={isCompleted}
                  placeholder="Analyze the underlying systemic failures..." 
                  className="w-full min-h-[80px] p-3 text-[13px] border border-[#DEDEDE] rounded-md focus:outline-none focus:border-[#CB0017]"
                  value={data.rootCauseAnalysis?.primaryCause || ''} 
                  onChange={e => updateNested('rootCauseAnalysis', 'primaryCause', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[12px] font-bold text-[#374151] mb-1">Contributing Factors</label>
                <textarea 
                  disabled={isCompleted}
                  placeholder="List any secondary factors, human errors, or environmental conditions..." 
                  className="w-full min-h-[60px] p-3 text-[13px] border border-[#DEDEDE] rounded-md focus:outline-none focus:border-[#CB0017]"
                  value={data.rootCauseAnalysis?.contributingFactors || ''} 
                  onChange={e => updateNested('rootCauseAnalysis', 'contributingFactors', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[12px] font-bold text-[#374151] mb-1">Final Assessed Severity</label>
                <div className="flex gap-3">
                  {(['Low', 'Medium', 'High', 'Critical'] as const).map(sev => (
                    <button
                      key={sev}
                      disabled={isCompleted}
                      onClick={() => setData(p => ({ ...p, severityClassification: sev }))}
                      className={`h-9 px-4 rounded text-[13px] font-bold border transition-colors ${
                        data.severityClassification === sev 
                          ? 'bg-[#CB0017] text-white border-[#CB0017]' 
                          : 'bg-white text-[#4B5563] border-[#DEDEDE] hover:border-[#CB0017]'
                      } ${isCompleted && data.severityClassification !== sev ? 'opacity-50' : ''}`}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-bold text-[#374151] mb-1">Additional HSE Remarks</label>
                <textarea 
                  disabled={isCompleted}
                  placeholder="Any final notes from the supervisor..." 
                  className="w-full min-h-[80px] p-3 text-[13px] border border-[#DEDEDE] rounded-md focus:outline-none focus:border-[#CB0017]"
                  value={data.remarks || ''} 
                  onChange={e => setData(p => ({ ...p, remarks: e.target.value }))}
                />
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};
