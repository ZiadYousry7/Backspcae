'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, SlidersHorizontal, FolderOpen, Grid3X3, List } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ProjectCard } from '@/components/dashboard/ProjectCard';
import { DepartmentBadge, ProjectStatusBadge } from '@/components/ui/Badge';
import { cn, DEPARTMENT_CONFIG } from '@/lib/utils';
import type { Project, DepartmentName, ProjectStatus } from '@/types';
import CreateProjectModal from '@/components/projects/CreateProjectModal';

const ALL_STATUSES: ProjectStatus[] = ['planning', 'active', 'on_hold', 'completed', 'cancelled'];

export default function ProjectsPage() {
  const { profile } = useAuth();
  const { t, lang, isRTL } = useLanguage();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCreate, setShowCreate] = useState(false);

  const canCreate = profile?.role === 'super_admin' || profile?.role === 'department_manager';

  const loadProjects = async () => {
    setLoading(true);
    const supabase = createClient();
    let query = supabase
      .from('projects')
      .select(`
        *,
        owner:profiles!projects_owner_id_fkey(id, full_name, full_name_ar, avatar_url),
        members:project_members(user_id, can_edit, user:profiles(id, full_name, avatar_url)),
        tasks:tasks(id, status)
      `)
      .eq('is_archived', false)
      .order('updated_at', { ascending: false });

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data } = await query;

    // Compute _count from tasks
    const raw = (data ?? []) as Record<string, unknown>[];
    const withCount = raw.map((p) => {
      const tasks = (p.tasks as { status: string }[] | null) ?? [];
      return {
        ...p,
        _count: {
          tasks: tasks.length,
          completed: tasks.filter((t) => t.status === 'completed').length,
        },
        tasks: undefined,
      };
    });

    setProjects(withCount as unknown as Project[]);
    setLoading(false);
  };

  useEffect(() => { loadProjects(); }, [statusFilter]);

  // Client-side search filter
  const filtered = projects.filter((p) => {
    const q = search.toLowerCase();
    if (!q) return true;
    const title = lang === 'ar' && p.title_ar ? p.title_ar : p.title;
    return title.toLowerCase().includes(q);
  });

  const statusCounts: Record<string, number> = {};
  projects.forEach((p) => {
    statusCounts[p.status] = (statusCounts[p.status] ?? 0) + 1;
  });

  return (
    <div className={cn('space-y-6', isRTL && 'text-right')}>
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('projects.title')}</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {filtered.length} {lang === 'ar' ? 'مشروع' : 'projects'}
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus size={16} />
            {t('projects.newProject')}
          </button>
        )}
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search size={15} className="absolute top-1/2 -translate-y-1/2 start-3 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('common.search')}
              className="w-full ps-9 pe-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
            />
          </div>

          {/* Status filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setStatusFilter('all')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                statusFilter === 'all'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {t('common.all')} ({projects.length})
            </button>
            {ALL_STATUSES.filter((s) => statusCounts[s]).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  statusFilter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {t(`status.${status}`)} ({statusCounts[status] ?? 0})
              </button>
            ))}
          </div>

          {/* View mode */}
          <div className="flex items-center gap-1 ms-auto bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={cn('p-1.5 rounded-md transition-colors', viewMode === 'grid' ? 'bg-white shadow-sm' : 'text-gray-400 hover:text-gray-600')}
            >
              <Grid3X3 size={15} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn('p-1.5 rounded-md transition-colors', viewMode === 'list' ? 'bg-white shadow-sm' : 'text-gray-400 hover:text-gray-600')}
            >
              <List size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Projects grid / list */}
      {loading ? (
        <div className={cn(viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4' : 'space-y-3')}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 animate-pulse bg-white border border-gray-100 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-2xl border border-gray-100">
          <FolderOpen size={48} className="mx-auto text-gray-200 mb-4" />
          <p className="text-gray-400 font-medium">{search ? t('common.noData') : t('projects.noProjects')}</p>
          {!search && canCreate && (
            <p className="text-gray-400 text-sm mt-1">{t('projects.createFirst')}</p>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((project) => (
            <ProjectListRow key={project.id} project={project} lang={lang} t={t} />
          ))}
        </div>
      )}

      {/* Create project modal */}
      {showCreate && (
        <CreateProjectModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); loadProjects(); }}
        />
      )}
    </div>
  );
}

// List row variant
function ProjectListRow({
  project,
  lang,
  t,
}: {
  project: Project;
  lang: 'en' | 'ar';
  t: (k: string) => string;
}) {
  const { isRTL } = useLanguage();
  const title = lang === 'ar' && project.title_ar ? project.title_ar : project.title;

  return (
    <div className="flex items-center gap-4 bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer">
      <div className="w-2 self-stretch rounded-full bg-blue-500 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-800 truncate">{title}</p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <ProjectStatusBadge status={project.status} lang={lang} />
          <DepartmentBadge dept={project.department} lang={lang} />
        </div>
      </div>
      <div className="hidden md:flex items-center gap-6 shrink-0 text-sm text-gray-400">
        <div className="text-center">
          <p className="font-semibold text-gray-700">{project.progress_percentage}%</p>
          <p className="text-xs">{t('projects.progress')}</p>
        </div>
        {project._count && (
          <div className="text-center">
            <p className="font-semibold text-gray-700">{project._count.completed}/{project._count.tasks}</p>
            <p className="text-xs">{t('projects.tasks')}</p>
          </div>
        )}
        {project.due_date && (
          <div className="text-center">
            <p className="font-semibold text-gray-700">{new Date(project.due_date).toLocaleDateString()}</p>
            <p className="text-xs">{t('projects.dueDate')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
