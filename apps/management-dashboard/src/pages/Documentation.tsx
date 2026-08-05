import { Layout } from '../components/Layout';
import { ContextHeader } from '../components/ContextHeader';
import { Search, Upload, FolderKanban, Clock3, FileText, BadgeCheck } from 'lucide-react';

const DOCUMENT_FOLDERS = [
  { title: 'Controlled SOPs', count: 24, tone: 'bg-[#FFF7F7] text-[#CB0017]' },
  { title: 'Obsolete SOPs', count: 6, tone: 'bg-[#FEF2F2] text-[#991B1B]' },
  { title: 'Risk Assessments', count: 12, tone: 'bg-[#EFF6FF] text-[#1D4ED8]' },
  { title: 'Training Records', count: 48, tone: 'bg-[#ECFDF5] text-[#065F46]' },
  { title: 'Policies', count: 9, tone: 'bg-[#F5F3FF] text-[#6D28D9]' },
  { title: 'Procedures', count: 18, tone: 'bg-[#FFFBEB] text-[#92400E]' },
];

const RECENT_DOCUMENTS = [
  { name: 'SOP - Work at Height', version: 'V3.2', updated: '2 hours ago' },
  { name: 'Risk Assessment - Boiler Room', version: 'V1.7', updated: 'Yesterday' },
  { name: 'Fire Drill Attendance Register', version: 'V2.0', updated: '3 days ago' },
];

export const Documentation = () => {
  return (
    <Layout>
      <ContextHeader
        title="Documentation Library"
        breadcrumbs={['Documentation']}
        subtitle="Folder-style document workspace with versioned enterprise record cards"
        actions={[
          { label: 'Upload', icon: <Upload />, onClick: () => undefined, variant: 'primary' }
        ]}
      />

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr] gap-4">
          <div className="bg-white border border-[#E0E0E0] rounded-xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
                <input
                  type="search"
                  placeholder="Search documents, SOPs, policies..."
                  className="w-full h-10 pl-10 pr-4 border border-[#DEDEDE] rounded-md text-[13px] focus:outline-none focus:border-[#CB0017] focus:ring-2 focus:ring-[#CB0017]/15"
                />
              </div>
              <button className="h-10 px-4 rounded-md border border-[#DEDEDE] bg-white text-[13px] font-medium hover:bg-[#F5F5F5] inline-flex items-center gap-2">
                <Upload className="h-4 w-4" /> Upload Button
              </button>
            </div>
          </div>
          <div className="bg-white border border-[#E0E0E0] rounded-xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
            <div className="flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-[#CB0017]" />
              <h2 className="text-[12px] font-bold uppercase tracking-wider text-[#374151]">Recent Documents</h2>
            </div>
            <div className="mt-4 space-y-3">
              {RECENT_DOCUMENTS.map(doc => (
                <div key={doc.name} className="rounded-lg border border-[#F0F0F0] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-[#1A1818] truncate">{doc.name}</p>
                      <p className="text-[11px] text-[#9CA3AF] mt-1">{doc.updated}</p>
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider rounded-full px-2 py-1 bg-[#FFF7F7] text-[#CB0017] border border-[#F1C3C8]">
                      {doc.version}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {DOCUMENT_FOLDERS.map(folder => (
            <div key={folder.title} className="bg-white border border-[#E0E0E0] rounded-2xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)] hover:shadow-[0_3px_14px_rgba(0,0,0,0.10)] transition-shadow">
              <div className="flex items-start justify-between gap-3">
                <div className="h-12 w-12 rounded-2xl bg-[#FAFAFA] border border-[#EDEDED] flex items-center justify-center text-[#9CA3AF]">
                  <FolderKanban className="h-5 w-5" />
                </div>
                <span className={`text-[10px] font-semibold uppercase tracking-wider rounded-full px-2 py-1 ${folder.tone}`}>
                  Version Badge
                </span>
              </div>
              <h3 className="text-[15px] font-semibold text-[#1A1818] mt-4">{folder.title}</h3>
              <p className="text-[12px] text-[#6B7280] mt-1">{folder.count} documents stored in this category.</p>
              <div className="mt-4 inline-flex items-center gap-2 text-[12px] font-medium text-[#374151]">
                <FileText className="h-4 w-4 text-[#9CA3AF]" />
                Folder-style card
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white border border-[#E0E0E0] rounded-xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <div className="flex items-center gap-2 mb-4">
            <BadgeCheck className="h-4 w-4 text-[#1B7C1B]" />
            <h2 className="text-[12px] font-bold uppercase tracking-wider text-[#374151]">Versioned Library Notes</h2>
          </div>
          <p className="text-[13px] text-[#6B7280]">
            No functionality is wired here yet. This layout exists so controlled documents, obsolete documents, and supporting HSE records can later be connected to storage and approval workflows.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Documentation;
