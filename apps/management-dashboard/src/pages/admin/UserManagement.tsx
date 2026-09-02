import { useCallback, useEffect, useState } from 'react';
import { Edit2, Plus, RefreshCw, Search, Trash2, UserCheck, UserX, Users } from 'lucide-react';
import { useAuthStore } from '@cbl/auth';
import { CenterModal } from '../../components/CenterModal';
import { adminService, apiErrorMessage, type MasterRecord, type RoleRecord, type UserRecord } from '../../services/api/adminService';

const CARD = 'overflow-hidden rounded-xl border border-[#E0E0E0] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)]';
const FIELD = 'h-10 w-full rounded-md border border-[#DEDEDE] bg-white px-3 text-[13px] text-[#1A1818] focus:border-[#CB0017] focus:outline-none focus:ring-2 focus:ring-[#CB0017]/15';
const PAGE_SIZE = 15;

type UserForm = {
  id?: string; firstName: string; lastName: string; email: string; employeeId: string;
  departmentId: string; roleId: string; designation: string; phone: string; password: string; status: boolean;
};
const emptyForm: UserForm = { firstName: '', lastName: '', email: '', employeeId: '', departmentId: '', roleId: '', designation: '', phone: '', password: '', status: true };

export const UserManagement = () => {
  const { hasPermission } = useAuthStore();
  const canCreate = hasPermission('user:create');
  const canUpdate = hasPermission('user:update');
  const canDelete = hasPermission('user:delete');
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [departments, setDepartments] = useState<MasterRecord[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<UserForm>(emptyForm);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await adminService.listUsers({ page, pageSize: PAGE_SIZE, search });
      setUsers(response.data || []);
      setTotal(Number(response.meta?.total ?? response.meta?.totalRecords ?? 0));
      setTotalPages(Math.max(1, Number(response.meta?.totalPages || 1)));
    } catch (caught) {
      setError(apiErrorMessage(caught, 'Users could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }, [page, search]);
  useEffect(() => { void loadUsers(); }, [loadUsers]);
  useEffect(() => {
    void Promise.all([
      adminService.listRoles(),
      adminService.listDepartments({ page: 1, limit: 100, isActive: true, sortBy: 'name', sortOrder: 'asc' }),
    ]).then(([loadedRoles, loadedDepartments]) => {
      setRoles(loadedRoles || []);
      setDepartments(loadedDepartments.data || []);
    }).catch(caught => setError(apiErrorMessage(caught, 'User form options could not be loaded.')));
  }, []);

  const edit = (user: UserRecord) => {
    setForm({
      id: user.id,
      firstName: user.firstName || '', lastName: user.lastName || '', email: user.email || '',
      employeeId: user.employeeProfile?.employeeId || '', departmentId: user.employeeProfile?.departmentId || '',
      roleId: user.roleId || user.role?.id || '', designation: user.employeeProfile?.designation || '',
      phone: user.phone || '', password: '', status: user.status !== false,
    });
    setModalOpen(true);
  };

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const payload: Record<string, unknown> = {
        firstName: form.firstName.trim(), lastName: form.lastName.trim(), email: form.email.trim(),
        employeeId: form.employeeId.trim(), departmentId: form.departmentId, roleId: form.roleId,
        designation: form.designation.trim() || null, phone: form.phone.trim() || null, status: form.status,
      };
      if (form.password) payload.password = form.password;
      if (form.id) await adminService.updateUser(form.id, payload); else await adminService.createUser(payload);
      setModalOpen(false);
      setMessage(`User ${form.id ? 'updated' : 'created'} successfully.`);
      await loadUsers();
    } catch (caught) {
      setError(apiErrorMessage(caught, 'User could not be saved.'));
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (user: UserRecord) => {
    try {
      await adminService.updateUser(user.id, { status: !user.status });
      setMessage(`${user.firstName} ${user.lastName} ${user.status ? 'deactivated' : 'activated'}.`);
      await loadUsers();
    } catch (caught) { setError(apiErrorMessage(caught, 'User status could not be changed.')); }
  };
  const deleteUser = async (user: UserRecord) => {
    if (!window.confirm(`Delete ${user.firstName} ${user.lastName}? The account will be archived.`)) return;
    try {
      await adminService.deleteUser(user.id);
      setMessage('User archived successfully.');
      await loadUsers();
    } catch (caught) { setError(apiErrorMessage(caught, 'User could not be deleted.')); }
  };

  const valid = form.firstName.trim() && form.lastName.trim() && form.email.trim() && form.employeeId.trim() && form.departmentId && form.roleId;

  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold text-[#1C1C1E]">User Management</h2><p className="text-[13px] text-[#6B7280]">Database-backed user, employee, role, and department assignments</p></div>{canCreate && <button onClick={() => { setForm({ ...emptyForm, roleId: roles[0]?.id || '', departmentId: departments[0]?.id || '' }); setModalOpen(true); }} className="flex h-9 items-center gap-2 rounded-md bg-[#CB0017] px-4 text-[13px] font-semibold text-white"><Plus className="h-4 w-4" /> Add User</button>}</div>
    {(error || message) && <div role={error ? 'alert' : 'status'} className={`rounded-md border px-4 py-3 text-[13px] ${error ? 'border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]' : 'border-[#BBF7D0] bg-[#F0FDF4] text-[#166534]'}`}>{error || message}</div>}
    <div className="relative max-w-md"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" /><input aria-label="Search users" value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} placeholder="Search users by name or email" className={`${FIELD} pl-9`} /></div>
    <div className={CARD}><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left"><thead><tr className="border-b bg-[#FAFAFA]">{['User', 'Employee ID', 'Department', 'Role', 'Status', 'Last Login', 'Actions'].map(label => <th key={label} className={`px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-[#6B7280] ${label === 'Actions' ? 'text-right' : ''}`}>{label}</th>)}</tr></thead><tbody>{loading ? <tr><td colSpan={7} className="py-14"><RefreshCw className="mx-auto h-7 w-7 animate-spin text-[#CB0017]" /></td></tr> : users.length ? users.map(user => <tr key={user.id} className="border-b border-[#F0F0F0] hover:bg-[#FAFAFA]"><td className="px-5 py-3"><div className="text-[13px] font-bold">{user.firstName} {user.lastName}</div><div className="text-[11px] text-[#6B7280]">{user.email}</div></td><td className="px-5 py-3 text-[13px]">{user.employeeProfile?.employeeId || '—'}</td><td className="px-5 py-3 text-[13px]">{user.employeeProfile?.department?.code || user.employeeProfile?.department?.name || '—'}</td><td className="px-5 py-3 text-[13px]">{user.role?.displayName || user.role?.name || 'Unassigned'}</td><td className="px-5 py-3"><span className={`rounded px-2 py-1 text-[11px] font-semibold ${user.status ? 'bg-[#ECFDF5] text-[#047857]' : 'bg-[#F3F4F6] text-[#6B7280]'}`}>{user.status ? 'Active' : 'Inactive'}</span></td><td className="px-5 py-3 text-[12px] text-[#6B7280]">{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}</td><td className="px-5 py-3"><div className="flex justify-end gap-1">{canUpdate && <><button title="Edit User" onClick={() => edit(user)} className="rounded p-2 text-[#2563EB] hover:bg-[#EFF6FF]"><Edit2 className="h-4 w-4" /></button><button title={user.status ? 'Deactivate User' : 'Activate User'} onClick={() => void toggleStatus(user)} className="rounded p-2 text-[#6B7280] hover:bg-[#F3F4F6]">{user.status ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}</button></>}{canDelete && <button title="Delete User" onClick={() => void deleteUser(user)} className="rounded p-2 text-[#CB0017] hover:bg-[#FEF2F2]"><Trash2 className="h-4 w-4" /></button>}</div></td></tr>) : <tr><td colSpan={7} className="py-14 text-center text-[13px] text-[#6B7280]"><Users className="mx-auto mb-2 h-8 w-8 text-[#D1D5DB]" />No users found.</td></tr>}</tbody></table></div><div className="flex items-center justify-between border-t px-5 py-3 text-[12px] text-[#6B7280]"><span>{total} users</span><div className="flex items-center gap-2"><button disabled={page <= 1} onClick={() => setPage(value => value - 1)} className="rounded border px-3 py-1.5 disabled:opacity-40">Previous</button><span>Page {page} of {totalPages}</span><button disabled={page >= totalPages} onClick={() => setPage(value => value + 1)} className="rounded border px-3 py-1.5 disabled:opacity-40">Next</button></div></div></div>
    <CenterModal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={form.id ? 'Edit User' : 'Add User'}><div className="grid w-[600px] max-w-[90vw] grid-cols-2 gap-4 p-6">{([['firstName', 'First Name *'], ['lastName', 'Last Name *'], ['email', 'Email *'], ['employeeId', 'Employee ID *'], ['designation', 'Designation'], ['phone', 'Phone']] as const).map(([key, label]) => <label key={key} className={`block text-[12px] font-bold text-[#374151] ${key === 'email' ? 'col-span-2' : ''}`}>{label}<input type={key === 'email' ? 'email' : 'text'} value={form[key]} onChange={event => setForm(value => ({ ...value, [key]: event.target.value }))} className={`${FIELD} mt-1`} /></label>)}<label className="block text-[12px] font-bold text-[#374151]">Department *<select value={form.departmentId} onChange={event => setForm(value => ({ ...value, departmentId: event.target.value }))} className={`${FIELD} mt-1`}><option value="">Select department…</option>{departments.map(department => <option key={department.id} value={department.id}>{department.code || department.name}</option>)}</select></label><label className="block text-[12px] font-bold text-[#374151]">Role *<select value={form.roleId} onChange={event => setForm(value => ({ ...value, roleId: event.target.value }))} className={`${FIELD} mt-1`}><option value="">Select role…</option>{roles.map(role => <option key={role.id} value={role.id}>{role.displayName || role.name}</option>)}</select></label><label className="col-span-2 block text-[12px] font-bold text-[#374151]">{form.id ? 'New Password (leave blank to keep current)' : 'Password (optional for Microsoft-only users)'}<input type="password" value={form.password} onChange={event => setForm(value => ({ ...value, password: event.target.value }))} className={`${FIELD} mt-1`} autoComplete="new-password" /></label><label className="col-span-2 flex items-center gap-2 text-[13px] font-medium"><input type="checkbox" checked={form.status} onChange={event => setForm(value => ({ ...value, status: event.target.checked }))} /> Active account</label><div className="col-span-2 flex justify-end gap-2 pt-2"><button onClick={() => setModalOpen(false)} className="rounded-md px-4 py-2 text-[13px] font-semibold text-[#4B5563]">Cancel</button><button disabled={saving || !valid} onClick={() => void save()} className="rounded-md bg-[#CB0017] px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-50">{saving ? 'Saving…' : 'Save User'}</button></div></div></CenterModal>
  </div>;
};
