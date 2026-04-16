'use client';

import { Calendar, AlertCircle } from 'lucide-react';
import { cn, isOverdue, getDaysUntilDue, PRIORITY_CONFIG } from '@/lib/utils';
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import type { Task } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

interface TaskRowProps {
  task: Task;
  onClick?: (task: Task) => void;
  compact?: boolean;
}

export function TaskRow({ task, onClick, compact = false }: TaskRowProps) {
  const { lang, isRTL } = useLanguage();
  const overdue = isOverdue(task.due_date) && task.status !== 'completed';
  const daysUntil = getDaysUntilDue(task.due_date);
  const title = lang === 'ar' && task.title_ar ? task.title_ar : task.title;

  return (
    <div
      onClick={() => onClick?.(task)}
      className={cn(
        'flex items-center gap-3 p-3 rounded-xl border bg-white hover:bg-gray-50 cursor-pointer transition-all group',
        overdue ? 'border-red-200 bg-red-50/30' : 'border-gray-100',
        compact && 'p-2.5'
      )}
    >
      {/* Priority color strip */}
      <div className={cn(
        'w-1 self-stretch rounded-full shrink-0',
        PRIORITY_CONFIG[task.priority].dot.replace('bg-', 'bg-')
      )} />

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {task.is_milestone && (
            <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-semibold">◆ Milestone</span>
          )}
          <p className={cn(
            'text-sm font-medium text-gray-800 truncate',
            task.status === 'completed' && 'line-through text-gray-400'
          )}>
            {title}
          </p>
        </div>

        {!compact && (
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={task.status} lang={lang} />
            <PriorityBadge priority={task.priority} lang={lang} />
          </div>
        )}
      </div>

      {/* Right side meta */}
      <div className={cn('flex items-center gap-3 shrink-0', isRTL && 'flex-row-reverse')}>
        {task.due_date && (
          <div className={cn(
            'flex items-center gap-1 text-xs',
            overdue ? 'text-red-500 font-medium' : 'text-gray-400'
          )}>
            {overdue && <AlertCircle size={12} />}
            <Calendar size={12} />
            <span>
              {daysUntil === null ? '' :
               daysUntil === 0 ? (lang === 'ar' ? 'اليوم' : 'Today') :
               daysUntil < 0 ? (lang === 'ar' ? `${Math.abs(daysUntil)} أيام` : `${Math.abs(daysUntil)}d late`) :
               (lang === 'ar' ? `${daysUntil} أيام` : `${daysUntil}d`)}
            </span>
          </div>
        )}
        {task.assignee && (
          <Avatar profile={task.assignee} size="xs" />
        )}
      </div>
    </div>
  );
}
