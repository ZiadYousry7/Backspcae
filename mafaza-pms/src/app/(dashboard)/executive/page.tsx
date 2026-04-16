'use client';

import { useState, useEffect } from 'react';
import {
  AlertOctagon, BarChart3, TrendingUp, Clock, CheckCircle2,
  XCircle, Building2, Users, FolderOpen, AlertTriangle, RefreshCw
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { KPICard } from '@/components/dashboard/KPICard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { PriorityBadge, DepartmentBadge, StatusBadge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { cn, DEPARTMENT_CONFIG, formatRelativeDate } from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer, Cell, RadarChart, PolarGrid,
  PolarAngleAxis, Radar,
} from 'recharts';
import type { BottleneckTask, DepartmentKpiSummary } from '@/types';
import { redirect } from 'next/navigation';

const DEPT_CHART_COLORS: Record<string, string> = {
  marketing: '#8B5CF6',
  sales: '#10B981',
  r_and_d: '#F59E0B',
  production: '#EF4444',
  accounts: '#3B82F6',
  procurement: '#EC4899',
};

function DepartmentOverviewCard({ dept }: { dept: DepartmentKpiSummary }) {
  const { lang } = useLanguage();
  const cfg = DEPARTMENT_CONFIG[dept.department as keyof typeof DEPARTMENT_CONFIG];
  const label = lang === 'ar' ? cfg?.labelAr ?? dept.department : cfg?.label ?? dept.department;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ background: DEPT_CHART_COLORS[dept.department] ?? '#94a3b8' }}
          />
          <span className="font-semibold text-gray-800">{label}</span>
        </div>
        <span className="text-2xl font-bold text-gray-900">
          {Math.round(dept.completion_rate)}%
        </span>
      </div>

      <ProgressBar value={dept.completion_rate} height="sm" color="auto" className="mb-4" />

      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { label: lang === 'ar' ? 'مكتمل' : 'Done', value: dept.completed_tasks, color: 'text-green-600' },
          { label: lang === 'ar' ? 'جاري' : 'Active', value: dept.in_progress_tasks, color: 'text-blue-600' },
          { label: lang === 'ar' ? 'متأخر' : 'Late', value: dept.overdue_tasks, color: 'text-red-500' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-gray-50 rounded-lg py-2">
            <p className={cn('text-lg font-bold', color)}>{value}</p>
            <p className="text-[11px] text-gray-400">{label}</p>
          </div>
        ))}
      </div>

      {dept.blocked_tasks > 0 && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-red-600 font-medium bg-red-50 rounded-lg px-3 py-2">
          <AlertOctagon size={13} />
          {dept.blocked_tasks} {lang === 'ar' ? 'مهام محظورة' : 'blocked tasks'}
        </div>
      )}
    </div>
  );
}

function BottleneckCard({ task }: { task: BottleneckTask }) {
  const { lang } = useLanguage();
  const title = lang === 'ar' && task.title_ar ? task.title_ar : task.title;
  const isBlocked = task.status === 'blocked';

  return (
    <div className={cn(
      'flex items-start gap-3 p-4 rounded-xl border',
      isBlocked ? 'border-red-200 bg-red-50' : 'border-orange-200 bg-orange-50'
    )}>
      <div className={cn('mt-0.5', isBlocked ? 'text-red-500' : 'text-orange-500')}>
        {isBlocked ? <XCircle size={18} /> : <Clock size={18} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <p className="text-sm font-medium text-gray-800 line-clamp-1">{title}</p>
          {task.days_overdue != null && task.days_overdue > 0 && (
            <span className="shrink-0 text-xs font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
              +{task.days_overdue}d
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1.5 mb-2">
          <StatusBadge status={task.status as never} lang={lang} />
          <PriorityBadge priority={task.priority as never} lang={lang} />
          <DepartmentBadge dept={task.department as never} lang={lang} />
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="truncate">📁 {lang === 'ar' && task.project_title_ar ? task.project_title_ar : task.project_title}</span>
          {task.assignee_name && (
            <span className="shrink-0 flex items-center gap-1">
              <Users size={11} />
              {task.assignee_name}
            </span>
          )}
        </div>
        {task.blocker_reason && (
          <p className="mt-1.5 text-xs text-red-600 italic">{task.blocker_reason}</p>
        )}
      </div>
    </div>
  );
}

export default function ExecutiveDashboardPage() {
  const { profile } = useAuth();
  const { t, lang, isRTL } = useLanguage();
  const [bottlenecks, setBottlenecks] = useState<BottleneckTask[]>([]);
  const [deptKpis, setDeptKpis] = useState<DepartmentKpiSummary[]>([]);
  const [totalProjects, setTotalProjects] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  // Redirect non-admins
  if (profile && profile.role !== 'super_admin') {
    redirect('/dashboard');
  }

  const loadData = async () => {
    setLoading(true);
    const supabase = createClient();

    const [{ data: bottleneckData }, { data: deptData }, { data: projectCount }, { data: userCount }] =
      await Promise.all([
        supabase
          .from('bottleneck_tasks')
          .select('*')
          .limit(20),
        supabase
          .from('department_kpi_summary')
          .select('*'),
        supabase.from('projects').select('id', { count: 'exact', head: true }).neq('status', 'cancelled'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_active', true),
      ]);

    setBottlenecks((bottleneckData as BottleneckTask[]) ?? []);
    setDeptKpis((deptData as DepartmentKpiSummary[]) ?? []);
    setTotalProjects(projectCount?.length ?? 0);
    setTotalUsers(userCount?.length ?? 0);
    setLastRefreshed(new Date());
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  // Derived stats
  const totalTasks = deptKpis.reduce((s, d) => s + d.total_tasks, 0);
  const completedTasks = deptKpis.reduce((s, d) => s + d.completed_tasks, 0);
  const overdueTasks = deptKpis.reduce((s, d) => s + d.overdue_tasks, 0);
  const blockedTasks = deptKpis.reduce((s, d) => s + d.blocked_tasks, 0);
  const avgCompletion = deptKpis.length
    ? deptKpis.reduce((s, d) => s + d.completion_rate, 0) / deptKpis.length
    : 0;

  // Bar chart data
  const barChartData = deptKpis.map((d) => {
    const cfg = DEPARTMENT_CONFIG[d.department as keyof typeof DEPARTMENT_CONFIG];
    return {
      name: lang === 'ar' ? cfg?.labelAr ?? d.department : cfg?.label ?? d.department,
      completed: d.completed_tasks,
      overdue: d.overdue_tasks,
      inProgress: d.in_progress_tasks,
      rate: Math.round(d.completion_rate),
    };
  });

  // Radar chart data
  const radarData = deptKpis.map((d) => {
    const cfg = DEPARTMENT_CONFIG[d.department as keyof typeof DEPARTMENT_CONFIG];
    return {
      dept: lang === 'ar' ? cfg?.labelAr ?? d.department : cfg?.label ?? d.department,
      rate: Math.round(d.completion_rate),
    };
  });

  return (
    <div className={cn('space-y-8', isRTL && 'text-right')}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 size={22} className="text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">{t('executive.title')}</h1>
          </div>
          <p className="text-sm text-gray-400">
            {lang === 'ar' ? 'آخر تحديث: ' : 'Last refreshed: '}
            {formatRelativeDate(lastRefreshed.toISOString(), lang)}
          </p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          {lang === 'ar' ? 'تحديث' : 'Refresh'}
        </button>
      </div>

      {/* Summary KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title={lang === 'ar' ? 'إجمالي المشاريع' : 'Total Projects'}
          value={totalProjects}
          icon={<FolderOpen size={20} />}
          color="blue"
          loading={loading}
        />
        <KPICard
          title={lang === 'ar' ? 'معدل الإنجاز' : 'Avg. Completion'}
          value={`${Math.round(avgCompletion)}%`}
          icon={<CheckCircle2 size={20} />}
          color="green"
          loading={loading}
        />
        <KPICard
          title={lang === 'ar' ? 'مهام متأخرة' : 'Overdue Tasks'}
          value={overdueTasks}
          icon={<Clock size={20} />}
          color={overdueTasks > 0 ? 'red' : 'green'}
          loading={loading}
        />
        <KPICard
          title={lang === 'ar' ? 'مهام محظورة' : 'Blocked Tasks'}
          value={blockedTasks}
          icon={<AlertOctagon size={20} />}
          color={blockedTasks > 0 ? 'red' : 'green'}
          loading={loading}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Bar chart: dept breakdown */}
        <div className="xl:col-span-3 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-5">
            {lang === 'ar' ? 'أداء الأقسام' : 'Department Performance'}
          </h2>
          {loading ? (
            <div className="h-48 animate-pulse bg-gray-50 rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barChartData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="completed" name={lang === 'ar' ? 'مكتمل' : 'Completed'} fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="inProgress" name={lang === 'ar' ? 'جاري' : 'In Progress'} fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="overdue" name={lang === 'ar' ? 'متأخر' : 'Overdue'} fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Radar chart */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-5">
            {lang === 'ar' ? 'نسب الإنجاز' : 'Completion Rates'}
          </h2>
          {loading ? (
            <div className="h-48 animate-pulse bg-gray-50 rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="dept" tick={{ fontSize: 11, fill: '#64748b' }} />
                <Radar
                  name={lang === 'ar' ? 'نسبة الإنجاز' : 'Completion %'}
                  dataKey="rate"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.2}
                />
              </RadarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

        {/* Bottlenecks */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-red-100 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <AlertOctagon size={18} className="text-red-500" />
            <h2 className="font-semibold text-gray-800">{t('executive.bottlenecks')}</h2>
            {bottlenecks.length > 0 && (
              <span className="ms-auto text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold">
                {bottlenecks.length}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mb-4">{t('executive.bottleneckDesc')}</p>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 animate-pulse bg-gray-50 rounded-xl" />
              ))}
            </div>
          ) : bottlenecks.length === 0 ? (
            <div className="text-center py-10">
              <CheckCircle2 size={40} className="mx-auto text-green-200 mb-3" />
              <p className="text-gray-400 text-sm">{t('executive.noBottlenecks')}</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[480px] overflow-y-auto">
              {bottlenecks.map((task) => (
                <BottleneckCard key={task.id} task={task} />
              ))}
            </div>
          )}
        </div>

        {/* Department KPI grid */}
        <div className="xl:col-span-3">
          <h2 className="font-semibold text-gray-800 mb-4">{t('executive.deptOverview')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {loading
              ? [1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-44 animate-pulse bg-white border border-gray-100 rounded-2xl" />
                ))
              : deptKpis.map((dept) => (
                  <DepartmentOverviewCard key={dept.department} dept={dept} />
                ))}
          </div>
        </div>
      </div>
    </div>
  );
}
