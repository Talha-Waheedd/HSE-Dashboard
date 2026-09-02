import { useCallback, useEffect, useMemo, useState } from 'react';
import { Copy, Edit2, Plus, RefreshCw, Save, Settings2, Shield, Trash2 } from 'lucide-react';
import { useAuthStore } from '@cbl/auth';
import { CenterModal } from '../../components/CenterModal';
import { adminService, apiErrorMessage, type PermissionRecord, type RoleRecord } from '../../services/api/adminService';

const CARD = 'overflow-hidden rounded-xl border border-[#E0E0E0] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)]';
const FIELD = 'h-10 w-full rounded-md border border-[#DEDEDE] bg-white px-3 text-[13px] text-[#1A1818] focus:border-[#CB0017] focus:outline-none focus:ring-2 focus:ring-[#CB0017]/15';

type RoleForm = { id?: string; name: string; description: string; permissionIds: string[]; cloneFrom?: string };
const emptyForm: RoleForm = { name: '', description: '', permissionIds: [] };

export const RolesPermissions = () => {
  const { hasPermission } = useAuthStore();
  const canCreate = hasPermission('role:create');
  const canUpdate = hasPermission('role:update');
  const canDelete = hasPermission('role:delete');
  const [activeTab, setActiveTab] = useState<'Roles' | 'Permissions'>('Roles');
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [permissions, setPermissions] = useState<PermissionRecord[]>([]);
  const [draftPermissions, setDraftPermissions] = useState<Record<string, Set<string>>>({});
  const [loading, setLoading] = useState(true);
  const [savingRoleId, setSavingRoleId] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<RoleForm>(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [loadedRoles, loadedPermissions] = await Promise.all([adminService.listRoles(), adminService.listPermissions()]);
      setRoles(loadedRoles || []);
      setPermissions(loadedPermissions || []);
      setDraftPermissions(Object.fromEntries((loadedRoles || []).map(role => [role.id, new Set((role.permissions || []).map(permission => permission.id))])));
    } catch (caught) {
      setError(apiErrorMessage(caught, 'Roles and permissions could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const permissionGroups = useMemo(() => {
    const groups = new Map<string, PermissionRecord[]>();
    permissions.forEach(permission => {
      const group = permission.group || 'Other';
      groups.set(group, [...(groups.get(group) || []), permission]);
    });
    return [...groups.entries()];
  }, [permissions]);

  const openEdit = (role: RoleRecord) => {
    setForm({ id: role.id, name: role.displayName || role.name, description: role.description || '', permissionIds: (role.permissions || []).map(permission => permission.id) });
    setModalOpen(true);
  };
  const openClone = (role: RoleRecord) => {
    setForm({ name: `${role.displayName || role.name} Copy`, description: role.description || '', permissionIds: (role.permissions || []).map(permission => permission.id), cloneFrom: role.id });
    setModalOpen(true);
  };

  const saveRole = async () => {
    setError('');
    try {
      if (form.id) {
        await adminService.updateRole(form.id, { name: form.name.trim(), displayName: form.name.trim(), description: form.description });
      } else {
        await adminService.createRole({ name: form.name.trim(), displayName: form.name.trim(), description: form.description, permissionIds: form.permissionIds });
      }
      setModalOpen(false);
      setMessage(`Role ${form.id ? 'updated' : 'created'} successfully.`);
      await load();
    } catch (caught) {
      setError(apiErrorMessage(caught, 'Role could not be saved.'));
    }
  };

  const deleteRole = async (role: RoleRecord) => {
    if (!window.confirm(`Delete ${role.displayName || role.name}?`)) return;
    try {
      await adminService.deleteRole(role.id);
      setMessage('Role deleted successfully.');
      await load();
    } catch (caught) {
      setError(apiErrorMessage(caught, 'Role could not be deleted.'));
    }
  };

  const toggleDraft = (roleId: string, permissionId: string) => {
    setDraftPermissions(previous => {
      const next = new Set(previous[roleId] || []);
      if (next.has(permissionId)) next.delete(permissionId); else next.add(permissionId);
      return { ...previous, [roleId]: next };
    });
  };
  const savePermissions = async (role: RoleRecord) => {
    setSavingRoleId(role.id);
    setError('');
    try {
      const updated = await adminService.updateRolePermissions(role.id, [...(draftPermissions[role.id] || [])]);
      setRoles(previous => previous.map(item => item.id === role.id ? updated : item));
      setMessage(`Permissions saved for ${role.displayName || role.name}.`);
    } catch (caught) {
      setError(apiErrorMessage(caught, 'Permissions could not be saved.'));
    } finally {
      setSavingRoleId('');
    }
  };

  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold text-[#1C1C1E]">Roles &amp; Permissions</h2><p className="text-[13px] text-[#6B7280]">Database-backed roles and API-enforced privileges</p></div>{canCreate && <button onClick={() => { setForm(emptyForm); setModalOpen(true); }} className="flex h-9 items-center gap-2 rounded-md bg-[#CB0017] px-4 text-[13px] font-semibold text-white"><Plus className="h-4 w-4" /> Create Custom Role</button>}</div>
    {(error || message) && <div role={error ? 'alert' : 'status'} className={`rounded-md border px-4 py-3 text-[13px] ${error ? 'border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]' : 'border-[#BBF7D0] bg-[#F0FDF4] text-[#166534]'}`}>{error || message}</div>}
    <div className="inline-flex rounded-lg border border-[#DEDEDE] bg-white p-1">{(['Roles', 'Permissions'] as const).map(tab => <button key={tab} onClick={() => setActiveTab(tab)} className={`flex h-8 items-center gap-2 rounded-md px-4 text-[12px] font-medium ${activeTab === tab ? 'bg-[#CB0017] text-white' : 'text-[#374151]'}`}>{tab === 'Roles' ? <Shield className="h-3.5 w-3.5" /> : <Settings2 className="h-3.5 w-3.5" />}{tab}</button>)}</div>
    {loading ? <div className={`${CARD} py-16`}><RefreshCw className="mx-auto h-7 w-7 animate-spin text-[#CB0017]" /></div> : activeTab === 'Roles' ? <div className={CARD}><div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left"><thead><tr className="border-b bg-[#FAFAFA]">{['Role Name', 'Description', 'Permissions', 'Type', 'Actions'].map(item => <th key={item} className={`px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-[#6B7280] ${item === 'Actions' ? 'text-right' : ''}`}>{item}</th>)}</tr></thead><tbody>{roles.map(role => <tr key={role.id} className="border-b border-[#F0F0F0]"><td className="px-5 py-3 text-[13px] font-bold">{role.displayName || role.name}</td><td className="max-w-sm px-5 py-3 text-[13px] text-[#6B7280]">{role.description || '—'}</td><td className="px-5 py-3 text-[13px]">{role.permissions?.length || 0}</td><td className="px-5 py-3"><span className="rounded bg-[#F3F4F6] px-2 py-1 text-[11px]">{role.isSystem ? 'System' : 'Custom'}</span></td><td className="px-5 py-3"><div className="flex justify-end gap-1"><button title="Clone Role" onClick={() => openClone(role)} className="rounded p-2 text-[#6B7280] hover:bg-[#EFF6FF]"><Copy className="h-4 w-4" /></button>{canUpdate && !role.isSystem && <button title="Edit Role" onClick={() => openEdit(role)} className="rounded p-2 text-[#2563EB] hover:bg-[#EFF6FF]"><Edit2 className="h-4 w-4" /></button>}{canDelete && !role.isSystem && <button title="Delete Role" onClick={() => void deleteRole(role)} className="rounded p-2 text-[#CB0017] hover:bg-[#FEF2F2]"><Trash2 className="h-4 w-4" /></button>}</div></td></tr>)}</tbody></table></div></div> : <div className="space-y-4">{roles.map(role => <div key={role.id} className={CARD}><div className="flex items-center justify-between border-b border-[#F0F0F0] px-5 py-3"><div><h3 className="text-[14px] font-bold">{role.displayName || role.name}</h3><p className="text-[11px] text-[#6B7280]">{role.isSystem ? 'System role permissions are protected.' : `${draftPermissions[role.id]?.size || 0} permissions selected`}</p></div>{canUpdate && !role.isSystem && <button onClick={() => void savePermissions(role)} disabled={savingRoleId === role.id} className="flex h-8 items-center gap-2 rounded-md bg-[#CB0017] px-3 text-[12px] font-semibold text-white disabled:opacity-50"><Save className="h-3.5 w-3.5" /> Save</button>}</div><div className="grid gap-4 p-5 lg:grid-cols-3">{permissionGroups.map(([group, items]) => <fieldset key={group} className="rounded-lg border border-[#E5E7EB] p-3"><legend className="px-1 text-[11px] font-bold uppercase tracking-wide text-[#6B7280]">{group.replaceAll('_', ' ')}</legend><div className="space-y-2">{items.map(permission => <label key={permission.id} className="flex items-start gap-2 text-[12px] text-[#374151]"><input type="checkbox" className="mt-0.5" checked={draftPermissions[role.id]?.has(permission.id) || false} disabled={role.isSystem || !canUpdate} onChange={() => toggleDraft(role.id, permission.id)} /><span><span className="block font-semibold">{permission.displayName}</span><span className="text-[10px] text-[#9CA3AF]">{permission.key}</span></span></label>)}</div></fieldset>)}</div></div>)}</div>}
    <CenterModal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={form.id ? 'Edit Role' : form.cloneFrom ? 'Clone Role' : 'Create Custom Role'}><div className="w-[520px] max-w-[90vw] space-y-4 p-6"><label className="block text-[12px] font-bold text-[#374151]">Role Name *<input className={`${FIELD} mt-1`} value={form.name} onChange={event => setForm(value => ({ ...value, name: event.target.value }))} /></label><label className="block text-[12px] font-bold text-[#374151]">Description<textarea className="mt-1 min-h-20 w-full rounded-md border border-[#DEDEDE] p-3 text-[13px]" value={form.description} onChange={event => setForm(value => ({ ...value, description: event.target.value }))} /></label>{!form.id && <div className="max-h-52 overflow-y-auto rounded-md border border-[#E5E7EB] p-3"><p className="mb-2 text-[12px] font-bold text-[#374151]">Initial permissions</p>{permissions.map(permission => <label key={permission.id} className="flex items-center gap-2 py-1 text-[12px]"><input type="checkbox" checked={form.permissionIds.includes(permission.id)} onChange={() => setForm(value => ({ ...value, permissionIds: value.permissionIds.includes(permission.id) ? value.permissionIds.filter(id => id !== permission.id) : [...value.permissionIds, permission.id] }))} />{permission.displayName} <span className="text-[#9CA3AF]">({permission.key})</span></label>)}</div>}<div className="flex justify-end gap-2 pt-2"><button onClick={() => setModalOpen(false)} className="rounded-md px-4 py-2 text-[13px] font-semibold text-[#4B5563]">Cancel</button><button disabled={!form.name.trim()} onClick={() => void saveRole()} className="rounded-md bg-[#CB0017] px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-50">Save Role</button></div></div></CenterModal>
  </div>;
};
