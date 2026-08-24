import { useState } from 'react';
import { Layout } from '../components/Layout';
import { ContextHeader } from '../components/ContextHeader';
import { Users, Shield, MapPin, Building2, Database, Activity, Bell, Settings, Lock, HardDrive, Link, UserCheck } from 'lucide-react';
import { UserManagement } from './admin/UserManagement';
import { RolesPermissions } from './admin/RolesPermissions';

const ADMIN_MODULES: Array<{ group: string; items: Array<{ id: string; label: string; icon: any; component?: any }> }> = [
  { group: 'Identity & Access', items: [
    { id: 'users', label: 'User Management', icon: Users, component: UserManagement },
    { id: 'roles', label: 'Roles & Permissions', icon: Shield, component: RolesPermissions },
  ]},
  { group: 'Organization Data', items: [
    { id: 'locations', label: 'Locations & Plants', icon: MapPin },
    { id: 'departments', label: 'Departments', icon: Building2 },
    { id: 'master_data', label: 'Master Data', icon: Database },
  ]},
  { group: 'System & Security', items: [
    { id: 'audit', label: 'Audit Log', icon: Activity },
    { id: 'notifications', label: 'Notifications & Alerts', icon: Bell },
    { id: 'settings', label: 'Organization Settings', icon: Settings },
    { id: 'security', label: 'Security Policies', icon: Lock },
    { id: 'data', label: 'Data Management', icon: HardDrive },
    { id: 'integrations', label: 'Integrations', icon: Link },
    { id: 'licenses', label: 'License Management', icon: UserCheck },
  ]}
];

export const MasterManagement = () => {
  const [activeModuleId, setActiveModuleId] = useState('users');

  let ActiveComponent = null;
  let activeModuleLabel = '';

  for (const group of ADMIN_MODULES) {
    const found = group.items.find(i => i.id === activeModuleId);
    if (found) {
      ActiveComponent = found.component;
      activeModuleLabel = found.label;
      break;
    }
  }

  return (
    <Layout>
      <ContextHeader
        title="Enterprise Administration"
        breadcrumbs={['Administration', activeModuleLabel]}
        subtitle="Manage users, system configurations, and master records"
      />

      <div className="flex h-[calc(100vh-140px)]">
        {/* Sub-Sidebar Navigation */}
        <div className="w-64 border-r border-[#E5E7EB] bg-white overflow-y-auto hide-scrollbar flex-shrink-0">
          <div className="py-4">
            {ADMIN_MODULES.map((group, idx) => (
              <div key={group.group} className={idx > 0 ? 'mt-6' : ''}>
                <div className="px-6 pb-2 text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF]">
                  {group.group}
                </div>
                <div className="space-y-0.5 px-3">
                  {group.items.map(item => {
                    const isActive = activeModuleId === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveModuleId(item.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-medium transition-colors ${
                          isActive 
                            ? 'bg-[#FEE2E2] text-[#B91C1C]' 
                            : 'text-[#4B5563] hover:bg-[#F3F4F6] hover:text-[#111827]'
                        }`}
                      >
                        <item.icon className={`w-4 h-4 ${isActive ? 'text-[#B91C1C]' : 'text-[#9CA3AF]'}`} />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#FAFAFA]">
          {ActiveComponent ? (
            <ActiveComponent />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-[#6B7280] space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#F3F4F6] flex items-center justify-center">
                <Settings className="w-8 h-8 text-[#D1D5DB]" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-[#1C1C1E]">{activeModuleLabel}</h3>
                <p className="text-[13px] mt-1">This module is scheduled for implementation in a future phase.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};
