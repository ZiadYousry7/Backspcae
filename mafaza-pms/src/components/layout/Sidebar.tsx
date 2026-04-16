'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderOpen,
  CheckSquare,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar } from '@/components/ui/Avatar';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { t, isRTL } = useLanguage();
  const { profile, logout } = useAuth();

  const isAdmin = profile?.role === 'super_admin';
  const isManager = profile?.role === 'department_manager' || isAdmin;

  const navItems = [
    {
      href: '/dashboard',
      icon: LayoutDashboard,
      label: t('nav.dashboard'),
      always: true,
    },
    {
      href: '/projects',
      icon: FolderOpen,
      label: t('nav.projects'),
      always: true,
    },
    {
      href: '/tasks',
      icon: CheckSquare,
      label: t('nav.tasks'),
      always: true,
    },
    {
      href: '/executive',
      icon: BarChart3,
      label: t('nav.executive'),
      adminOnly: true,
    },
  ].filter((item) => !item.adminOnly || isAdmin);

  const bottomItems = [
    { href: '/notifications', icon: Bell, label: t('nav.notifications') },
    { href: '/settings', icon: Settings, label: t('nav.settings') },
  ];

  const chevronIcon =
    isRTL
      ? (collapsed ? ChevronLeft : ChevronRight)
      : (collapsed ? ChevronRight : ChevronLeft);
  const ChevronIcon = chevronIcon;

  return (
    <aside
      className={cn(
        'fixed top-0 bottom-0 z-40 flex flex-col bg-[#0F1729] text-white transition-all duration-300',
        collapsed ? 'w-16' : 'w-64',
        isRTL ? 'right-0' : 'left-0'
      )}
    >
      {/* Logo area */}
      <div className="flex items-center h-16 px-4 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shrink-0">
            <Building2 size={16} className="text-white" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-white font-bold text-base leading-tight truncate">Mafaza</p>
              <p className="text-blue-300 text-[10px] leading-tight truncate">Project Management</p>
            </div>
          )}
        </div>

        <button
          onClick={onToggle}
          className={cn(
            'p-1 rounded-md text-white/40 hover:text-white hover:bg-white/10 transition-colors',
            collapsed ? 'mx-auto' : 'ms-auto'
          )}
          aria-label="Toggle sidebar"
        >
          <ChevronIcon size={16} />
        </button>
      </div>

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <ul className="space-y-1">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                    active
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : 'text-white/60 hover:text-white hover:bg-white/10',
                    collapsed && 'justify-center px-2'
                  )}
                  title={collapsed ? label : undefined}
                >
                  <Icon size={18} className="shrink-0" />
                  {!collapsed && <span className="truncate">{label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>

        {!collapsed && (
          <div className="mt-6 mb-2 px-3">
            <p className="text-[10px] text-white/30 uppercase tracking-widest font-semibold">
              {t('nav.settings')}
            </p>
          </div>
        )}

        <ul className="space-y-1">
          {bottomItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href;
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                    active
                      ? 'bg-blue-600 text-white'
                      : 'text-white/60 hover:text-white hover:bg-white/10',
                    collapsed && 'justify-center px-2'
                  )}
                  title={collapsed ? label : undefined}
                >
                  <Icon size={18} className="shrink-0" />
                  {!collapsed && <span className="truncate">{label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User profile strip */}
      <div className="border-t border-white/10 p-3 shrink-0">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <Avatar profile={profile} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {profile?.full_name ?? 'Loading...'}
              </p>
              <p className="text-[11px] text-white/40 truncate">
                {profile?.job_title ?? profile?.role ?? ''}
              </p>
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-md text-white/40 hover:text-red-400 hover:bg-red-400/10 transition-colors"
              title={t('nav.logout')}
            >
              <LogOut size={15} />
            </button>
          </div>
        ) : (
          <button
            onClick={logout}
            className="flex justify-center w-full p-1.5 rounded-md text-white/40 hover:text-red-400 hover:bg-red-400/10 transition-colors"
            title={t('nav.logout')}
          >
            <LogOut size={15} />
          </button>
        )}
      </div>
    </aside>
  );
}
