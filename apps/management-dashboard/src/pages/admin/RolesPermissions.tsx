import React, { useState } from 'react';
import { Plus, Copy, Trash2, Edit2, Shield, Settings2 } from 'lucide-react';
import { CenterModal } from '../../components/CenterModal';

const CARD = 'bg-white border border-[#E0E0E0] rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.06)]';
const FIELD_BASE = 'w-full h-9 px-3 text-[13px] border border-[#DEDEDE] rounded-md bg-white text-[#1A1818] focus:outline-none focus:border-[#CB0017] focus:ring-2 focus:ring-[#CB0017]/15';

const PERMISSIONS_LIST = [
  { id: 'p1', group: 'Hazard Reporting', label: 'Create Hazard Report' },
  { id: 'p2', group: 'Hazard Reporting', label: 'View All Hazard Reports' },
  { id: 'p3', group: 'Hazard Reporting', label: 'Close Hazard Reports' },
  { id: 'p4', group: 'User Management', label: 'View Users' },
  { id: 'p5', group: 'User Management', label: 'Manage Roles' },
  { id: 'p6', group: 'System', label: 'Access Settings' },
  { id: 'p7', group: 'System', label: 'Export Data' },
];

const INITIAL_ROLES = [
  { id: 'r1', name: 'System Administrator', description: 'Full access to all system modules and settings', isCustom: false },
  { id: 'r2', name: 'HSE Manager', description: 'Manage all HSE records and run analytics', isCustom: false },
  { id: 'r3', name: 'HSE Officer', description: 'Log and monitor HSE records', isCustom: false },
  { id: 'r4', name: 'Department Manager', description: 'View and action records for their department', isCustom: false },
  { id: 'r5', name: 'Viewer', description: 'Read-only access to specific dashboards', isCustom: false },
];

export const RolesPermissions = () => {
  const [activeTab, setActiveTab] = useState<'Roles' | 'Permissions'>('Roles');
  const [roles, setRoles] = useState(INITIAL_ROLES);
  const [matrix, setMatrix] = useState<Record<string, Record<string, boolean>>>({
    r1: { p1: true, p2: true, p3: true, p4: true, p5: true, p6: true, p7: true },
    r2: { p1: true, p2: true, p3: true, p4: true, p5: false, p6: false, p7: true },
    r5: { p1: false, p2: false, p3: false, p4: false, p5: false, p6: false, p7: false }
  });

  const [showRoleModal, setShowRoleModal] = useState(false);
  const [formData, setFormData] = useState<any>({});

  const togglePermission = (roleId: string, permId: string) => {
    setMatrix(prev => ({
      ...prev,
      [roleId]: {
        ...(prev[roleId] || {}),
        [permId]: !(prev[roleId]?.[permId])
      }
    }));
  };

  const handleSaveRole = () => {
    if (formData.id) {
      setRoles(roles.map(r => r.id === formData.id ? { ...r, ...formData } : r));
    } else {
      const newId = String(Date.now());
      setRoles([...roles, { id: newId, name: formData.name, description: formData.description, isCustom: true }]);
      if (formData.cloneFrom) {
        setMatrix({ ...matrix, [newId]: { ...(matrix[formData.cloneFrom] || {}) } });
      }
    }
    setShowRoleModal(false);
  };

  const handleDeleteRole = (id: string) => {
    setRoles(roles.filter(r => r.id !== id));
    const nextMatrix = { ...matrix };
    delete nextMatrix[id];
    setMatrix(nextMatrix);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-[#1C1C1E]">Roles & Permissions</h2>
          <p className="text-[13px] text-[#6B7280]">Define roles and manage access privileges across the application</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setFormData({}); setShowRoleModal(true); }} className="flex items-center gap-2 h-9 px-4 text-[13px] font-semibold text-white bg-[#CB0017] rounded-md hover:bg-[#A30012] transition-colors">
            <Plus className="w-4 h-4" /> Create Custom Role
          </button>
        </div>
      </div>

      <div className="inline-flex rounded-lg border border-[#DEDEDE] bg-white p-1">
        {(['Roles', 'Permissions'] as const).map(item => (
          <button
            key={item}
            onClick={() => setActiveTab(item)}
            className={h-8 px-4 text-[12px] font-medium rounded-md transition-colors }
          >
            <div className="flex items-center gap-2">
              {item === 'Roles' && <Shield className="w-3.5 h-3.5" />}
              {item === 'Permissions' && <Settings2 className="w-3.5 h-3.5" />}
              {item}
            </div>
          </button>
        ))}
      </div>

      <div className={${CARD} overflow-hidden}>
        {activeTab === 'Roles' ? (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#F0F0F0] bg-[#FAFAFA]">
                <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">Role Name</th>
                <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">Description</th>
                <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">Type</th>
                <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-[#6B7280] text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {roles.map(role => (
                <tr key={role.id} className="border-b border-[#F0F0F0] hover:bg-[#FAFAFA]">
                  <td className="px-5 py-4 text-[13px] font-bold text-[#1C1C1E]">{role.name}</td>
                  <td className="px-5 py-4 text-[13px] text-[#6B7280]">{role.description}</td>
                  <td className="px-5 py-4">
                    <span className={inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium }>
                      {role.isCustom ? 'Custom' : 'System Default'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button title="Clone Role" onClick={() => { setFormData({ name: role.name + ' (Copy)', cloneFrom: role.id }); setShowRoleModal(true); }} className="p-1.5 text-[#6B7280] hover:text-[#2563EB] hover:bg-[#EFF6FF] rounded transition-colors">
                        <Copy className="w-4 h-4" />
                      </button>
                      <button title="Edit Role" onClick={() => { setFormData(role); setShowRoleModal(true); }} className="p-1.5 text-[#6B7280] hover:text-[#2563EB] hover:bg-[#EFF6FF] rounded transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {role.isCustom && (
                        <button title="Delete Role" onClick={() => handleDeleteRole(role.id)} className="p-1.5 text-[#6B7280] hover:text-[#CB0017] hover:bg-[#FEE2E2] rounded transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-[#F0F0F0] bg-[#FAFAFA]">
                  <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-[#6B7280] sticky left-0 bg-[#FAFAFA] z-10 shadow-[1px_0_0_#F0F0F0]">Permission / Module</th>
                  {roles.map(role => (
                    <th key={role.id} className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-[#6B7280] text-center whitespace-nowrap">
                      {role.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from(new Set(PERMISSIONS_LIST.map(p => p.group))).map(group => (
                  <React.Fragment key={group}>
                    <tr className="bg-[#F8FAFC] border-b border-[#F0F0F0]">
                      <td colSpan={roles.length + 1} className="px-5 py-2 text-[11px] font-bold text-[#475569] uppercase sticky left-0">{group}</td>
                    </tr>
                    {PERMISSIONS_LIST.filter(p => p.group === group).map(perm => (
                      <tr key={perm.id} className="border-b border-[#F0F0F0] hover:bg-[#FAFAFA]">
                        <td className="px-5 py-3 text-[13px] text-[#1C1C1E] font-medium sticky left-0 bg-white shadow-[1px_0_0_#F0F0F0]">{perm.label}</td>
                        {roles.map(role => {
                          const isGranted = matrix[role.id]?.[perm.id] ?? false;
                          const isSystemAdmin = role.id === 'r1';
                          return (
                            <td key={role.id} className="px-5 py-3 text-center">
                              <button 
                                onClick={() => !isSystemAdmin && togglePermission(role.id, perm.id)}
                                disabled={isSystemAdmin}
                                className={elative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none  }
                              >
                                <span className={pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out } />
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CenterModal
        isOpen={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        title={formData.id ? 'Edit Role' : (formData.cloneFrom ? 'Clone Role' : 'Create Custom Role')}
      >
        <div className="p-6 space-y-4 w-[400px]">
          <div>
            <label className="block text-[12px] font-bold text-[#374151] mb-1">Role Name *</label>
            <input type="text" className={FIELD_BASE} placeholder="e.g. Regional HSE Officer" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-[12px] font-bold text-[#374151] mb-1">Description</label>
            <textarea className={${FIELD_BASE} min-h-[80px] py-2} placeholder="Briefly describe the role's purpose..." value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} />
          </div>
          {formData.cloneFrom && (
            <div className="bg-[#F0F9FF] border border-[#BAE6FD] p-3 rounded text-[12px] text-[#0369A1]">
              <strong>Note:</strong> This new role will inherit all permissions from the source role. You can customize them in the Permissions matrix after creation.
            </div>
          )}
          <div className="pt-4 flex justify-end gap-3">
            <button onClick={() => setShowRoleModal(false)} className="px-4 py-2 text-[13px] font-medium text-[#374151] hover:bg-[#F5F5F5] rounded-md transition-colors">Cancel</button>
            <button onClick={handleSaveRole} disabled={!formData.name} className="px-4 py-2 text-[13px] font-medium text-white bg-[#CB0017] hover:bg-[#A30012] rounded-md transition-colors disabled:opacity-50">Save Role</button>
          </div>
        </div>
      </CenterModal>
    </div>
  );
};

