import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { TaskPriority, TaskStatus, ProjectStatus, DepartmentName } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Status display helpers
export const TASK_STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; labelAr: string; color: string; bg: string }
> = {
  not_started:  { label: 'Not Started',  labelAr: 'لم يبدأ',    color: 'text-gray-600',   bg: 'bg-gray-100' },
  in_progress:  { label: 'In Progress',  labelAr: 'جاري',       color: 'text-blue-600',   bg: 'bg-blue-100' },
  under_review: { label: 'Under Review', labelAr: 'قيد المراجعة', color: 'text-purple-600', bg: 'bg-purple-100' },
  completed:    { label: 'Completed',    labelAr: 'مكتمل',      color: 'text-green-600',  bg: 'bg-green-100' },
  blocked:      { label: 'Blocked',      labelAr: 'محظور',      color: 'text-red-600',    bg: 'bg-red-100' },
  cancelled:    { label: 'Cancelled',    labelAr: 'ملغي',       color: 'text-gray-500',   bg: 'bg-gray-50' },
};

export const PROJECT_STATUS_CONFIG: Record<
  ProjectStatus,
  { label: string; labelAr: string; color: string; bg: string }
> = {
  planning:   { label: 'Planning',   labelAr: 'تخطيط',   color: 'text-gray-600',   bg: 'bg-gray-100' },
  active:     { label: 'Active',     labelAr: 'نشط',     color: 'text-blue-600',   bg: 'bg-blue-100' },
  on_hold:    { label: 'On Hold',    labelAr: 'متوقف',   color: 'text-yellow-600', bg: 'bg-yellow-100' },
  completed:  { label: 'Completed',  labelAr: 'مكتمل',   color: 'text-green-600',  bg: 'bg-green-100' },
  cancelled:  { label: 'Cancelled',  labelAr: 'ملغي',    color: 'text-red-600',    bg: 'bg-red-100' },
};

export const PRIORITY_CONFIG: Record<
  TaskPriority,
  { label: string; labelAr: string; color: string; bg: string; dot: string }
> = {
  low:      { label: 'Low',      labelAr: 'منخفض',  color: 'text-gray-600',  bg: 'bg-gray-100',  dot: 'bg-gray-400' },
  medium:   { label: 'Medium',   labelAr: 'متوسط',  color: 'text-blue-600',  bg: 'bg-blue-100',  dot: 'bg-blue-500' },
  high:     { label: 'High',     labelAr: 'عالي',   color: 'text-orange-600',bg: 'bg-orange-100', dot: 'bg-orange-500' },
  critical: { label: 'Critical', labelAr: 'حرج',    color: 'text-red-600',   bg: 'bg-red-100',   dot: 'bg-red-600' },
};

export const DEPARTMENT_CONFIG: Record<
  DepartmentName,
  { label: string; labelAr: string; color: string; bg: string }
> = {
  marketing:   { label: 'Marketing',   labelAr: 'التسويق',        color: 'text-purple-700', bg: 'bg-purple-100' },
  sales:       { label: 'Sales',       labelAr: 'المبيعات',       color: 'text-green-700',  bg: 'bg-green-100' },
  r_and_d:     { label: 'R&D',         labelAr: 'البحث والتطوير', color: 'text-yellow-700', bg: 'bg-yellow-100' },
  production:  { label: 'Production',  labelAr: 'الإنتاج',        color: 'text-red-700',    bg: 'bg-red-100' },
  accounts:    { label: 'Accounts',    labelAr: 'الحسابات',       color: 'text-blue-700',   bg: 'bg-blue-100' },
  procurement: { label: 'Procurement', labelAr: 'المشتريات',      color: 'text-pink-700',   bg: 'bg-pink-100' },
};

// Format relative date
export function formatRelativeDate(dateStr: string, lang: 'en' | 'ar' = 'en'): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (lang === 'ar') {
    if (diffDays === 0) return 'اليوم';
    if (diffDays === 1) return 'غداً';
    if (diffDays === -1) return 'أمس';
    if (diffDays > 0) return `خلال ${diffDays} أيام`;
    return `منذ ${Math.abs(diffDays)} أيام`;
  }

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays > 0) return `In ${diffDays} days`;
  return `${Math.abs(diffDays)} days ago`;
}

export function isOverdue(dueDate?: string): boolean {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date() ;
}

export function getDaysUntilDue(dueDate?: string): number | null {
  if (!dueDate) return null;
  const diff = new Date(dueDate).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

export function getFileType(mimeType: string): 'image' | 'document' | 'spreadsheet' | 'other' {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('csv')) return 'spreadsheet';
  if (mimeType.includes('pdf') || mimeType.includes('word') || mimeType.includes('document')) return 'document';
  return 'other';
}
