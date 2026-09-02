import { useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { ContextHeader } from '../components/ContextHeader';
import { useAuth, useAuthStore } from '@cbl/auth';
import { useTheme } from '../context/ThemeContext';
import {
  Bell,
  ChevronRight,
  Database,
  LayoutGrid,
  Mail,
  MonitorSmartphone,
  Moon,
  ShieldCheck,
  Sun,
  User,
  UserRoundCog,
} from 'lucide-react';
import { departmentLabel, useDepartments } from '../hooks/useDepartments';

const initials = (name?: string) =>
  (name || 'User')
    .split(' ')
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

const Toggle = ({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={onChange}
    className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#CB0017]/25 ${checked ? 'bg-[#1B7C1B]' : 'bg-[#D1D5DB]'}`}
  >
    <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
  </button>
);

const SectionTitle = ({ icon, title, description }: { icon: ReactNode; title: string; description: string }) => (
  <div className="flex items-start gap-3 border-b border-[#F0F0F0] pb-4">
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FFF4F4] text-[#CB0017]">
      {icon}
    </div>
    <div>
      <h2 className="text-[15px] font-bold text-[#2C1810]">{title}</h2>
      <p className="mt-0.5 text-[12px] leading-5 text-[#8A8F98]">{description}</p>
    </div>
  </div>
);

export const Settings = () => {
  const { departments } = useDepartments();
  const { user } = useAuth();
  const { hasRole } = useAuthStore();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [emailAlerts, setEmailAlerts] = useState(true);
  const [overdueAlerts, setOverdueAlerts] = useState(true);
  const [density, setDensity] = useState('comfortable');
  const isAdmin = hasRole('System Administrator') || hasRole('Administrator') || ['super_admin', 'Super Admin'].includes(user?.role || '');
  const role = user?.role || 'Viewer';

  return (
    <Layout>
      <ContextHeader
        title="Settings"
        breadcrumbs={['Settings']}
        subtitle="Manage your workspace preferences and account context."
      />

      <main className="min-h-full bg-[#F7F7F5] px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-5">
          {/* Profile summary */}
          <section className="relative overflow-hidden rounded-xl border border-[#E8E0D2] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
            <div className="h-2 bg-[#7B1010]" />
            <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#7B1010] text-xl font-bold text-white shadow-sm">
                  {initials(user?.name)}
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9CA3AF]">Signed-in profile</p>
                  <h1 className="mt-1 text-xl font-bold tracking-tight text-[#2C1810]">{user?.name || 'UI Preview User'}</h1>
                  <p className="mt-1 text-[13px] text-[#6B7280]">{user?.email || 'preview@cbl-lu-sukkur.local'}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#A7F3D0] bg-[#ECFDF5] px-3 py-1.5 text-[11px] font-semibold text-[#065F46]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#10B981]" /> Active account
                </span>
                <span className="rounded-full border border-[#E8E0C8] bg-[#FFFDF5] px-3 py-1.5 text-[11px] font-semibold text-[#7B1010]">
                  {role}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 border-t border-[#F0F0F0] sm:grid-cols-3">
              <div className="border-b border-[#F0F0F0] px-5 py-3 sm:border-b-0 sm:border-r sm:px-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9CA3AF]">Department scope</p>
                <p className="mt-1 text-[13px] font-semibold text-[#374151]">{user?.department_id || 'All departments'}</p>
              </div>
              <div className="border-b border-[#F0F0F0] px-5 py-3 sm:border-b-0 sm:border-r sm:px-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9CA3AF]">Plant access</p>
                <p className="mt-1 text-[13px] font-semibold text-[#374151]">{user?.plant_id || 'CBL LU Sukkur'}</p>
              </div>
              <div className="px-5 py-3 sm:px-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9CA3AF]">Access level</p>
                <p className="mt-1 text-[13px] font-semibold text-[#374151]">{isAdmin ? 'Full system access' : 'Assigned modules'}</p>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.85fr)]">
            <div className="space-y-5">
              {/* Display preferences */}
              <section className="rounded-xl border border-[#E8E0D2] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)] sm:p-6">
                <SectionTitle
                  icon={<MonitorSmartphone className="h-4 w-4" />}
                  title="Display preferences"
                  description="Tune the dashboard appearance for your day-to-day workflow."
                />
                <div className="divide-y divide-[#F0F0F0]">
                  <div className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[13px] font-semibold text-[#374151]">Color theme</p>
                      <p className="mt-1 text-[12px] text-[#8A8F98]">Use a light or dark workspace theme.</p>
                    </div>
                    <div className="flex rounded-lg border border-[#E5E7EB] bg-[#F8F8F7] p-1">
                      <button type="button" onClick={() => theme === 'dark' && toggleTheme()} className={`inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-[12px] font-semibold transition-colors ${theme === 'light' ? 'bg-white text-[#7B1010] shadow-sm' : 'text-[#6B7280]'}`}>
                        <Sun className="h-3.5 w-3.5" /> Light
                      </button>
                      <button type="button" onClick={() => theme === 'light' && toggleTheme()} className={`inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-[12px] font-semibold transition-colors ${theme === 'dark' ? 'bg-[#2C1810] text-white shadow-sm' : 'text-[#6B7280]'}`}>
                        <Moon className="h-3.5 w-3.5" /> Dark
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[13px] font-semibold text-[#374151]">Table density</p>
                      <p className="mt-1 text-[12px] text-[#8A8F98]">Control the amount of information visible in tables.</p>
                    </div>
                    <div className="flex rounded-lg border border-[#E5E7EB] bg-[#F8F8F7] p-1">
                      {['compact', 'comfortable', 'spacious'].map(option => (
                        <button key={option} type="button" onClick={() => setDensity(option)} className={`rounded-md px-2.5 py-2 text-[11px] font-semibold capitalize transition-colors ${density === option ? 'bg-white text-[#7B1010] shadow-sm' : 'text-[#6B7280]'}`}>
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* Notification preferences */}
              <section className="rounded-xl border border-[#E8E0D2] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)] sm:p-6">
                <SectionTitle
                  icon={<Bell className="h-4 w-4" />}
                  title="Notification preferences"
                  description="Choose which operational updates should reach your inbox."
                />
                <div className="divide-y divide-[#F0F0F0]">
                  <div className="flex items-center justify-between gap-4 py-5">
                    <div className="flex min-w-0 items-start gap-3">
                      <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[#9CA3AF]" />
                      <div>
                        <p className="text-[13px] font-semibold text-[#374151]">Weekly digest emails</p>
                        <p className="mt-1 text-[12px] leading-5 text-[#8A8F98]">Receive a summary of KPI changes every Monday.</p>
                      </div>
                    </div>
                    <Toggle checked={emailAlerts} onChange={() => setEmailAlerts(value => !value)} label="Toggle weekly digest emails" />
                  </div>
                  <div className="flex items-center justify-between gap-4 py-5">
                    <div className="flex min-w-0 items-start gap-3">
                      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#9CA3AF]" />
                      <div>
                        <p className="text-[13px] font-semibold text-[#374151]">Overdue hazard alerts</p>
                        <p className="mt-1 text-[12px] leading-5 text-[#8A8F98]">Get notified when a high-priority hazard passes its target date.</p>
                      </div>
                    </div>
                    <Toggle checked={overdueAlerts} onChange={() => setOverdueAlerts(value => !value)} label="Toggle overdue hazard alerts" />
                  </div>
                </div>
              </section>
            </div>

            <div className="space-y-5">
              {/* Account card */}
              <section className="rounded-xl border border-[#E8E0D2] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)] sm:p-6">
                <SectionTitle
                  icon={<User className="h-4 w-4" />}
                  title="Account information"
                  description="Your identity and role are managed by the system administrator."
                />
                <div className="mt-5 space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[12px] text-[#8A8F98]">Name</span>
                    <span className="text-right text-[12px] font-semibold text-[#374151]">{user?.name || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[12px] text-[#8A8F98]">Email</span>
                    <span className="max-w-[190px] truncate text-right text-[12px] font-semibold text-[#374151]">{user?.email || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[12px] text-[#8A8F98]">System role</span>
                    <span className="rounded-md bg-[#FFF4F4] px-2 py-1 text-[11px] font-semibold text-[#7B1010]">{role}</span>
                  </div>
                </div>
                <div className="mt-5 rounded-lg border border-[#E8E0C8] bg-[#FFFDF5] p-3">
                  <div className="flex items-start gap-2">
                    <UserRoundCog className="mt-0.5 h-4 w-4 shrink-0 text-[#A16207]" />
                    <p className="text-[11px] leading-5 text-[#785B18]">Need a change to your role or access scope? Contact the HSE system administrator.</p>
                  </div>
                </div>
              </section>

              {/* Admin shortcut */}
              {isAdmin && (
                <section className="rounded-xl border border-[#E8E0D2] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)] sm:p-6">
                  <SectionTitle
                    icon={<Database className="h-4 w-4" />}
                    title="Master data"
                    description="Manage lookup values shared across HSE modules."
                  />
                  <div className="mt-5 rounded-lg border border-[#F0F0F0] bg-[#FBFBFA] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[13px] font-semibold text-[#374151]">Departments</p>
                        <p className="mt-1 text-[12px] text-[#8A8F98]">{departments.length} active departments</p>
                      </div>
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white text-[#7B1010] shadow-sm">
                        <LayoutGrid className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {departments.slice(0, 6).map(department => (
                        <span key={department.id} className="rounded border border-[#E5E7EB] bg-white px-2 py-1 text-[10px] font-medium text-[#6B7280]">{departmentLabel(department)}</span>
                      ))}
                      <span className="rounded border border-[#E5E7EB] bg-white px-2 py-1 text-[10px] font-medium text-[#9CA3AF]">+{Math.max(departments.length - 6, 0)} more</span>
                    </div>
                  </div>
                  <button type="button" onClick={() => navigate('/master-management')} className="mt-4 inline-flex w-full items-center justify-between rounded-lg border border-[#E8E0C8] bg-white px-3 py-2.5 text-[12px] font-semibold text-[#7B1010] transition-colors hover:bg-[#FFFDF5]">
                    Open master data management
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </section>
              )}
            </div>
          </div>
          <p className="pb-4 text-center text-[11px] text-[#A0A4AA]">Preferences are saved for this workspace session.</p>
        </div>
      </main>
    </Layout>
  );
};
