'use client';

import { Calendar, CheckSquare, Users, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { cn, getDaysUntilDue, isOverdue } from '@/lib/utils';
import { ProjectStatusBadge, PriorityBadge, DepartmentBadge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { AvatarGroup } from '@/components/ui/Avatar';
import type { Project, Profile } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

interface ProjectCardProps {
  project: Project;
  className?: string;
}

export function ProjectCard({ project, className }: ProjectCardProps) {
  const { lang, t, isRTL } = useLanguage();
  const overdue = isOverdue(project.due_date) && project.status !== 'completed';
  const daysLeft = getDaysUntilDue(project.due_date);
  const title = lang === 'ar' && project.title_ar ? project.title_ar : project.title;
  const members = (project.members?.map((m) => m.user).filter(Boolean) ?? []) as Profile[];

  return (
    <Link href={`/projects/${project.id}`}>
      <div className={cn(
        'bg-white rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all group cursor-pointer overflow-hidden',
        className
      )}>
        {/* Top color bar based on department */}
        <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-blue-600" />

        <div className="p-5">
          {/* Header row */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-base leading-snug truncate group-hover:text-blue-600 transition-colors">
                {title}
              </h3>
            </div>
            <ArrowRight size={16} className={cn(
              'text-gray-300 group-hover:text-blue-500 shrink-0 mt-0.5 transition-all group-hover:translate-x-0.5',
              isRTL && 'rotate-180 group-hover:-translate-x-0.5'
            )} />
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            <ProjectStatusBadge status={project.status} lang={lang} />
            <PriorityBadge priority={project.priority} lang={lang} />
            <DepartmentBadge dept={project.department} lang={lang} />
          </div>

          {/* Progress */}
          <div className="mb-4">
            <ProgressBar
              value={project.progress_percentage}
              height="sm"
              color="auto"
              showLabel
              label={t('projects.progress')}
            />
          </div>

          {/* Footer row */}
          <div className="flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center gap-3">
              {/* Task count */}
              {project._count && (
                <div className="flex items-center gap-1">
                  <CheckSquare size={12} />
                  <span>{project._count.completed}/{project._count.tasks} {t('projects.tasks')}</span>
                </div>
              )}

              {/* Due date */}
              {project.due_date && (
                <div className={cn('flex items-center gap-1', overdue && 'text-red-500 font-medium')}>
                  <Calendar size={12} />
                  <span>
                    {daysLeft === null ? '' :
                     daysLeft === 0 ? (lang === 'ar' ? 'اليوم' : 'Today') :
                     daysLeft < 0 ? (lang === 'ar' ? `${Math.abs(daysLeft)} أيام متأخر` : `${Math.abs(daysLeft)}d late`) :
                     (lang === 'ar' ? `${daysLeft} يوم متبقي` : `${daysLeft}d left`)}
                  </span>
                </div>
              )}
            </div>

            {/* Member avatars */}
            {members.length > 0 && (
              <div className="flex items-center gap-1">
                <Users size={12} />
                <AvatarGroup profiles={members} max={3} size="xs" />
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
