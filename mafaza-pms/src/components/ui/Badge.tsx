import { cn } from '@/lib/utils';
import type { TaskStatus, TaskPriority, ProjectStatus, DepartmentName, TaskVisibility } from '@/types';
import { TASK_STATUS_CONFIG, PROJECT_STATUS_CONFIG, PRIORITY_CONFIG, DEPARTMENT_CONFIG } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'outline';
}

export function Badge({ children, className, variant = 'default' }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
      variant === 'outline' && 'border border-current bg-transparent',
      className
    )}>
      {children}
    </span>
  );
}

export function StatusBadge({ status, lang = 'en' }: { status: TaskStatus; lang?: 'en' | 'ar' }) {
  const cfg = TASK_STATUS_CONFIG[status];
  return (
    <Badge className={cn(cfg.bg, cfg.color)}>
      {lang === 'ar' ? cfg.labelAr : cfg.label}
    </Badge>
  );
}

export function ProjectStatusBadge({ status, lang = 'en' }: { status: ProjectStatus; lang?: 'en' | 'ar' }) {
  const cfg = PROJECT_STATUS_CONFIG[status];
  return (
    <Badge className={cn(cfg.bg, cfg.color)}>
      {lang === 'ar' ? cfg.labelAr : cfg.label}
    </Badge>
  );
}

export function PriorityBadge({ priority, lang = 'en' }: { priority: TaskPriority; lang?: 'en' | 'ar' }) {
  const cfg = PRIORITY_CONFIG[priority];
  return (
    <Badge className={cn(cfg.bg, cfg.color)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />
      {lang === 'ar' ? cfg.labelAr : cfg.label}
    </Badge>
  );
}

export function DepartmentBadge({ dept, lang = 'en' }: { dept: DepartmentName; lang?: 'en' | 'ar' }) {
  const cfg = DEPARTMENT_CONFIG[dept];
  return (
    <Badge className={cn(cfg.bg, cfg.color)}>
      {lang === 'ar' ? cfg.labelAr : cfg.label}
    </Badge>
  );
}

export function VisibilityBadge({ visibility, lang = 'en' }: { visibility: TaskVisibility; lang?: 'en' | 'ar' }) {
  const config = {
    public:   { label: 'Public',   labelAr: 'عام',     color: 'text-green-600',  bg: 'bg-green-50' },
    internal: { label: 'Internal', labelAr: 'داخلي',   color: 'text-blue-600',   bg: 'bg-blue-50' },
    private:  { label: 'Private',  labelAr: 'خاص',     color: 'text-gray-600',   bg: 'bg-gray-100' },
  };
  const cfg = config[visibility];
  return (
    <Badge className={cn(cfg.bg, cfg.color)}>
      {lang === 'ar' ? cfg.labelAr : cfg.label}
    </Badge>
  );
}
