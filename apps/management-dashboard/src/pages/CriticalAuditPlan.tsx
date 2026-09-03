import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileSpreadsheet, Search, Upload } from 'lucide-react';
import { Layout } from '../components/Layout';
import { ContextHeader } from '../components/ContextHeader';
import { adminService, apiErrorMessage, type MasterRecord } from '../services/api/adminService';
import { auditService, type AuditPlan, type PageMeta } from '../services/api/auditService';
import { PaginationControls } from '../components/PaginationControls';

const PAGE_SIZE = 25;
const EMPTY_META: PageMeta = { currentPage: 1, pageSize: PAGE_SIZE, totalRecords: 0, totalPages: 1 };
const inputClass = 'h-9 rounded-md border border-[#D1D5DB] bg-white px-3 text-[13px] text-[#374151] outline-none focus:border-[#CB0017]';

export const CriticalAuditPlan = () => {
  const navigate = useNavigate();
  const fileInput = useRef<HTMLInputElement>(null);
  const [plans, setPlans] = useState<AuditPlan[]>([]);
  const [plants, setPlants] = useState<MasterRecord[]>([]);
  const [plantId, setPlantId] = useState<string>(String(import.meta.env.VITE_DEFAULT_PLANT_ID || '5126923e-b77f-4eb6-8b98-d5fc9db8d71b'));
  const [meta, setMeta] = useState<PageMeta>(EMPTY_META);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    void adminService.listPlants().then(data => {
      setPlants(data);
      setPlantId(current => current || data[0]?.id || '');
    }).catch(() => setPlants([]));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await auditService.listPlans({
        page,
        limit: PAGE_SIZE,
        search: search.trim() || undefined,
        status: status || undefined,
        plantId: plantId || undefined,
        sortBy: 'serialNumber',
        sortOrder: 'asc',
      });
      setPlans(response.data);
      setMeta(response.meta);
    } catch (loadError: any) {
      setError(apiErrorMessage(loadError, 'Unable to load the Critical Audit Plan.'));
    } finally {
      setLoading(false);
    }
  }, [page, plantId, search, status]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 200);
    return () => window.clearTimeout(timer);
  }, [load]);

  const importWorkbook = async (file?: File) => {
    if (!file || !plantId) return;
    setImporting(true);
    setError('');
    setMessage('');
    try {
      const result = await auditService.importPlan(file, plantId);
      setMessage(`Imported ${result.planRows} plan rows and ${result.scheduledOccurrences} scheduled occurrences: ${result.createdLogs} new, ${result.linkedExistingLogs} existing records linked, ${result.existingLogs} already present.${result.warnings?.length ? ` ${result.warnings.length} source-data warning(s) retained.` : ''}`);
      setPage(1);
      await load();
    } catch (importError: any) {
      setError(apiErrorMessage(importError, 'Critical Audit Plan import failed.'));
    } finally {
      setImporting(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  return <Layout>
    <ContextHeader
      title="Critical Audit Plan"
      breadcrumbs={['Compliance', 'Critical Audit Plan']}
      subtitle="Yearly master schedule; each scheduled date generates one Audit Log"
      actions={[{ label: importing ? 'Importing...' : 'Import Excel', icon: <Upload />, onClick: () => fileInput.current?.click(), disabled: importing || !plantId }]}
    />
    <input ref={fileInput} className="hidden" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={event => void importWorkbook(event.target.files?.[0])} />
    <main className="mx-auto max-w-[1800px] space-y-4 p-5 sm:p-6">
      {message && <div className="rounded-md border border-[#BBF7D0] bg-[#F0FDF4] px-4 py-3 text-sm text-[#166534]" role="status">{message}</div>}
      {error && <div className="rounded-md border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#991B1B]" role="alert">{error}</div>}
      <section className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-3 border-b border-[#E5E7EB] bg-[#FAFAFA] p-4">
          <label className="relative min-w-64 flex-1 max-w-md"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" /><input aria-label="Search Critical Audit Plan" value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} placeholder="Search area, owner, objective or auditor..." className={`${inputClass} w-full pl-9`} /></label>
          <select aria-label="Select plant for Critical Audit Plan" value={plantId} onChange={event => { setPlantId(event.target.value); setPage(1); }} className={inputClass}>{plants.map(plant => <option key={plant.id} value={plant.id}>{plant.name}</option>)}</select>
          <select aria-label="Filter plan by status" value={status} onChange={event => { setStatus(event.target.value); setPage(1); }} className={inputClass}><option value="">All Statuses</option><option>Pending</option><option>WIP</option><option>Done</option></select>
        </div>
        <div className={`min-h-[420px] overflow-x-auto ${loading ? 'opacity-60' : ''}`}>
          <table className="w-full min-w-[1450px] border-collapse text-left">
            <thead><tr className="border-b border-[#E5E7EB]">{['S.No', 'Area Name', 'Area Owners', 'Audit Objective', 'Risk Rating', 'Auditors', 'Frequency', 'Scheduled Logs', 'Plan Status', 'Actions'].map(label => <th key={label} className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">{label}</th>)}</tr></thead>
            <tbody className="text-[13px]">
              {!loading && plans.length === 0 && <tr><td colSpan={10} className="px-5 py-12 text-center text-[#6B7280]"><FileSpreadsheet className="mx-auto mb-2 h-7 w-7 text-[#9CA3AF]" />Import the Critical Audit Plan workbook to create the master schedule.</td></tr>}
              {plans.map(plan => <tr key={plan.id} className="border-b border-[#E5E7EB] align-top hover:bg-[#FFF9F9]">
                <td className="px-4 py-3 font-semibold">{plan.serialNumber ?? '—'}</td>
                <td className="max-w-64 whitespace-pre-wrap px-4 py-3 font-semibold text-[#111827]">{plan.areaName}</td>
                <td className="max-w-56 whitespace-pre-wrap px-4 py-3">{plan.areaOwners || '—'}</td>
                <td className="max-w-72 whitespace-pre-wrap px-4 py-3">{plan.auditObjective || '—'}</td>
                <td className="px-4 py-3">{plan.riskRating || '—'}</td>
                <td className="max-w-52 whitespace-pre-wrap px-4 py-3">{plan.auditors || '—'}</td>
                <td className="px-4 py-3">{plan.frequency || '—'}</td>
                <td className="px-4 py-3 font-semibold">{plan.occurrenceCount}</td>
                <td className="px-4 py-3"><span className="rounded bg-[#F3F4F6] px-2 py-1 text-[11px] font-bold">{plan.status}</span></td>
                <td className="px-4 py-3 text-right"><button type="button" onClick={() => navigate(`/audit-management?planId=${plan.id}`)} className="h-8 rounded-md border border-[#CB0017] px-3 text-[12px] font-bold text-[#CB0017] hover:bg-[#FFF1F2]">View Logs</button></td>
              </tr>)}
            </tbody>
          </table>
        </div>
        <PaginationControls currentPage={page} totalPages={meta.totalPages} totalRecords={meta.totalRecords} pageSize={PAGE_SIZE} onPageChange={setPage} disabled={loading} itemLabel="plan rows" />
      </section>
    </main>
  </Layout>;
};
