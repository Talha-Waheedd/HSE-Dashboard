import { Layout } from '../components/Layout';
import { ContextHeader } from '../components/ContextHeader';
import { BadgeCheck, Clock3, FileText, Link2, ListChecks, Table2 } from 'lucide-react';

const VERSION_HISTORY = [
  { version: 'V3.2', date: '2026-07-21', note: 'Clarified permit-to-work checks' },
  { version: 'V3.1', date: '2026-05-14', note: 'Updated PPE control section' },
  { version: 'V3.0', date: '2026-03-02', note: 'Major review and approval cycle' },
];

const CIRCULATION_LIST = [
  { name: 'HSE Manager', department: 'HSE', status: 'Approved' },
  { name: 'Production Manager', department: 'PROD', status: 'Review Pending' },
  { name: 'QA Lead', department: 'QA', status: 'Distributed' },
];

const RELATED = [
  'Permit to Work SOP',
  'Emergency Response Procedure',
  'LOTO Work Instruction',
];

export const SOPDetails = () => {
  return (
    <Layout>
      <ContextHeader
        title="SOP Details"
        breadcrumbs={['Documentation', 'SOP Details']}
        subtitle="Document information, approvals, circulation, and history"
      />

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 space-y-4">
            <div className="bg-white border border-[#E0E0E0] rounded-2xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-4 w-4 text-[#CB0017]" />
                <h2 className="text-[12px] font-bold uppercase tracking-wider text-[#374151]">Document Information</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[13px]">
                <div>
                  <p className="text-[#9CA3AF] text-[11px] uppercase tracking-wider font-semibold">Title</p>
                  <p className="text-[#1A1818] font-medium mt-1">Work at Height SOP</p>
                </div>
                <div>
                  <p className="text-[#9CA3AF] text-[11px] uppercase tracking-wider font-semibold">Current Version</p>
                  <p className="text-[#1A1818] font-medium mt-1">V3.2</p>
                </div>
                <div>
                  <p className="text-[#9CA3AF] text-[11px] uppercase tracking-wider font-semibold">Owner</p>
                  <p className="text-[#1A1818] font-medium mt-1">HSE Department</p>
                </div>
                <div>
                  <p className="text-[#9CA3AF] text-[11px] uppercase tracking-wider font-semibold">Effective Date</p>
                  <p className="text-[#1A1818] font-medium mt-1">2026-07-21</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-[#E0E0E0] rounded-2xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="flex items-center gap-2 mb-4">
                <Clock3 className="h-4 w-4 text-[#CB0017]" />
                <h2 className="text-[12px] font-bold uppercase tracking-wider text-[#374151]">Version History Timeline</h2>
              </div>
              <div className="space-y-4">
                {VERSION_HISTORY.map(item => (
                  <div key={item.version} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="h-3 w-3 rounded-full bg-[#CB0017] mt-1" />
                      <div className="w-px flex-1 bg-[#E5E7EB] mt-2" />
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-[12px] font-semibold text-[#CB0017]">{item.version}</span>
                        <span className="text-[11px] text-[#9CA3AF]">{item.date}</span>
                      </div>
                      <p className="text-[13px] text-[#374151] mt-1">{item.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-[#E0E0E0] rounded-2xl overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-[#F0F0F0]">
                <Table2 className="h-4 w-4 text-[#CB0017]" />
                <h2 className="text-[12px] font-bold uppercase tracking-wider text-[#374151]">Circulation List Table</h2>
              </div>
              <table className="w-full enterprise-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Department</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {CIRCULATION_LIST.map(row => (
                    <tr key={row.name}>
                      <td>{row.name}</td>
                      <td>{row.department}</td>
                      <td>{row.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-white border border-[#E0E0E0] rounded-2xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="flex items-center gap-2 mb-4">
                <Link2 className="h-4 w-4 text-[#CB0017]" />
                <h2 className="text-[12px] font-bold uppercase tracking-wider text-[#374151]">Change History Timeline</h2>
              </div>
              <div className="space-y-3">
                <div className="rounded-xl border border-[#F0F0F0] p-4">
                  <p className="text-[13px] font-semibold text-[#1A1818]">Section 4 updated</p>
                  <p className="text-[12px] text-[#6B7280] mt-1">Alignment with revised permit-to-work controls.</p>
                </div>
                <div className="rounded-xl border border-[#F0F0F0] p-4">
                  <p className="text-[13px] font-semibold text-[#1A1818]">PPE guidance refined</p>
                  <p className="text-[12px] text-[#6B7280] mt-1">Clarified mandatory harness inspection steps.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white border border-[#E0E0E0] rounded-2xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="flex items-center gap-2 mb-4">
                <BadgeCheck className="h-4 w-4 text-[#1B7C1B]" />
                <h2 className="text-[12px] font-bold uppercase tracking-wider text-[#374151]">Approvals Card</h2>
              </div>
              <div className="space-y-3">
                <div className="rounded-xl border border-[#EDEDED] p-3">
                  <p className="text-[12px] font-semibold text-[#1A1818]">Approved by HSE Manager</p>
                  <p className="text-[11px] text-[#6B7280] mt-1">July 21, 2026</p>
                </div>
                <div className="rounded-xl border border-dashed border-[#D6D6D6] bg-[#FAFAFA] p-3">
                  <p className="text-[12px] font-semibold text-[#374151]">Pending secondary approval</p>
                  <p className="text-[11px] text-[#6B7280] mt-1">Future workflow hookup point.</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-[#E0E0E0] rounded-2xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="flex items-center gap-2 mb-4">
                <ListChecks className="h-4 w-4 text-[#CB0017]" />
                <h2 className="text-[12px] font-bold uppercase tracking-wider text-[#374151]">Related Documents</h2>
              </div>
              <div className="space-y-2">
                {RELATED.map(item => (
                  <div key={item} className="rounded-lg border border-[#F0F0F0] px-3 py-2 text-[13px] text-[#374151] hover:bg-[#FAFAFA]">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SOPDetails;
