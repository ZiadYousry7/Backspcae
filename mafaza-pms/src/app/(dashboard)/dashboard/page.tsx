'use client';

import { useState, useEffect } from 'react';
import {
  CheckSquare, Clock, AlertTriangle, TrendingUp,
  Calendar, Flame, Star, ArrowRight, Plus
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { KPICard } from '@/components/dashboard/KPICard';
import { TaskRow } from '@/components/dashboard/TaskRow';
import { ProjectCard } from '@/components/dashboard/ProjectCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { cn } from '@/lib/utils';
import type { Task, Project, KpiSnapshot } from '@/types';
import {
  RadialBarChart, RadialBar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';

// ---- KPI Score Gauge ----
function KPIGauge({ score }: { score: number }) {
  const { t } = useLanguage();
  const color = score >= 80 ? '#10B981' : score >= 60 ? '#3B82F6' : score >= 40 ? '#F59E0B' : '#EF4444';
  const label = score >= 80 ? t('kpi.excellent') : score >= 60 ? t('kpi.good') : score >= 40 ? t('kpi.needsImprovement') : t('kpi.poor');

  const data = [{ name: 'score', value: score, fill: color }];

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-48 h-48">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="70%"
            outerRadius="90%"
            startAngle={180}
            endAngle={-180}
            data={data}
          >
            <RadialBar dataKey="value" cornerRadius={8} background={{ fill: '#f1f5f9' }} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold" style={{ color }}>{score}</span>
          <span className="text-xs text-gray-400 font-medium">{t('kpi.score')}</span>
        </div>
      </div>
      <span
        className="mt-1 text-xs font-semibold px-3 py-1 rounded-full"
        style={{ background: `${color}20`, color }}
      >
        {label}
      </span>
    </div>
  );
}

// ---- Weekly activity bar chart ----
function WeeklyActivity({ data }: { data: { day: string; completed: number; total: number }[] }) {
  const { isRTL } = useLanguage();
  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={isRTL ? [...data].reverse() : data} barGap={2}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
        <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <YAxis hide />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,.08)' }}
          cursor={{ fill: '#f8fafc' }}
        />
        <Bar dataKey="total" fill="#e2e8f0" radius={[4, 4, 0, 0]} name="Total" />
        <Bar dataKey="completed" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Completed" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default function DashboardPage() {
  const { profile } = useAuth();
  const { t, lang, isRTL } = useLanguage();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [kpi, setKpi] = useState<KpiSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;

    const supabase = createClient();

    async function loadData() {
      setLoading(true);

      // Fetch my tasks (assigned to me)
      const [{ data: taskData }, { data: projectData }, { data: kpiData }] = await Promise.all([
        supabase
          .from('tasks')
          .select(`
            *,
            assignee:profiles!tasks_assigned_to_fkey(id, full_name, full_name_ar, avatar_url),
            project:projects(id, title, title_ar)
          `)
          .eq('assigned_to', profile!.id)
          .neq('status', 'cancelled')
          .order('due_date', { ascending: true })
          .limit(10),

        supabase
          .from('projects')
          .select(`
            *,
            members:project_members(user_id, can_edit, user:profiles(id, full_name, avatar_url))
          `)
          .neq('status', 'cancelled')
          .eq('is_archived', false)
          .order('due_date', { ascending: true })
          .limit(6),

        supabase
          .from('kpi_snapshots')
          .select('*')
          .eq('user_id', profile!.id)
          .order('snapshot_date', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      setTasks((taskData as Task[]) ?? []);
      setProjects((projectData as Project[]) ?? []);
      setKpi(kpiData as KpiSnapshot | null);
      setLoading(false);
    }

    loadData();
  }, [profile?.id]);

  // Derive summary stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length;
  const overdueTasks = tasks.filter(
    (t) => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed'
  ).length;

  // Upcoming deadlines (next 7 days, not completed)
  const upcomingTasks = tasks.filter((task) => {
    if (!task.due_date || task.status === 'completed') return false;
    const due = new Date(task.due_date);
    const now = new Date();
    const diff = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7;
  });

  // Mock weekly activity (real data would come from kpi_snapshots)
  const weekDays = lang === 'ar'
    ? ['أحد', 'اثن', 'ثلث', 'أرب', 'خمس', 'جمع', 'سبت']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weeklyData = weekDays.map((day) => ({
    day,
    total: Math.floor(Math.random() * 8) + 2,
    completed: Math.floor(Math.random() * 6) + 1,
  }));

  return (
    <div className={cn('space-y-8', isRTL && 'text-right')}>
      {/* Page title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('dashboard.title')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {lang === 'ar' ? 'نظرة عامة على مهامك ومشاريعك' : 'Your tasks and projects at a glance'}
          </p>
        </div>
        <Link
          href="/tasks"
          className="hidden sm:flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={16} />
          {t('tasks.newTask')}
        </Link>
      </div>

      {/* KPI stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title={t('dashboard.totalTasks')}
          value={totalTasks}
          icon={<CheckSquare size={20} />}
          color="blue"
          loading={loading}
        />
        <KPICard
          title={t('dashboard.completed')}
          value={completedTasks}
          icon={<Star size={20} />}
          color="green"
          trend={kpi ? Math.round(kpi.completion_rate - 60) : undefined}
          loading={loading}
        />
        <KPICard
          title={t('dashboard.inProgress')}
          value={inProgressTasks}
          icon={<Clock size={20} />}
          color="yellow"
          loading={loading}
        />
        <KPICard
          title={t('dashboard.overdue')}
          value={overdueTasks}
          icon={<AlertTriangle size={20} />}
          color={overdueTasks > 0 ? 'red' : 'green'}
          loading={loading}
        />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Left col: KPI + activity */}
        <div className="xl:col-span-1 space-y-6">

          {/* KPI Score card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800">{t('kpi.title')}</h2>
              <TrendingUp size={18} className="text-blue-500" />
            </div>
            {loading ? (
              <div className="h-48 animate-pulse bg-gray-50 rounded-xl" />
            ) : (
              <KPIGauge score={kpi?.score ?? 0} />
            )}
            <div className="mt-4 space-y-3">
              <ProgressBar
                value={kpi?.completion_rate ?? 0}
                label={t('kpi.completion')}
                showLabel
                height="sm"
                color="green"
              />
              <ProgressBar
                value={kpi?.on_time_rate ?? 0}
                label={t('kpi.onTime')}
                showLabel
                height="sm"
                color="blue"
              />
            </div>
          </div>

          {/* Weekly activity */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h2 className="font-semibold text-gray-800 mb-4">
              {lang === 'ar' ? 'نشاط الأسبوع' : 'Weekly Activity'}
            </h2>
            <WeeklyActivity data={weeklyData} />
          </div>
        </div>

        {/* Right col: My tasks */}
        <div className="xl:col-span-2 space-y-6">

          {/* Upcoming deadlines */}
          {upcomingTasks.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Flame size={18} className="text-amber-600" />
                <h2 className="font-semibold text-amber-800">{t('dashboard.upcoming')}</h2>
                <span className="ms-auto text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-medium">
                  {upcomingTasks.length}
                </span>
              </div>
              <div className="space-y-2">
                {upcomingTasks.slice(0, 3).map((task) => (
                  <TaskRow key={task.id} task={task} compact />
                ))}
              </div>
            </div>
          )}

          {/* All my tasks */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800">{t('dashboard.myTasks')}</h2>
              <Link
                href="/tasks"
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {lang === 'ar' ? 'عرض الكل' : 'View all'}
                <ArrowRight size={14} className={isRTL ? 'rotate-180' : ''} />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-14 animate-pulse bg-gray-50 rounded-xl" />
                ))}
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-12">
                <CheckSquare size={40} className="mx-auto text-gray-200 mb-3" />
                <p className="text-gray-400 text-sm">{t('dashboard.allCaughtUp')}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {tasks.slice(0, 8).map((task) => (
                  <TaskRow key={task.id} task={task} />
                ))}
              </div>
            )}
          </div>

          {/* Recent projects */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800">{t('nav.projects')}</h2>
              <Link
                href="/projects"
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {lang === 'ar' ? 'عرض الكل' : 'View all'}
                <ArrowRight size={14} className={isRTL ? 'rotate-180' : ''} />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {loading
                ? [1, 2].map((i) => (
                    <div key={i} className="h-44 animate-pulse bg-white border border-gray-100 rounded-2xl" />
                  ))
                : projects.slice(0, 4).map((project) => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
