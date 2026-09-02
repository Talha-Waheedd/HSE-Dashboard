import { useCallback, useEffect, useState } from 'react';
import { Edit2, Plus, RefreshCw, RotateCcw, Search, Trash2 } from 'lucide-react';
import { useAuthStore } from '@cbl/auth';
import { CenterModal } from '../../components/CenterModal';
import { adminService, apiErrorMessage, notifyMasterDataChanged, type MasterRecord } from '../../services/api/adminService';

const CARD = 'overflow-hidden rounded-xl border border-[#E0E0E0] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)]';
const FIELD = 'h-10 w-full rounded-md border border-[#DEDEDE] bg-white px-3 text-[13px] text-[#1A1818] focus:border-[#CB0017] focus:outline-none focus:ring-2 focus:ring-[#CB0017]/15';
const PAGE_SIZE = 15;

type Kind = 'locations' | 'departments';
type FormState = { id?: string; name: string; code: string; plantId: string; description: string; isActive: boolean };
const emptyForm: FormState = { name: '', code: '', plantId: '', description: '', isActive: true };

export const MasterDataManagement = ({ kind }: { kind: Kind }) => {
  const singular = kind === 'locations' ? 'Location' : 'Department';
  const permissionPrefix = kind === 'locations' ? 'location' : 'department';
  const { hasPermission } = useAuthStore();
  const canCreate = hasPermission(`${permissionPrefix}:create`);
  const canUpdate = hasPermission(`${permissionPrefix}:update`);
  const canDelete = hasPermission(`${permissionPrefix}:delete`);

  const [records, setRecords] = useState<MasterRecord[]>([]);
  const [plants, setPlants] = useState<MasterRecord[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = kind === 'locations'
        ? await adminService.listLocations({ page, limit: PAGE_SIZE, q: search, sortBy: 'name', sortOrder: 'asc' })
        : await adminService.listDepartments({ page, limit: PAGE_SIZE, q: search, sortBy: 'name', sortOrder: 'asc' });
      setRecords(response.data || []);
      setTotal(Number(response.meta?.totalRecords ?? response.meta?.total ?? 0));
      setTotalPages(Math.max(1, Number(response.meta?.totalPages || 1)));
    } catch (caught) {
      setError(apiErrorMessage(caught, `${singular} records could not be loaded.`));
    } finally {
      setLoading(false);
    }
  }, [kind, page, search, singular]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    void adminService.listPlants().then(setPlants).catch(caught => setError(apiErrorMessage(caught, 'Plants could not be loaded.')));
  }, []);

  const openCreate = () => {
    setForm({ ...emptyForm, plantId: plants[0]?.id || '' });
    setModalOpen(true);
  };
  const openEdit = (record: MasterRecord) => {
    setForm({
      id: record.id,
      name: record.name,
      code: record.code || '',
      plantId: record.plantId || plants[0]?.id || '',
      description: record.description || '',
      isActive: record.isActive !== false,
    });
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.name.trim() || (kind === 'departments' && !form.plantId)) return;
    setSaving(true);
    setError('');
    try {
      const payload = {
        name: form.name.trim(),
        code: form.code.trim() || null,
        plantId: form.plantId || null,
        isActive: form.isActive,
        ...(kind === 'departments' ? { description: form.description.trim() || null } : {}),
      };
      if (form.id) {
        if (kind === 'locations') await adminService.updateLocation(form.id, payload);
        else await adminService.updateDepartment(form.id, payload);
      } else if (kind === 'locations') await adminService.createLocation(payload);
      else await adminService.createDepartment(payload);
      notifyMasterDataChanged(kind);
      setMessage(`${singular} ${form.id ? 'updated' : 'created'} successfully.`);
      setModalOpen(false);
      await load();
    } catch (caught) {
      setError(apiErrorMessage(caught, `${singular} could not be saved.`));
    } finally {
      setSaving(false);
    }
  };

  const setActive = async (record: MasterRecord, active: boolean) => {
    if (!active && !window.confirm(`Deactivate ${record.name}? It will be hidden from new-entry dropdowns but retained for history.`)) return;
    setError('');
    try {
      if (active) {
        const payload = { isActive: true };
        if (kind === 'locations') await adminService.updateLocation(record.id, payload);
        else await adminService.updateDepartment(record.id, payload);
      } else if (kind === 'locations') await adminService.deactivateLocation(record.id);
      else await adminService.deactivateDepartment(record.id);
      notifyMasterDataChanged(kind);
      setMessage(`${record.name} ${active ? 'activated' : 'deactivated'}.`);
      await load();
    } catch (caught) {
      setError(apiErrorMessage(caught, `${singular} status could not be changed.`));
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-lg font-bold text-[#1C1C1E]">{kind === 'locations' ? 'Locations' : 'Departments'}</h2><p className="text-[13px] text-[#6B7280]">Central master data used by reporting and operational forms</p></div>
        {canCreate && <button type="button" onClick={openCreate} className="flex h-9 items-center gap-2 rounded-md bg-[#CB0017] px-4 text-[13px] font-semibold text-white hover:bg-[#A30012]"><Plus className="h-4 w-4" /> Add {singular}</button>}
      </div>
      {(error || message) && <div role={error ? 'alert' : 'status'} className={`rounded-md border px-4 py-3 text-[13px] ${error ? 'border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]' : 'border-[#BBF7D0] bg-[#F0FDF4] text-[#166534]'}`}>{error || message}</div>}
      <div className="flex items-center gap-2">
        <div className="relative max-w-md flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" /><input aria-label={`Search ${kind}`} value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} placeholder={`Search ${kind} by name or code`} className={`${FIELD} pl-9`} /></div>
        <button type="button" onClick={() => void load()} aria-label="Refresh" className="flex h-10 w-10 items-center justify-center rounded-md border border-[#DEDEDE] bg-white text-[#6B7280] hover:text-[#CB0017]"><RotateCcw className="h-4 w-4" /></button>
      </div>
      <div className={CARD}>
        <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left"><thead><tr className="border-b border-[#F0F0F0] bg-[#FAFAFA]">{['Name', 'Code', 'Plant', 'Status', 'Actions'].map(label => <th key={label} className={`px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-[#6B7280] ${label === 'Actions' ? 'text-right' : ''}`}>{label}</th>)}</tr></thead>
          <tbody>{loading ? <tr><td colSpan={5} className="px-5 py-12 text-center"><RefreshCw className="mx-auto h-6 w-6 animate-spin text-[#CB0017]" /></td></tr> : records.length ? records.map(record => <tr key={record.id} className="border-b border-[#F0F0F0] hover:bg-[#FAFAFA]">
            <td className="px-5 py-3 text-[13px] font-semibold text-[#1C1C1E]">{record.name}</td><td className="px-5 py-3 text-[13px] text-[#6B7280]">{record.code || '—'}</td><td className="px-5 py-3 text-[13px] text-[#6B7280]">{plants.find(plant => plant.id === record.plantId)?.name || '—'}</td><td className="px-5 py-3"><span className={`rounded px-2 py-1 text-[11px] font-semibold ${record.isActive ? 'bg-[#ECFDF5] text-[#047857]' : 'bg-[#F3F4F6] text-[#6B7280]'}`}>{record.isActive ? 'Active' : 'Inactive'}</span></td>
            <td className="px-5 py-3"><div className="flex justify-end gap-1">{canUpdate && <button type="button" title={`Edit ${singular}`} onClick={() => openEdit(record)} className="rounded p-2 text-[#6B7280] hover:bg-[#EFF6FF] hover:text-[#2563EB]"><Edit2 className="h-4 w-4" /></button>}{record.isActive ? canDelete && <button type="button" title={`Deactivate ${singular}`} onClick={() => void setActive(record, false)} className="rounded p-2 text-[#6B7280] hover:bg-[#FEF2F2] hover:text-[#CB0017]"><Trash2 className="h-4 w-4" /></button> : canUpdate && <button type="button" onClick={() => void setActive(record, true)} className="rounded px-2 py-1 text-[11px] font-semibold text-[#047857] hover:bg-[#ECFDF5]">Activate</button>}</div></td>
          </tr>) : <tr><td colSpan={5} className="px-5 py-12 text-center text-[13px] text-[#6B7280]">No {kind} found.</td></tr>}</tbody></table></div>
        <div className="flex items-center justify-between border-t border-[#F0F0F0] px-5 py-3 text-[12px] text-[#6B7280]"><span>{total} records</span><div className="flex items-center gap-2"><button disabled={page <= 1} onClick={() => setPage(value => value - 1)} className="rounded border px-3 py-1.5 disabled:opacity-40">Previous</button><span>Page {page} of {totalPages}</span><button disabled={page >= totalPages} onClick={() => setPage(value => value + 1)} className="rounded border px-3 py-1.5 disabled:opacity-40">Next</button></div></div>
      </div>

      <CenterModal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={`${form.id ? 'Edit' : 'Add'} ${singular}`}>
        <div className="w-[460px] max-w-[90vw] space-y-4 p-6">
          <label className="block text-[12px] font-bold text-[#374151]">Name *<input value={form.name} onChange={event => setForm(value => ({ ...value, name: event.target.value }))} className={`${FIELD} mt-1`} autoFocus /></label>
          <label className="block text-[12px] font-bold text-[#374151]">Code<input value={form.code} onChange={event => setForm(value => ({ ...value, code: event.target.value }))} className={`${FIELD} mt-1`} /></label>
          <label className="block text-[12px] font-bold text-[#374151]">Plant {kind === 'departments' ? '*' : ''}<select value={form.plantId} onChange={event => setForm(value => ({ ...value, plantId: event.target.value }))} className={`${FIELD} mt-1`}><option value="">No plant</option>{plants.map(plant => <option key={plant.id} value={plant.id}>{plant.name}</option>)}</select></label>
          {kind === 'departments' && <label className="block text-[12px] font-bold text-[#374151]">Description<textarea value={form.description} onChange={event => setForm(value => ({ ...value, description: event.target.value }))} className="mt-1 min-h-20 w-full rounded-md border border-[#DEDEDE] p-3 text-[13px]" /></label>}
          {form.id && <label className="flex items-center gap-2 text-[13px] font-medium text-[#374151]"><input type="checkbox" checked={form.isActive} onChange={event => setForm(value => ({ ...value, isActive: event.target.checked }))} /> Active for new records</label>}
          <div className="flex justify-end gap-2 pt-3"><button type="button" onClick={() => setModalOpen(false)} className="rounded-md px-4 py-2 text-[13px] font-semibold text-[#4B5563] hover:bg-[#F3F4F6]">Cancel</button><button type="button" disabled={saving || !form.name.trim() || (kind === 'departments' && !form.plantId)} onClick={() => void save()} className="rounded-md bg-[#CB0017] px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-50">{saving ? 'Saving…' : `Save ${singular}`}</button></div>
        </div>
      </CenterModal>
    </div>
  );
};

export const LocationsManagement = () => <MasterDataManagement kind="locations" />;
export const DepartmentsManagement = () => <MasterDataManagement kind="departments" />;
