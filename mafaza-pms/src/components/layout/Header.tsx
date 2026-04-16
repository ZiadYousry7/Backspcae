'use client';

import { useState } from 'react';
import { Bell, Search, Globe } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar } from '@/components/ui/Avatar';

interface HeaderProps {
  sidebarCollapsed: boolean;
}

export function Header({ sidebarCollapsed }: HeaderProps) {
  const { t, lang, toggleLang, isRTL } = useLanguage();
  const { profile } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);

  // Greeting based on time of day
  const hour = new Date().getHours();
  const greeting =
    lang === 'ar'
      ? hour < 12 ? 'صباح الخير' : hour < 17 ? 'مساء الخير' : 'مساء الخير'
      : hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-30 h-16 bg-white border-b border-gray-100',
        'flex items-center gap-4 px-4 md:px-6 transition-all duration-300',
        isRTL
          ? (sidebarCollapsed ? 'left-16' : 'left-64')
          : (sidebarCollapsed ? 'left-16' : 'left-64')
      )}
      style={{
        [isRTL ? 'right' : 'left']: sidebarCollapsed ? '4rem' : '16rem',
        [isRTL ? 'left' : 'right']: 0,
      }}
    >
      {/* Greeting */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-500 hidden md:block">
          {greeting}, <span className="font-semibold text-gray-800">{profile?.full_name?.split(' ')[0] ?? ''}</span> 👋
        </p>
      </div>

      <div className="flex items-center gap-2">
        {/* Search */}
        {searchOpen ? (
          <div className="relative">
            <Search size={15} className="absolute top-1/2 -translate-y-1/2 start-3 text-gray-400" />
            <input
              autoFocus
              type="text"
              placeholder={t('common.search')}
              onBlur={() => setSearchOpen(false)}
              className="w-52 ps-8 pe-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        ) : (
          <button
            onClick={() => setSearchOpen(true)}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
            aria-label="Search"
          >
            <Search size={18} />
          </button>
        )}

        {/* Language toggle */}
        <button
          onClick={toggleLang}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-blue-600 border border-gray-200 transition-colors"
          aria-label="Toggle language"
        >
          <Globe size={15} />
          <span>{lang === 'en' ? 'العربية' : 'English'}</span>
        </button>

        {/* Notifications */}
        <Link
          href="/notifications"
          className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
          aria-label={t('nav.notifications')}
        >
          <Bell size={18} />
          {/* Unread dot – will be driven by real data later */}
          <span className="absolute top-1.5 end-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </Link>

        {/* User avatar */}
        <Link href="/settings" className="flex items-center gap-2 group">
          <Avatar profile={profile} size="sm" />
          <div className="hidden lg:block text-start">
            <p className="text-sm font-medium text-gray-800 leading-tight group-hover:text-blue-600 transition-colors">
              {profile?.full_name ?? 'Loading...'}
            </p>
            <p className="text-[11px] text-gray-400 leading-tight">
              {profile?.role === 'super_admin'
                ? t('role.super_admin')
                : profile?.role === 'department_manager'
                ? t('role.department_manager')
                : t('role.employee')}
            </p>
          </div>
        </Link>
      </div>
    </header>
  );
}
