import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@cbl/auth';
import { Activity, Bell, Building2, Database, HardDrive, Link, Lock, MapPin, Settings, Shield, UserCheck, Users } from 'lucide-react';
import { Layout } from '../components/Layout';
import { ContextHeader } from '../components/ContextHeader';
import { UserManagement } from './admin/UserManagement';
import { RolesPermissions } from './admin/RolesPermissions';
import { DepartmentsManagement, LocationsManagement } from './admin/MasterDataManagement';

type AdminItem = { id: string; label: string; icon: any; permission: string; component?: any };
const ADMIN_MODULES: Array<{ group: string; items: AdminItem[] }> = [
  { group: 'Identity & Access', items: [
    { id: 'users', label: 'User Management', icon: Users, permission: 'user:view', component: UserManagement },
    { id: 'roles', label: 'Roles & Permissions', icon: Shield, permission: 'role:view', component: RolesPermissions },
  ] },
  { group: 'Organization Data', items: [
    { id: 'locations', label: 'Locations', icon: MapPin, permission: 'location:view', component: LocationsManagement },
    { id: 'departments', label: 'Departments', icon: Building2, permission: 'department:view', component: DepartmentsManagement },
    { id: 'master_data', label: 'Master Data', icon: Database, permission: 'settings:manage' },
  ] },
  { group: 'System & Security', items: [
    { id: 'audit', label: 'Audit Log', icon: Activity, permission: 'audit:view' },
    { id: 'notifications', label: 'Notifications & Alerts', icon: Bell, permission: 'notification:manage' },
    { id: 'settings', label: 'Organization Settings', icon: Settings, permission: 'settings:manage' },
    { id: 'security', label: 'Security Policies', icon: Lock, permission: 'settings:manage' },
    { id: 'data', label: 'Data Management', icon: HardDrive, permission: 'settings:manage' },
    { id: 'integrations', label: 'Integrations', icon: Link, permission: 'settings:manage' },
    { id: 'licenses', label: 'License Management', icon: UserCheck, permission: 'settings:manage' },
  ] },
];

export const MasterManagement = () => {
  const { hasPermission } = useAuthStore();
  const [activeModuleId, setActiveModuleId] = useState('users');
  const visibleModules = useMemo(() => ADMIN_MODULES
    .map(group => ({ ...group, items: group.items.filter(item => hasPermission(item.permission)) }))
    .filter(group => group.items.length > 0), [hasPermission]);

  useEffect(() => {
    const accessible = visibleModules.some(group => group.items.some(item => item.id === activeModuleId));
    if (!accessible && visibleModules[0]?.items[0]) setActiveModuleId(visibleModules[0].items[0].id);
  }, [activeModuleId, visibleModules]);

  const activeModule = visibleModules.flatMap(group => group.items).find(item => item.id === activeModuleId);
  const ActiveComponent = activeModule?.component;
  const activeModuleLabel = activeModule?.label || '';

  return <Layout>
    <ContextHeader title="Enterprise Administration" breadcrumbs={['Administration', activeModuleLabel]} subtitle="Manage users, system configurations, and master records" />
    <div className="flex h-[calc(100vh-140px)]">
      <div className="hide-scrollbar w-64 flex-shrink-0 overflow-y-auto border-r border-[#E5E7EB] bg-white">
        <div className="py-4">{visibleModules.map((group, index) => <div key={group.group} className={index > 0 ? 'mt-6' : ''}>
          <div className="px-6 pb-2 text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF]">{group.group}</div>
          <div className="space-y-0.5 px-3">{group.items.map(item => {
            const active = activeModuleId === item.id;
            return <button key={item.id} onClick={() => setActiveModuleId(item.id)} className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium transition-colors ${active ? 'bg-[#FEE2E2] text-[#B91C1C]' : 'text-[#4B5563] hover:bg-[#F3F4F6] hover:text-[#111827]'}`}><item.icon className={`h-4 w-4 ${active ? 'text-[#B91C1C]' : 'text-[#9CA3AF]'}`} />{item.label}</button>;
          })}</div>
        </div>)}</div>
      </div>
      <div className="flex-1 overflow-y-auto bg-[#FAFAFA] p-6">{ActiveComponent ? <ActiveComponent /> : activeModuleLabel ? <div className="flex h-full flex-col items-center justify-center space-y-4 text-[#6B7280]"><div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#F3F4F6]"><Settings className="h-8 w-8 text-[#D1D5DB]" /></div><div className="text-center"><h3 className="text-lg font-bold text-[#1C1C1E]">{activeModuleLabel}</h3><p className="mt-1 text-[13px]">This module is scheduled for implementation in a future phase.</p></div></div> : <div className="rounded-lg border border-[#FECACA] bg-[#FEF2F2] p-5 text-[13px] font-semibold text-[#B91C1C]">You do not have permission to access Administration.</div>}</div>
    </div>
  </Layout>;
};
