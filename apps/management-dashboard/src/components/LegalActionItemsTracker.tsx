import { useState, useEffect } from 'react';
import { moduleService } from '../services/api/moduleService';

const statusClass = (status: string) => {
  const value = String(status || '').toLowerCase();
  if (value.includes('done') || value.includes('closed') || value.includes('complete')) return 'bg-[#00B050]';
  if (value.includes('pending')) return 'bg-[#FF0000]';
  return 'bg-[#FFC000]';
};

const severityClass = (severity: string) => {
  const value = String(severity || '').toLowerCase();
  if (value.includes('high') || value.includes('critical')) return 'bg-[#FF0000] text-white';
  if (value.includes('medium')) return 'bg-[#FFC000] text-black';
  return 'bg-[#00B050] text-white';
};

export const LegalActionItemsTracker = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 25;

  useEffect(() => {
    let active = true;
    const fetchItems = async () => {
      setLoading(true);
      try {
        const response = await moduleService.getHseActionItems({ page, limit, sort_by: 'date', sort_order: 'desc' });
        if (active) {
          setItems(response.data || []);
          setTotalPages(response.meta?.pagination?.totalPages || 1);
        }
      } catch (err) {
        console.error('Failed to load action items', err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchItems();
    return () => { active = false; };
  }, [page]);

  return (
    <section className="overflow-hidden rounded-xl border border-[#D9E1EC] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)] border-[#2F65AD]">
      <div className="flex items-center gap-2 border-b border-[#E5E7EB] bg-[#F8FAFC] px-5 py-3">
        <span className="h-4 w-1 rounded-full bg-[#CB0017]" />
        <h2 className="text-[12px] font-bold uppercase tracking-wider text-[#374151]">Assurance — Pending Legal Action Items</h2>
      </div>
      <div className="p-5">
        <div className="overflow-x-auto">
          <table className="min-w-[1450px] w-full border-collapse text-xs text-[#111827]">
            <caption className="bg-[#9DC3E6] px-3 py-2 text-center text-xl font-bold">
              Legal Action Items Tracker
            </caption>
            <thead className="bg-[#DDEBF7] font-bold">
              <tr>
                {['Sr. #', 'Date', 'Month', 'Auditor Name', 'Action Derived From', 'Audit Description', 'Area/Clauses', 'Actions / Recommendation', 'Severity', 'Resp Dept', 'Resp Manager', 'Target date', 'Action Item Status'].map(label => (
                  <th key={label} className="border border-[#374151] px-2 py-2">{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={13} className="border border-[#374151] px-4 py-8 text-center text-sm text-[#64748B]">Loading action items...</td></tr>
              ) : items.length ? (
                items.map((item, index) => {
                  const status = item.status || 'WIP';
                  const severity = item.severity || 'High';
                  const actionKey = item.id;
                  
                  return (
                    <tr key={actionKey} className="align-middle text-center">
                      <td className="border border-[#374151] px-2 py-3">{item.srNo || ((page - 1) * limit + index + 1)}</td>
                      <td className="border border-[#374151] px-2 py-3">{item.dateText || item.date || '—'}</td>
                      <td className="border border-[#374151] px-2 py-3">{item.month || '—'}</td>
                      <td className="border border-[#374151] px-2 py-3">{item.auditorName || '—'}</td>
                      <td className="border border-[#374151] px-2 py-3">{item.actionDerivedFrom || '—'}</td>
                      <td className="border border-[#374151] px-2 py-3">{item.auditDescription || '—'}</td>
                      <td className="max-w-[210px] whitespace-normal border border-[#374151] px-2 py-3 text-left">{item.areaClauses || '—'}</td>
                      <td className="max-w-[240px] whitespace-normal border border-[#374151] px-2 py-3 text-left">{item.recommendation || '—'}</td>
                      <td className={`border border-[#374151] px-2 py-3 font-semibold ${severityClass(severity)}`}>{severity}</td>
                      <td className="border border-[#374151] px-2 py-3">{item.responsibleDepartment || '—'}</td>
                      <td className="border border-[#374151] px-2 py-3">{item.responsibleManager || '—'}</td>
                      <td className="border border-[#374151] px-2 py-3">{item.targetDateText || item.targetDate || '—'}</td>
                      <td className={`border border-[#374151] px-2 py-3 font-semibold ${statusClass(status)}`}>{status}</td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan={13} className="border border-[#374151] px-4 py-8 text-center text-sm text-[#64748B]">No legal action items found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between border-t border-[#E5E7EB] pt-4">
            <div className="text-sm text-[#64748B]">
              Page <span className="font-medium text-[#111827]">{page}</span> of <span className="font-medium text-[#111827]">{totalPages}</span>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                className="rounded border border-[#D1D5DB] px-3 py-1 text-sm font-medium hover:bg-[#F3F4F6] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
                className="rounded border border-[#D1D5DB] px-3 py-1 text-sm font-medium hover:bg-[#F3F4F6] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
