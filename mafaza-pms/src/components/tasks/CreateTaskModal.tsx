'use client';

import { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import type { DepartmentName, TaskPriority, TaskVisibility } from '@/types';

interface CreateTaskModalProps {
  projectId: string;
  department: DepartmentName;
  parentTaskId?: string;
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateTaskModal({
  projectId,
  department,
  parentTaskId,
  onClose,
  onCreated,
}: CreateTaskModalProps) {
  const { profile } = useAuth();
  const { t, lang, isRTL } = useLanguage();

  const [title, setTitle] = useState('');
  const [titleAr, setTitleAr] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [visibility, setVisibility] = useState<TaskVisibility>('internal');
  const [dueDate, setDueDate] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('');
  const [isMilestone, setIsMilestone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError(t('form.required')); return; }
    if (!profile) return;

    setSaving(true);
    setError('');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    const { error: insertError } = await supabase.from('tasks').insert({
      project_id: projectId,
      parent_task_id: parentTaskId ?? null,
      title: title.trim(),
      title_ar: titleAr.trim() || null,
      description: description.trim() || null,
      status: 'not_started',
      priority,
      visibility,
      department,
      created_by: profile.id,
      due_date: dueDate || null,
      estimated_hours: estimatedHours ? parseFloat(estimatedHours) : null,
      is_milestone: isMilestone,
      sort_order: Date.now(),
      tags: [],
    });

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
    } else {
      onCreated();
    }
  };

  const inputClass = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 hover:bg-white transition-colors';
  const labelClass = 'block text-xs font-medium text-gray-500 mb-1';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">
            {parentTaskId
              ? t('tasks.addSubtask')
              : t('tasks.newTask')}
          </h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <div>
            <label className={labelClass}>{t('form.title')} *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={lang === 'ar' ? 'اسم المهمة (إنجليزي)' : 'Task title'}
              className={inputClass}
              required
            />
          </div>

          <div>
            <label className={labelClass}>{t('form.titleAr')}</label>
            <input
              type="text"
              value={titleAr}
              onChange={(e) => setTitleAr(e.target.value)}
              placeholder="اسم المهمة بالعربية"
              dir="rtl"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>{t('form.description')}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder={lang === 'ar' ? 'وصف المهمة...' : 'Task description...'}
              className={cn(inputClass, 'resize-none')}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>{t('form.selectPriority')}</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className={inputClass}
              >
                <option value="low">{t('priority.low')}</option>
                <option value="medium">{t('priority.medium')}</option>
                <option value="high">{t('priority.high')}</option>
                <option value="critical">{t('priority.critical')}</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>{t('form.selectVisibility')}</label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as TaskVisibility)}
                className={inputClass}
              >
                <option value="public">{t('visibility.public')}</option>
                <option value="internal">{t('visibility.internal')}</option>
                <option value="private">{t('visibility.private')}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>{t('tasks.dueDate')}</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>{t('tasks.estimatedHours')}</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
                placeholder="0"
                className={inputClass}
              />
            </div>
          </div>

          {/* Milestone toggle */}
          <label className="flex items-center gap-2.5 cursor-pointer">
            <div
              onClick={() => setIsMilestone(!isMilestone)}
              className={cn(
                'w-10 h-5 rounded-full transition-colors relative',
                isMilestone ? 'bg-blue-600' : 'bg-gray-200'
              )}
            >
              <span className={cn(
                'absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all',
                isMilestone ? 'start-5' : 'start-0.5'
              )} />
            </div>
            <span className="text-sm text-gray-700">
              {lang === 'ar' ? 'تعيين كمعلم رئيسي' : 'Set as Milestone'}
            </span>
          </label>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {saving ? (lang === 'ar' ? 'جاري الحفظ...' : 'Saving...') : t('common.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
