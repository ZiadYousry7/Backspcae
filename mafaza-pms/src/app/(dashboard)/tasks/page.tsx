'use client';

import { useState, useEffect } from 'react';
import { CheckSquare, Search, Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { TaskRow } from '@/components/dashboard/TaskRow';
import { TaskModal } from '@/components/tasks/TaskModal';
import { cn } from '@/lib/utils';
import type { Task, TaskStatus } from '@/types';

type Filter = 'all' | 'assigned' | 'created' | 'overdue';

export default function TasksPage() {
  const { profile } = useAuth();
  const { t, lang, isRTL } = useLanguage();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [filter, setFilter] = useState<Filter>('assigned');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [search, setSearch] = useState('');

  const loadTasks = async () => {
    if (!profile) return;
    setLoading(true);
    const supabase = createClient();

    let query = supabase
      .from('tasks')
      .select(`
        *,
        assignee:profiles!tasks_assigned_to_fkey(id, full_name, full_name_ar, avatar_url),
        creator:profiles!tasks_created_by_fkey(id, full_name),
        project:projects!tasks_project_id_fkey(id, title, title_ar)
      `)
      .is('parent_task_id', null)
      .order('due_date', { ascending: true, nullsFirst: false });

    if (filter === 'assigned') {
      query = query.eq('assigned_to', profile.id);
    } else if (filter === 'created') {
      query = query.eq('created_by', profile.id);
    } else if (filter === 'overdue') {
      query = query
        .lt('due_date', new Date().toISOString().split('T')[0])
        .not('status', 'in', '("completed","cancelled")');
    }

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data } = await query.limit(100);
    setTasks((data as Task[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { loadTasks(); }, [filter, statusFilter, profile?.id]);

  const filtered = tasks.filter((t) => {
    const q = search.toLowerCase();
    if (!q) return true;
    const title = lang === 'ar' && t.title_ar ? t.title_ar : t.title;
    return title.toLowerCase().includes(q);
  });

  const FILTER_TABS: { id: Filter; label: string }[] = [
    { id: 'assigned', label: t('tasks.assignedToMe') },
    { id: 'created',  label: t('tasks.createdByMe') },
    { id: 'overdue',  label: t('dashboard.overdue') },
    { id: 'all',      label: t('common.all') },
  ];

  return (
    <div className={cn('space-y-6', isRTL && 'text-right')}>
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('tasks.title')}</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {filtered.length} {lang === 'ar' ? 'مهمة' : 'tasks'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm space-y-3">
        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2">
          {FILTER_TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setFilter(id)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                filter === id ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={15} className="absolute top-1/2 -translate-y-1/2 start-3 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('common.search')}
              className="w-full ps-9 pe-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
            />
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TaskStatus | 'all')}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">{t('common.all')}</option>
            <option value="not_started">{t('status.not_started')}</option>
            <option value="in_progress">{t('status.in_progress')}</option>
            <option value="under_review">{t('status.under_review')}</option>
            <option value="completed">{t('status.completed')}</option>
            <option value="blocked">{t('status.blocked')}</option>
          </select>
        </div>
      </div>

      {/* Task list */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 animate-pulse bg-white border border-gray-100 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-2xl border border-gray-100">
          <CheckSquare size={48} className="mx-auto text-gray-200 mb-4" />
          <p className="text-gray-400 font-medium">{t('tasks.noTasks')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onClick={() => setSelectedTask(task)}
            />
          ))}
        </div>
      )}

      {selectedTask && (
        <TaskModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdated={() => { setSelectedTask(null); loadTasks(); }}
        />
      )}
    </div>
  );
}
