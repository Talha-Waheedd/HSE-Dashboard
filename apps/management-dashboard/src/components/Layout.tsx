import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth, usePermissions, useAuthStore } from '@cbl/auth';
import { useNotifications } from '../hooks/useNotifications';
import {
  LayoutDashboard, FileText, BarChart3, Settings, LogOut,
  ChevronRight, ChevronLeft, Menu, Bell, ChevronDown, X,
  UserCircle, Settings as SettingsIcon, HelpCircle,
  AlertTriangle, Target, FileWarning, CheckSquare, ClipboardList,
  Users, ExternalLink, Sun, Moon, Activity, ShieldAlert, Flame
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

// ============================================================
// Layout — SAP Fiori Shell Layout
// Dark 48px shell header + white grouped sidebar + grey workspace
// Filters moved OUT of shell to page-level FilterBar component
// ============================================================

// Nav group structure — grouped like SAP Fiori left navigation
type NavItem = {
  title: string;
  href: string;
  Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  children?: NavItem[];
};

type NavGroup = { label: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'OVERVIEW',
    items: [
      { title: 'Dashboard', href: '/dashboard', Icon: LayoutDashboard },
    ],
  },
  {
    label: 'HSE MONITORING',
    items: [
      {
        title: 'Leading Indicators', href: '/leading-lagging-indicators', Icon: Activity,
        children: [
          { title: 'Training', href: '/training-records', Icon: Users },
          { title: 'Audits', href: '/audit-management', Icon: ClipboardList },
          { title: 'Inspections', href: '/inspection-records', Icon: ClipboardList },
          { title: 'Hazard Reporting', href: '/hazard-reporting', Icon: AlertTriangle },
          { title: 'Near-Miss Reporting', href: '/near-miss', Icon: Target },
          { title: 'Hazard Closing', href: '/leading-indicators/hazard-closing', Icon: CheckSquare },
          { title: 'Incident Investigation', href: '/leading-indicators/incident-investigation', Icon: FileWarning },
          { title: 'Emergency Drills', href: '/leading-indicators/emergency-drills', Icon: ShieldAlert },
          { title: 'Action Plan Closure Tracker', href: '/leading-indicators/action-plan-closure', Icon: ClipboardList },
        ],
      },
      {
        title: 'Lagging Indicators', href: '/incident-log', Icon: FileWarning,
        children: [
          { title: 'First Aid Cases', href: '/incident-log?category=First%20Aid', Icon: Activity },
          { title: 'Medical Treatment Cases', href: '/incident-log?category=MTC', Icon: FileWarning },
          { title: 'Restricted Work Cases', href: '/incident-log?category=RWC', Icon: FileWarning },
          { title: 'Lost-Time Injuries', href: '/incident-log?category=LTI', Icon: AlertTriangle },
          { title: 'Fatalities', href: '/incident-log?category=Fatality', Icon: ShieldAlert },
          { title: 'Fire', href: '/lagging-indicators/fire', Icon: Flame },
          { title: 'LTIR', href: '/lagging-indicators/ltir', Icon: Activity },
          { title: 'TRIR', href: '/lagging-indicators/trir', Icon: BarChart3 },
        ],
      },
      { title: 'Incident Log', href: '/incident-log', Icon: FileWarning },
    ],
  },
  {
    label: 'COMPLIANCE',
    items: [
      { title: 'CAPA / Actions', href: '/action-tracker', Icon: CheckSquare },
      { title: 'Critical Audit Plan', href: '/critical-audit-plan', Icon: ClipboardList },
      { title: 'Audit Management', href: '/audit-management', Icon: ClipboardList },
      { title: 'Inspection Records', href: '/inspection-records', Icon: ClipboardList },
    ],
  },
  {
    label: 'TRAINING',
    items: [
      { title: 'Training Records', href: '/training-records', Icon: Users },
    ],
  },
  {
    label: 'REPORTING',
    items: [
      { title: 'Reports', href: '/reports', Icon: FileText },
      { title: 'Analytics', href: '/analytics', Icon: BarChart3 },
    ],
  },
];

const NOTIF_TYPE = {
  danger: { dot: '#EF4444', line: '#FEE2E2' },
  warning: { dot: '#F59E0B', line: '#FEF9C3' },
  info: { dot: '#3B82F6', line: '#DBEAFE' },
};

// Helper: resolve active state robustly
const getIsActive = (pathname: string, href: string, search = ''): boolean => {
  const [targetPath, targetQuery] = href.split('?');
  if (targetQuery) return pathname === targetPath && search === `?${targetQuery}`;
  if (targetPath === '/dashboard') return pathname === '/dashboard';
  return pathname === targetPath || pathname.startsWith(targetPath + '/');
};

const hasActiveChild = (item: NavItem, pathname: string, search: string): boolean =>
  getIsActive(pathname, item.href, search) || Boolean(item.children?.some(child => hasActiveChild(child, pathname, search)));

// Helper: get user initials
const getInitials = (name?: string): string => {
  if (!name) return 'U';
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
};

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [expandedNavItems, setExpandedNavItems] = useState<Record<string, boolean>>({});

  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { logout, user } = useAuth();
  const { hasRole } = useAuthStore();
  const { canViewReports } = usePermissions();
  const { theme, toggleTheme } = useTheme();

  const activeNavGroups: NavGroup[] = [
    ...NAV_GROUPS,
    ...(hasRole('System Administrator') ? [{
      label: 'ADMINISTRATION',
      items: [
        { title: 'Administrative Rights', href: '/master-management', Icon: Settings },
      ]
    }] : [])
  ];
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const activeParents: Record<string, boolean> = {};
    activeNavGroups.forEach(group => group.items.forEach(item => {
      if (item.children?.some(child => hasActiveChild(child, location.pathname, location.search))) {
        activeParents[item.href] = true;
      }
    }));
    setExpandedNavItems(previous => ({ ...previous, ...activeParents }));
  }, [location.pathname, location.search]);

  const toggleNavItem = (href: string) => {
    setExpandedNavItems(previous => ({ ...previous, [href]: !previous[href] }));
  };

  const renderNavItem = (item: NavItem, depth = 0): React.ReactNode => {
    if (item.href === '/reports' && !canViewReports()) return null;
    const hasChildren = Boolean(item.children?.length);
    const isActive = getIsActive(location.pathname, item.href, location.search);
    const isBranchActive = hasActiveChild(item, location.pathname, location.search);
    const isExpanded = expandedNavItems[item.href] ?? isBranchActive;
    const baseClass = `relative flex items-center gap-3 rounded-md text-[13px] font-medium transition-all duration-150 ${collapsed ? 'justify-center px-2 py-2.5' : depth > 0 ? 'px-3 py-1.5 ml-3' : 'px-3 py-2'}`;
    const baseStyle = {
      color: isActive || (hasChildren && isBranchActive) ? '#FFFFFF' : 'var(--sidebar-text, rgba(255,255,255,0.85))',
      backgroundColor: isActive ? 'var(--sidebar-active-bg, rgba(255,255,255,0.15))' : 'transparent',
    };

    return (
      <React.Fragment key={item.href}>
        {hasChildren ? (
          <button
            type="button"
            onClick={() => toggleNavItem(item.href)}
            className={`${baseClass} w-full`}
            style={baseStyle}
            title={collapsed ? item.title : undefined}
          >
            <item.Icon className="shrink-0" style={{ width: 16, height: 16, color: isBranchActive ? '#FFFFFF' : 'rgba(255,255,255,0.65)' }} />
            {!collapsed && <span className="flex-1 truncate text-left leading-snug pb-[1px]">{item.title}</span>}
            {!collapsed && <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />}
          </button>
        ) : (
          <NavLink
            to={item.href}
            onClick={() => setMobileMenuOpen(false)}
            className={baseClass}
            style={baseStyle}
            title={collapsed ? item.title : undefined}
          >
            <item.Icon className="shrink-0" style={{ width: 16, height: 16, color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.65)' }} />
            {!collapsed && <span className="truncate leading-snug pb-[1px]">{item.title}</span>}
          </NavLink>
        )}
        {hasChildren && isExpanded && !collapsed && <div className="mt-0.5 space-y-0.5">{item.children?.map(child => renderNavItem(child, depth + 1))}</div>}
      </React.Fragment>
    );
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const sidebarWidth = collapsed ? 48 : 240;
  const initials = getInitials(user?.name);

  // Close all overlays when clicking outside
  const closeOverlays = () => {
    setShowNotifications(false);
    setUserMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--workspace-bg, #F5F0DC)' }} onClick={closeOverlays}>

      {/* ================================================================
          SHELL HEADER — 48px dark bar (SAP Fiori standard)
          ================================================================ */}
      <header
        className="fixed top-0 left-0 right-0 z-50 h-12 flex items-center border-b"
        style={{ backgroundColor: '#FFFFFF', borderColor: '#E8E0C8' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Logo + App Identity — in sidebar header zone */}
        <div
          className="flex items-center h-full border-r px-4 shrink-0 overflow-hidden"
          style={{ width: sidebarWidth, transition: 'width 0.2s ease', borderColor: '#E8E0C8', backgroundColor: 'var(--sidebar-bg, #7B1010)' }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src="/logo.svg"
              alt="CBL"
              className="h-10 w-auto shrink-0"
            />
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-white text-[12px] font-bold leading-[1.2] tracking-wide uppercase whitespace-normal break-words">
                  HSE Management
                </p>
              </div>
            )}
          </div>
        </div>

        {/* App title — center */}
        <div className="flex-1 px-6 hidden md:flex items-center overflow-hidden">
          <span className="text-[15px] font-bold text-[#2C1810] tracking-tight">
            HSE Management System
          </span>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden px-3 text-white/70 hover:text-white"
          onClick={e => { e.stopPropagation(); setMobileMenuOpen(!mobileMenuOpen); }}
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Right: Notifications + User */}
        <div className="flex items-center gap-1 pr-3 shrink-0" onClick={e => e.stopPropagation()}>

          {/* ---- Dark Mode Toggle ---- */}
          <button
            onClick={toggleTheme}
            className="relative flex items-center justify-center w-8 h-8 rounded text-[#6B7280] hover:text-[#2C1810] hover:bg-[#EDE8D8] transition-colors"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
          </button>

          {/* ---- Notification Bell ---- */}
          <div className="relative">
            <button
              onClick={() => { setShowNotifications(!showNotifications); setUserMenuOpen(false); }}
              className="relative flex items-center justify-center w-8 h-8 rounded text-[#6B7280] hover:text-[#2C1810] hover:bg-[#EDE8D8] transition-colors"
            >
              <Bell className="h-[18px] w-[18px]" />
              {unreadCount > 0 && (
                <span
                  className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full border-2"
                  style={{ backgroundColor: '#7B1010', borderColor: '#FFFFFF' }}
                />
              )}
            </button>

            {showNotifications && (
              <div className="fixed inset-0 z-[999] flex justify-end">
                {/* Backdrop */}
                <div
                  className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
                  onClick={() => setShowNotifications(false)}
                />

                {/* Panel */}
                <div
                  className="relative w-[320px] max-w-[90vw] h-full bg-white flex flex-col shadow-2xl"
                  style={{ animation: 'slideInRight 0.2s ease-out forwards' }}
                >
                  <div className="flex items-center justify-between px-5 py-4 border-b border-[#F0F0F0] bg-[#FAFAFA]">
                    <h3 className="text-[14px] font-bold text-[#1A1818]">
                      Notifications {unreadCount > 0 && <span className="text-[#CB0017] ml-1">{unreadCount}</span>}
                    </h3>
                    <div className="flex items-center gap-3">
                      {unreadCount > 0 && (
                        <button
                          className="text-[12px] text-[#CB0017] font-medium hover:underline"
                          onClick={markAllAsRead}
                        >
                          Mark all read
                        </button>
                      )}
                      <button
                        onClick={() => setShowNotifications(false)}
                        className="w-7 h-7 flex items-center justify-center rounded-md text-[#9CA3AF] hover:text-[#1A1818] hover:bg-[#E5E7EB] transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center px-4 text-[#9CA3AF] text-[13px]">
                        No new notifications
                      </div>
                    ) : (
                      notifications.map(n => {
                        const cfg = NOTIF_TYPE[n.type as keyof typeof NOTIF_TYPE] || NOTIF_TYPE.info;
                        return (
                          <div
                            key={n.id}
                            className={`flex gap-3 px-5 py-4 border-b border-[#F7F7F7] hover:bg-[#F9FAFB] cursor-pointer transition-colors ${n.read ? 'opacity-60' : ''}`}
                            onClick={() => {
                              markAsRead(n.id);
                              if (n.link) navigate(n.link);
                              setShowNotifications(false);
                            }}
                          >
                            <span
                              className="mt-1.5 rounded-full shrink-0"
                              style={{ width: 8, height: 8, backgroundColor: cfg.dot, marginTop: 6 }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-medium text-[#1A1818] leading-snug">{n.title}</p>
                              <p className="text-[11px] text-[#6B7280] mt-1 line-clamp-2">{n.message}</p>
                              <p className="text-[10px] text-[#9CA3AF] mt-1.5">{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                            <ExternalLink className="h-3 w-3 text-[#D0D0D0] mt-1 shrink-0" />
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="p-4 border-t border-[#F0F0F0] bg-[#FAFAFA]">
                    <button className="w-full h-9 flex items-center justify-center text-[13px] font-medium text-[#374151] border border-[#E0E0E0] rounded-md hover:bg-[#F5F5F5] transition-colors">
                      View All Notifications
                    </button>
                  </div>
                </div>

                <style>{`
                  @keyframes slideInRight {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                  }
                `}</style>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="h-5 w-px bg-[#D5CCAC] mx-1" />

          {/* ---- User Menu ---- */}
          <div className="relative">
            <button
              onClick={() => { setUserMenuOpen(!userMenuOpen); setShowNotifications(false); }}
              className="flex items-center gap-2 h-8 pl-2 pr-3 rounded-full border border-[#D5CCAC] bg-white/60 hover:bg-white transition-colors"
            >
              {/* Avatar */}
              <div
                className="h-6 w-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                style={{ backgroundColor: '#7B1010' }}
              >
                {initials}
              </div>
              <div className="hidden sm:block text-left leading-none">
                <p className="text-[#2C1810] text-[12px] font-semibold">
                  {user?.name?.split(' ')[0] ?? 'User'}
                </p>
              </div>
              <ChevronDown className="h-3 w-3 text-[#9CA3AF]" />
            </button>

            {userMenuOpen && (
              <div
                className="absolute top-full right-0 mt-2 w-52 bg-white rounded-lg overflow-hidden"
                style={{ border: '1px solid #E0E0E0', boxShadow: '0 8px 32px 0 rgba(0,0,0,0.14)', zIndex: 999 }}
              >
                {/* User info */}
                <div className="px-4 py-3 border-b border-[#F0F0F0] bg-[#FAFAFA]">
                  <p className="text-[13px] font-semibold text-[#1A1818]">{user?.name ?? 'User'}</p>
                  <p className="text-[11px] text-[#6B7280] truncate">{user?.email ?? ''}</p>
                  <span
                    className="mt-1.5 inline-block text-[10px] font-semibold px-2 py-0.5 rounded"
                    style={{ backgroundColor: 'rgba(123,16,16,0.08)', color: '#7B1010', border: '1px solid rgba(123,16,16,0.2)' }}
                  >
                    {user?.role ?? 'Staff'}
                  </span>
                </div>
                {/* Menu items */}
                <div className="py-1">
                  {[
                    { icon: UserCircle, label: 'My Profile', action: () => { navigate('/settings'); setUserMenuOpen(false); } },
                    { icon: SettingsIcon, label: 'Settings', action: () => { navigate('/settings'); setUserMenuOpen(false); } },
                    { icon: HelpCircle, label: 'Help & Support', action: () => setUserMenuOpen(false) },
                  ].map(({ icon: Icon, label, action }) => (
                    <button
                      key={label}
                      onClick={action}
                      className="flex w-full items-center gap-2.5 px-4 py-2 text-[13px] text-[#374151] hover:bg-[#F5F5F5] transition-colors"
                    >
                      <Icon className="h-4 w-4 text-[#9CA3AF]" />
                      {label}
                    </button>
                  ))}
                </div>
                <div className="py-1 border-t border-[#F0F0F0]">
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 px-4 py-2 text-[13px] font-medium hover:bg-[#FEF2F2] transition-colors"
                    style={{ color: '#7B1010' }}
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ================================================================
          BODY — Sidebar + Main
          ================================================================ */}
      <div className="flex flex-1 pt-12">

        {/* Sidebar spacer (prevents content jump) */}
        <div
          className="hidden md:block shrink-0 transition-all duration-200"
          style={{ width: sidebarWidth }}
        />

        {/* ---- LEFT SIDEBAR — Maroon (#7B1010) matching Stitch design ---- */}
        <aside
          className={`
            fixed left-0 top-12 bottom-0 flex flex-col z-40
            transition-all duration-200 ease-in-out
            ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          `}
          style={{ width: sidebarWidth, backgroundColor: 'var(--sidebar-bg, #7B1010)' }}
        >
          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-3 hide-scrollbar">
            {activeNavGroups.map((group, gi) => (
              <div key={group.label}>
                {/* Group label */}
                {!collapsed && (
                  <span
                    className="block px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest select-none"
                    style={{ color: 'var(--sidebar-group-label, rgba(255,255,255,0.35))' }}
                  >
                    {group.label}
                  </span>
                )}
                {/* Group items */}
                <div className="space-y-0.5 px-2">
                  {group.items.map(item => renderNavItem(item))}
                </div>

                {/* Subtle divider — not between last group */}
                {!collapsed && gi < activeNavGroups.length - 2 && (
                  <div className="mx-4 mt-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }} />
                )}
              </div>
            ))}
          </nav>

          {/* Sidebar footer — Settings + Support pinned at bottom */}
          <div className="pb-4 px-2 space-y-0.5" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '12px' }}>
            {[{ title: 'Settings', href: '/settings', Icon: Settings }, { title: 'Support', href: '/support', Icon: HelpCircle }].map(item => {
              const isActive = getIsActive(location.pathname, item.href);
              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-md text-[13px] font-medium transition-all duration-150 ${collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2'
                    }`}
                  style={{
                    color: isActive ? '#FFFFFF' : 'var(--sidebar-text, rgba(255,255,255,0.85))',
                    backgroundColor: isActive ? 'var(--sidebar-active-bg)' : 'transparent',
                  }}
                  onMouseEnter={e => {
                    if (!isActive)
                      (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--sidebar-hover-bg, rgba(255,255,255,0.08))';
                  }}
                  onMouseLeave={e => {
                    if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                  }}
                  title={collapsed ? item.title : undefined}
                >
                  <item.Icon style={{ width: 16, height: 16, color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.65)', flexShrink: 0 }} />
                  {!collapsed && <span className="truncate leading-snug pb-[1px]">{item.title}</span>}
                </NavLink>
              );
            })}

            {/* Collapse toggle */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="flex w-full items-center justify-center h-8 rounded-md transition-colors mt-1"
              style={{ color: 'rgba(255,255,255,0.45)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.06)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
              title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {collapsed
                ? <ChevronRight className="h-4 w-4" />
                : <ChevronLeft className="h-4 w-4" />
              }
            </button>
          </div>
        </aside>

        {/* Mobile overlay */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/30 z-30 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* ---- MAIN CONTENT AREA ---- warm linen workspace */}
        <main className="flex-1 overflow-y-auto min-h-[calc(100vh-48px)]" style={{ backgroundColor: 'var(--workspace-bg, #F5F0DC)' }}>
          {children}
        </main>

      </div>
    </div>
  );
};
