'use client';

import { useState, useEffect, use } from 'react';
import {
  ArrowLeft, Plus, Settings, Users, Calendar,
  CheckSquare, AlertOctagon, FolderOpen, MoreHorizontal,
  Milestone
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { TaskRow } from '@/components/dashboard/TaskRow';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ProjectStatusBadge, PriorityBadge, DepartmentBadge, VisibilityBadge } from '@/components/ui/Badge';
import { AvatarGroup, Avatar } from '@/components/ui/Avatar';
import { TaskModal } from '@/components/tasks/TaskModal';
import CreateTaskModal from '@/components/tasks/CreateTaskModal';
import { cn, TASK_STATUS_CONFIG } from '@/lib/utils';
import type { Project, Task, Profile } from '@/types';

type TaskStatus = Task['status'];

const TASK_COLUMNS: { status: TaskStatus; icon: React.ElementType }[] = [
  { status: 'not_started', icon: CheckSquare },
  { status: 'in_progress', icon: CheckSquare },
  { status: 'under_review', icon: CheckSquare },
  { status: 'completed', icon: CheckSquare },
  { status: 'blocked', icon: AlertOctagon },
];

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params);
  const { profile } = useAuth();
  const { t, lang, isRTL } = useLanguage();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [viewMode, setViewMode] = useState<'board' | 'list'>('list');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');

  const canEdit =
    profile?.role === 'super_admin' ||
    profile?.role === 'department_manager' ||
    project?.owner_id === profile?.id;

  const loadData = async () => {
    setLoading(true);
    const supabase = createClient();

    const [{ data: proj }, { data: taskData }] = await Promise.all([
      supabase
        .from('projects')
        .select(`
          *,
          owner:profiles!projects_owner_id_fkey(id, full_name, full_name_ar, avatar_url, job_title),
          members:project_members(user_id, can_edit, user:profiles(id, full_name, avatar_url))
        `)
        .eq('id', projectId)
        .single(),

      supabase
        .from('tasks')
        .select(`
          *,
          assignee:profiles!tasks_assigned_to_fkey(id, full_name, full_name_ar, avatar_url),
          creator:profiles!tasks_created_by_fkey(id, full_name),
          subtasks:tasks!tasks_parent_task_id_fkey(id, title, status, priority, assigned_to),
          _comment_count:comments(id)
        `)
        .eq('project_id', projectId)
        .is('parent_task_id', null)
        .order('sort_order', { ascending: true }),
    ]);

    setProject((proj ?? null) as Project | null);
    setTasks((taskData as Task[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [projectId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-40 animate-pulse bg-white rounded-2xl border border-gray-100" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse bg-white rounded-2xl border border-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-24">
        <FolderOpen size={48} className="mx-auto text-gray-200 mb-4" />
        <p className="text-gray-400 font-medium">{lang === 'ar' ? 'المشروع غير موجود' : 'Project not found'}</p>
        <Link href="/projects" className="text-blue-600 text-sm mt-2 inline-block hover:underline">
          {lang === 'ar' ? '← العودة للمشاريع' : '← Back to Projects'}
        </Link>
      </div>
    );
  }

  const title = lang === 'ar' && project.title_ar ? project.title_ar : project.title;
  const description = lang === 'ar' && project.description_ar ? project.description_ar : project.description;
  const members = (project.members?.map((m) => m.user).filter(Boolean) as Profile[]) ?? [];

  const filteredTasks = statusFilter === 'all' ? tasks : tasks.filter((t) => t.status === statusFilter);

  const tasksByStatus = TASK_COLUMNS.reduce<Record<TaskStatus, Task[]>>((acc, col) => {
    acc[col.status] = tasks.filter((t) => t.status === col.status);
    return acc;
  }, {} as Record<TaskStatus, Task[]>);

  const milestones = tasks.filter((t) => t.is_milestone);

  return (
    <div className={cn('space-y-6', isRTL && 'text-right')}>
      {/* Back link */}
      <Link
        href="/projects"
        className={cn(
          'inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition-colors',
          isRTL && 'flex-row-reverse'
        )}
      >
        <ArrowLeft size={15} className={isRTL ? 'rotate-180' : ''} />
        {t('projects.title')}
      </Link>

      {/* Project header card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-blue-500 to-blue-700" />
        <div className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-gray-900 mb-2">{title}</h1>
              <div className="flex flex-wrap items-center gap-2">
                <ProjectStatusBadge status={project.status} lang={lang} />
                <PriorityBadge priority={project.priority} lang={lang} />
                <DepartmentBadge dept={project.department} lang={lang} />
                <VisibilityBadge visibility={project.visibility} lang={lang} />
              </div>
            </div>
            {canEdit && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCreateTask(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  <Plus size={15} />
                  {t('tasks.newTask')}
                </button>
                <button className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg transition-colors">
                  <MoreHorizontal size={18} />
                </button>
              </div>
            )}
          </div>

          {description && (
            <p className="text-sm text-gray-500 mb-5 leading-relaxed">{description}</p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
            {project.start_date && (
              <div>
                <p className="text-xs text-gray-400 mb-0.5">{lang === 'ar' ? 'تاريخ البدء' : 'Start Date'}</p>
                <p className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  <Calendar size={13} />
                  {new Date(project.start_date).toLocaleDateString()}
                </p>
              </div>
            )}
            {project.due_date && (
              <div>
                <p className="text-xs text-gray-400 mb-0.5">{t('projects.dueDate')}</p>
                <p className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  <Calendar size={13} className="text-orange-500" />
                  {new Date(project.due_date).toLocaleDateString()}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-400 mb-0.5">{t('projects.owner')}</p>
              <div className="flex items-center gap-1.5">
                <Avatar profile={project.owner as Profile} size="xs" />
                <p className="text-sm font-medium text-gray-700 truncate">
                  {project.owner?.full_name}
                </p>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">{t('projects.members')}</p>
              <AvatarGroup profiles={members} max={5} size="xs" />
            </div>
          </div>

          <ProgressBar
            value={project.progress_percentage}
            height="md"
            color="auto"
            showLabel
            label={t('projects.progress')}
          />
        </div>
      </div>

      {/* Milestone strip */}
      {milestones.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Milestone size={16} className="text-amber-600" />
            <h3 className="font-semibold text-amber-800 text-sm">
              {lang === 'ar' ? 'المعالم الرئيسية' : 'Milestones'}
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {milestones.map((m) => {
              const cfg = TASK_STATUS_CONFIG[m.status];
              return (
                <button
                  key={m.id}
                  onClick={() => setSelectedTask(m)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer transition-colors',
                    cfg.bg, cfg.color, 'border-current/20 hover:opacity-80'
                  )}
                >
                  ◆ {lang === 'ar' && m.title_ar ? m.title_ar : m.title}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Task view controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          {(['all', ...TASK_COLUMNS.map((c) => c.status)] as const).map((s) => {
            const count = s === 'all' ? tasks.length : tasksByStatus[s as TaskStatus]?.length ?? 0;
            if (count === 0 && s !== 'all') return null;
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s as typeof statusFilter)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  statusFilter === s
                    ? 'bg-gray-900 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                )}
              >
                {s === 'all' ? t('common.all') : t(`status.${s}`)} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Task list */}
      <div className="space-y-2">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <CheckSquare size={40} className="mx-auto text-gray-200 mb-3" />
            <p className="text-gray-400 text-sm">{t('tasks.noTasks')}</p>
            {canEdit && (
              <button
                onClick={() => setShowCreateTask(true)}
                className="mt-3 text-sm text-blue-600 hover:underline"
              >
                + {t('tasks.newTask')}
              </button>
            )}
          </div>
        ) : (
          filteredTasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onClick={() => setSelectedTask(task)}
            />
          ))
        )}
      </div>

      {/* Task detail modal */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdated={() => { setSelectedTask(null); loadData(); }}
        />
      )}

      {/* Create task modal */}
      {showCreateTask && project && (
        <CreateTaskModal
          projectId={project.id}
          department={project.department}
          onClose={() => setShowCreateTask(false)}
          onCreated={() => { setShowCreateTask(false); loadData(); }}
        />
      )}
    </div>
  );
}
