import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import { ContextHeader } from '../components/ContextHeader';
import { Plus, Users, Building2, Shield, Trash2, Check, X } from 'lucide-react';
import { DEPARTMENTS } from '../config/constants';
import { CenterModal } from '../components/CenterModal';

const CARD = 'bg-white border border-[#E0E0E0] rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.06)]';
const FIELD_BASE = 'w-full h-9 px-3 text-[13px] border border-[#DEDEDE] rounded-md bg-white text-[#1A1818] focus:outline-none focus:border-[#CB0017] focus:ring-2 focus:ring-[#CB0017]/15';

// Mock Data for visual demonstration until backend is ready
const INITIAL_DEPARTMENTS = [...DEPARTMENTS].map((name, i) => ({ id: String(i + 1), name, status: 'Active' }));
const INITIAL_USERS = [
  { id: '1', name: 'Super Admin', email: 'superadmin@cblapp.com', role: 'Administrator' },
  { id: '2', name: 'John Doe', email: 'john@cblapp.com', role: 'Plant Manager' },
  { id: '3', name: 'Jane Smith', email: 'jane@cblapp.com', role: 'HSE Officer' },
];

export const MasterManagement = () => {
  const [activeTab, setActiveTab] = useState<'Departments' | 'Permissions'>('Departments');
  
  const [departments, setDepartments] = useState(INITIAL_DEPARTMENTS);
  const [users, setUsers] = useState(INITIAL_USERS);

  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState<any>({});

  const handleAdd = () => {
    if (activeTab === 'Departments') {
      setDepartments([...departments, { id: String(Date.now()), name: formData.name, status: 'Active' }]);
    } else {
      setUsers([...users, { id: String(Date.now()), name: formData.name, email: formData.email, role: formData.role || 'Employee' }]);
    }
    setShowAddModal(false);
    setFormData({});
  };

  return (
    <Layout>
      <ContextHeader
        title="Master Management"
        breadcrumbs={['Master Management', activeTab]}
        subtitle="Manage master data and enterprise permissions"
        actions={[
          { label: `Add ${activeTab === 'Permissions' ? 'User' : activeTab.slice(0, -1)}`, icon: <Plus />, onClick: () => { setFormData({}); setShowAddModal(true); }, variant: 'primary' }
        ]}
      >
        <div className="inline-flex rounded-lg border border-[#DEDEDE] bg-white p-1">
          {(['Departments', 'Permissions'] as const).map(item => (
            <button
              key={item}
              onClick={() => setActiveTab(item)}
              className={`h-8 px-4 text-[12px] font-medium rounded-md transition-colors ${
                activeTab === item ? 'bg-[#CB0017] text-white' : 'text-[#374151] hover:bg-[#F5F5F5]'
              }`}
            >
              <div className="flex items-center gap-2">
                {item === 'Departments' && <Building2 className="w-3.5 h-3.5" />}
                {item === 'Permissions' && <Shield className="w-3.5 h-3.5" />}
                {item}
              </div>
            </button>
          ))}
        </div>
      </ContextHeader>

      <div className="p-6">
        <div className={`${CARD} overflow-hidden`}>
          {activeTab === 'Departments' && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#F0F0F0] bg-[#FAFAFA]">
                  <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">Department Name</th>
                  <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">Status</th>
                  <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-[#6B7280] text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {departments.map(dept => (
                  <tr key={dept.id} className="border-b border-[#F0F0F0] hover:bg-[#FAFAFA]">
                    <td className="px-5 py-4 text-[13px] font-medium text-[#1C1C1E]">{dept.name}</td>
                    <td className="px-5 py-4"><span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#ECFDF5] text-[#059669]">Active</span></td>
                    <td className="px-5 py-4 text-right">
                      <button onClick={() => setDepartments(departments.filter(d => d.id !== dept.id))} className="text-[#9CA3AF] hover:text-[#CB0017]"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}


          {activeTab === 'Permissions' && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#F0F0F0] bg-[#FAFAFA]">
                  <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">User</th>
                  <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">Email</th>
                  <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">Current Role</th>
                  <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">Change Role</th>
                  <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-[#6B7280] text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="border-b border-[#F0F0F0] hover:bg-[#FAFAFA]">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#CB0017]/10 flex items-center justify-center text-[#CB0017] font-bold text-[11px]">
                          {user.name.split(' ').map((n: string) => n[0]).join('')}
                        </div>
                        <span className="text-[13px] font-bold text-[#1C1C1E]">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-[13px] text-[#6B7280]">{user.email}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                        user.role === 'Administrator' ? 'bg-[#FEE2E2] text-[#B91C1C]' : 'bg-[#F3F4F6] text-[#4B5563]'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <select className="h-8 px-2 text-[12px] border border-[#DEDEDE] rounded bg-white text-[#1A1818] outline-none" defaultValue={user.role}
                        onChange={(e) => setUsers(users.map(u => u.id === user.id ? { ...u, role: e.target.value } : u))}>
                        <option value="Administrator">Administrator</option>
                        <option value="Plant Manager">Plant Manager</option>
                        <option value="HSE Officer">HSE Officer</option>
                        <option value="Employee">Employee</option>
                      </select>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button onClick={() => setUsers(users.filter(u => u.id !== user.id))} className="text-[#9CA3AF] hover:text-[#CB0017]"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <CenterModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={`Add ${activeTab === 'Permissions' ? 'User' : activeTab.slice(0, -1)}`}
      >
        <div className="p-6 space-y-4 w-[400px]">
          {activeTab === 'Departments' && (
            <div>
              <label className="block text-[12px] font-bold text-[#374151] mb-1">Department Name</label>
              <input
                type="text"
                className={FIELD_BASE}
                placeholder="e.g. Quality Control"
                value={formData.name || ''}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
          )}


          {activeTab === 'Permissions' && (
            <>
              <div>
                <label className="block text-[12px] font-bold text-[#374151] mb-1">Full Name</label>
                <input
                  type="text"
                  className={FIELD_BASE}
                  placeholder="e.g. Alice Smith"
                  value={formData.name || ''}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[12px] font-bold text-[#374151] mb-1">Email</label>
                <input
                  type="email"
                  className={FIELD_BASE}
                  placeholder="e.g. alice@cblapp.com"
                  value={formData.email || ''}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[12px] font-bold text-[#374151] mb-1">Role</label>
                <select
                  className={FIELD_BASE}
                  value={formData.role || 'Employee'}
                  onChange={e => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="Administrator">Administrator</option>
                  <option value="Plant Manager">Plant Manager</option>
                  <option value="HSE Officer">HSE Officer</option>
                  <option value="Employee">Employee</option>
                </select>
              </div>
            </>
          )}

          <div className="pt-4 flex justify-end gap-3">
            <button
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 text-[13px] font-medium text-[#374151] hover:bg-[#F5F5F5] rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={!formData.name}
              className="px-4 py-2 text-[13px] font-medium text-white bg-[#CB0017] hover:bg-[#A30012] rounded-md transition-colors disabled:opacity-50"
            >
              Save
            </button>
          </div>
        </div>
      </CenterModal>
    </Layout>
  );
};

