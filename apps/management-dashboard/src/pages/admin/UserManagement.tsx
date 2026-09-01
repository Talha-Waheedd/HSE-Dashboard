import { useEffect, useRef, useState } from 'react';
import { Plus, Upload, Trash2, Edit2, Play, Users } from 'lucide-react';
import { CenterModal } from '../../components/CenterModal';
import { DEPARTMENTS } from '../../config/constants';

const CARD = 'bg-white border border-[#E0E0E0] rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.06)]';
const FIELD_BASE = 'w-full h-9 px-3 text-[13px] border border-[#DEDEDE] rounded-md bg-white text-[#1A1818] focus:outline-none focus:border-[#CB0017] focus:ring-2 focus:ring-[#CB0017]/15';

const MOCK_USERS = [
  { id: '1', name: 'Super Admin', email: 'superadmin@cblapp.com', department: 'IT', role: 'System Administrator', status: 'Active', lastLogin: '2026-08-21 14:30' },
  { id: '2', name: 'John Doe', email: 'john@cblapp.com', department: 'HSE', role: 'HSE Manager', status: 'Active', lastLogin: '2026-08-21 09:15' },
  { id: '3', name: 'Jane Smith', email: 'jane@cblapp.com', department: 'PRD', role: 'Plant Manager', status: 'Inactive', lastLogin: '2026-08-15 16:45' },
  { id: '4', name: 'Ali Khan', email: 'ali@cblapp.com', department: 'QC/FS/NPD', role: 'Data Entry Operator', status: 'Suspended', lastLogin: '2026-08-01 11:20' },
];

export const UserManagement = () => {
  const [users, setUsers] = useState(MOCK_USERS);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const selectAllRef = useRef<HTMLInputElement>(null);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [formData, setFormData] = useState<any>({});

  const userIds = users.map(user => String(user.id));
  const selectedUserCount = userIds.filter(id => selectedUsers.has(id)).length;
  const allUsersSelected = userIds.length > 0 && selectedUserCount === userIds.length;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = selectedUserCount > 0 && !allUsersSelected;
    }
  }, [selectedUserCount, allUsersSelected]);

  const toggleSelectAll = () => {
    setSelectedUsers(allUsersSelected ? new Set() : new Set(userIds));
  };

  const toggleSelect = (id: string) => {
    setSelectedUsers(previous => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAdd = () => {
    if (formData.id) {
      setUsers(users.map(u => u.id === formData.id ? { ...u, ...formData } : u));
    } else {
      setUsers([...users, {
        id: String(Date.now()),
        name: formData.name,
        email: formData.email,
        department: formData.department || '',
        role: formData.role || 'Viewer',
        status: formData.status || 'Active',
        lastLogin: 'Never'
      }]);
    }
    setShowAddModal(false);
    setFormData({});
  };

  const handleDelete = (id: string) => {
    setUsers(users.filter(u => u.id !== id));
    setSelectedUsers(previous => {
      const next = new Set(previous);
      next.delete(id);
      return next;
    });
  };

  const bulkDeactivate = () => {
    setUsers(users.map(u => selectedUsers.has(u.id) ? { ...u, status: 'Inactive' } : u));
    setSelectedUsers(new Set());
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-[#1C1C1E]">User Management</h2>
          <p className="text-[13px] text-[#6B7280]">Manage user accounts, roles, and access status</p>
        </div>
        <div className="flex gap-2">
          {selectedUsers.size > 0 && (
            <button onClick={bulkDeactivate} className="h-9 px-4 text-[13px] font-semibold text-[#B91C1C] bg-[#FEE2E2] rounded-md hover:bg-[#FECACA] transition-colors">
              Deactivate Selected ({selectedUsers.size})
            </button>
          )}
          <button onClick={() => setShowImportModal(true)} className="flex items-center gap-2 h-9 px-4 text-[13px] font-semibold text-[#374151] bg-white border border-[#DEDEDE] rounded-md hover:bg-[#F9FAFB] transition-colors">
            <Upload className="w-4 h-4" /> Import CSV
          </button>
          <button onClick={() => { setFormData({}); setShowAddModal(true); }} className="flex items-center gap-2 h-9 px-4 text-[13px] font-semibold text-white bg-[#CB0017] rounded-md hover:bg-[#A30012] transition-colors">
            <Plus className="w-4 h-4" /> Add User
          </button>
        </div>
      </div>

      <div className={`${CARD} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-[#F0F0F0] bg-[#FAFAFA]">
                <th className="w-12 px-5 py-4 text-center">
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    className="rounded border-gray-300 text-[#CB0017] focus:ring-[#CB0017]"
                    checked={allUsersSelected}
                    onChange={toggleSelectAll}
                    aria-label="Select all users"
                  />
                </th>
                <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">User</th>
                <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">Department</th>
                <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">Role</th>
                <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">Status</th>
                <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">Last Login</th>
                <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-[#6B7280] text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="border-b border-[#F0F0F0] hover:bg-[#FAFAFA]">
                  <td className="px-5 py-4 text-center">
                    <input type="checkbox" className="rounded border-gray-300 text-[#CB0017] focus:ring-[#CB0017]" checked={selectedUsers.has(String(user.id))} onChange={() => toggleSelect(String(user.id))} />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#CB0017]/10 flex items-center justify-center text-[#CB0017] font-bold text-[11px] shrink-0">
                        {user.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                      </div>
                      <div>
                        <div className="text-[13px] font-bold text-[#1C1C1E]">{user.name}</div>
                        <div className="text-[12px] text-[#6B7280]">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-[13px] font-medium text-[#1C1C1E]">{user.department}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                      user.role === 'System Administrator' ? 'bg-[#FEE2E2] text-[#B91C1C]' : 'bg-[#F3F4F6] text-[#4B5563]'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                      user.status === 'Active' ? 'bg-[#ECFDF5] text-[#059669]' : 
                      user.status === 'Suspended' ? 'bg-[#FEF2F2] text-[#DC2626]' :
                      'bg-[#F3F4F6] text-[#6B7280]'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-[13px] text-[#6B7280]">{user.lastLogin}</td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button title="Impersonate User" className="p-1.5 text-[#6B7280] hover:text-[#CB0017] hover:bg-[#FEE2E2] rounded transition-colors">
                        <Play className="w-4 h-4" />
                      </button>
                      <button title="Edit User" onClick={() => { setFormData(user); setShowAddModal(true); }} className="p-1.5 text-[#6B7280] hover:text-[#2563EB] hover:bg-[#EFF6FF] rounded transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button title="Delete User" onClick={() => handleDelete(user.id)} className="p-1.5 text-[#6B7280] hover:text-[#CB0017] hover:bg-[#FEE2E2] rounded transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-[13px] text-[#6B7280]">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="w-8 h-8 text-[#D1D5DB]" />
                      <p>No users found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit User Modal */}
      <CenterModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={formData.id ? 'Edit User' : 'Add New User'}
      >
        <div className="p-6 space-y-4 w-[450px]">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-[12px] font-bold text-[#374151] mb-1">Full Name *</label>
              <input type="text" className={FIELD_BASE} placeholder="e.g. Alice Smith" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="col-span-2">
              <label className="block text-[12px] font-bold text-[#374151] mb-1">Email Address *</label>
              <input type="email" className={FIELD_BASE} placeholder="e.g. alice@cblapp.com" value={formData.email || ''} onChange={e => setFormData({ ...formData, email: e.target.value })} />
            </div>
            <div>
              <label className="block text-[12px] font-bold text-[#374151] mb-1">Department</label>
              <select className={FIELD_BASE} value={formData.department || ''} onChange={e => setFormData({ ...formData, department: e.target.value })}>
                <option value="">Select department...</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-bold text-[#374151] mb-1">Role</label>
              <select className={FIELD_BASE} value={formData.role || ''} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                <option value="System Administrator">System Administrator</option>
                <option value="HSE Manager">HSE Manager</option>
                <option value="HSE Officer">HSE Officer</option>
                <option value="Department Manager">Department Manager</option>
                <option value="Data Entry Operator">Data Entry Operator</option>
                <option value="Viewer">Viewer</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-[12px] font-bold text-[#374151] mb-1">Status</label>
              <select className={FIELD_BASE} value={formData.status || 'Active'} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-[13px] font-medium text-[#374151] hover:bg-[#F5F5F5] rounded-md transition-colors">Cancel</button>
            <button onClick={handleAdd} disabled={!formData.name || !formData.email} className="px-4 py-2 text-[13px] font-medium text-white bg-[#CB0017] hover:bg-[#A30012] rounded-md transition-colors disabled:opacity-50">Save User</button>
          </div>
        </div>
      </CenterModal>

      {/* CSV Import Modal */}
      <CenterModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Import Users via CSV"
      >
        <div className="p-6 space-y-4 w-[500px]">
          <div className="border-2 border-dashed border-[#DEDEDE] rounded-lg p-8 flex flex-col items-center justify-center text-center bg-[#FAFAFA]">
            <Upload className="w-8 h-8 text-[#9CA3AF] mb-3" />
            <p className="text-[13px] font-semibold text-[#1C1C1E]">Click to upload or drag and drop</p>
            <p className="text-[12px] text-[#6B7280] mt-1">CSV files only. Max 5MB.</p>
          </div>
          <div className="bg-[#F0F9FF] border border-[#BAE6FD] rounded-md p-3 text-[12px] text-[#0369A1]">
            <p className="font-semibold mb-1">Required CSV format:</p>
            <code className="bg-white px-2 py-0.5 rounded text-[11px] font-mono">name, email, department, role</code>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button onClick={() => setShowImportModal(false)} className="px-4 py-2 text-[13px] font-medium text-[#374151] hover:bg-[#F5F5F5] rounded-md transition-colors">Cancel</button>
            <button onClick={() => setShowImportModal(false)} className="px-4 py-2 text-[13px] font-medium text-white bg-[#CB0017] hover:bg-[#A30012] rounded-md transition-colors">Upload File</button>
          </div>
        </div>
      </CenterModal>
    </div>
  );
};
