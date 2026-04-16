'use client';

import { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, AlertTriangle, Star, MessageCircle, FolderOpen, Clock } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import type { Notification, NotificationType } from '@/types';

function NotifIcon({ type }: { type: NotificationType }) {
  const icons: Record<NotificationType, { icon: React.ElementType; color: string; bg: string }> = {
    task_assigned:         { icon: Star,          color: 'text-blue-600',   bg: 'bg-blue-100' },
    deadline_approaching:  { icon: Clock,         color: 'text-orange-600', bg: 'bg-orange-100' },
    task_overdue:          { icon: AlertTriangle, color: 'text-red-600',    bg: 'bg-red-100' },
    comment_mention:       { icon: MessageCircle, color: 'text-purple-600', bg: 'bg-purple-100' },
    task_updated:          { icon: Check,         color: 'text-green-600',  bg: 'bg-green-100' },
    project_update:        { icon: FolderOpen,    color: 'text-gray-600',   bg: 'bg-gray-100' },
  };
  const cfg = icons[type];
  const Icon = cfg.icon;
  return (
    <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', cfg.bg)}>
      <Icon size={17} className={cfg.color} />
    </div>
  );
}

export default function NotificationsPage() {
  const { profile } = useAuth();
  const { t, lang, isRTL } = useLanguage();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    const supabase = createClient();
    supabase
      .from('notifications')
      .select('*')
      .eq('recipient_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setNotifications((data as Notification[]) ?? []);
        setLoading(false);
      });
  }, [profile?.id]);

  const markAllRead = async () => {
    if (!profile) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('recipient_id', profile.id)
      .eq('is_read', false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const markRead = async (id: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className={cn('space-y-6 max-w-2xl', isRTL && 'text-right')}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell size={22} className="text-gray-700" />
          <h1 className="text-2xl font-bold text-gray-900">{t('notif.title')}</h1>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            <CheckCheck size={15} />
            {t('notif.markAllRead')}
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 animate-pulse bg-gray-50 rounded-xl" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20">
            <Bell size={48} className="mx-auto text-gray-200 mb-4" />
            <p className="text-gray-400 font-medium">{t('notif.noNotifications')}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {notifications.map((notif) => (
              <button
                key={notif.id}
                onClick={() => !notif.is_read && markRead(notif.id)}
                className={cn(
                  'w-full flex items-start gap-3 p-4 text-start hover:bg-gray-50 transition-colors',
                  !notif.is_read && 'bg-blue-50/40'
                )}
              >
                <NotifIcon type={notif.type} />
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'text-sm text-gray-800',
                    !notif.is_read && 'font-semibold'
                  )}>
                    {lang === 'ar' && notif.title_ar ? notif.title_ar : notif.title}
                  </p>
                  {(notif.message || notif.message_ar) && (
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                      {lang === 'ar' && notif.message_ar ? notif.message_ar : notif.message}
                    </p>
                  )}
                  <p className="text-[11px] text-gray-300 mt-1">
                    {new Date(notif.created_at).toLocaleString(lang === 'ar' ? 'ar' : 'en-US', {
                      year: 'numeric', month: 'short', day: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
                {!notif.is_read && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-2" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
