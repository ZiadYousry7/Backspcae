'use client';

import { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import type { DepartmentName, TaskPriority, TaskVisibility } from '@/types';

interface CreateProjectModalProps {
  onClose: () => void;
  onCreated: () => void;
}

const DEPARTMENTS: DepartmentName[] = [
  'marketing', 'sales', 'r_and_d', 'production', 'accounts', 'procurement'
];

export default function CreateProjectModal({ onClose, onCreated }: CreateProjectModalProps) {
  const { profile } = useAuth();
  const { t, lang, isRTL } = useLanguage();

  const [title, setTitle] = useState('');
  const [titleAr, setTitleAr] = useState('');
  const [description, setDescription] = useState('');
  const [descriptionAr, setDescriptionAr] = useState('');
  const [department, setDepartment] = useState<DepartmentName>(
    profile?.department ?? 'marketing'
  );
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [visibility, setVisibility] = useState<TaskVisibility>('internal');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
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
    const { error: insertError } = await supabase.from('projects').insert({
      title: title.trim(),
      title_ar: titleAr.trim() || null,
      description: description.trim() || null,
      description_ar: descriptionAr.trim() || null,
      department,
      priority,
      visibility,
      status: 'planning',
      owner_id: profile.id,
      start_date: startDate || null,
      due_date: dueDate || null,
      tags: [],
      is_archived: false,
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white flex items-center justify-between p-5 border-b border-gray-100 z-10">
          <h2 className="font-bold text-gray-900">{t('projects.newProject')}</h2>
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
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder={lang === 'ar' ? 'اسم المشروع (إنجليزي)' : 'Project title'}
              className={inputClass} required />
          </div>

          <div>
            <label className={labelClass}>{t('form.titleAr')}</label>
            <input type="text" value={titleAr} onChange={(e) => setTitleAr(e.target.value)}
              placeholder="اسم المشروع بالعربية" dir="rtl" className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>{t('form.description')}</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              rows={2} placeholder={lang === 'ar' ? 'وصف المشروع...' : 'Project description...'}
              className={cn(inputClass, 'resize-none')} />
          </div>

          <div>
            <label className={labelClass}>{t('form.descriptionAr')}</label>
            <textarea value={descriptionAr} onChange={(e) => setDescriptionAr(e.target.value)}
              rows={2} placeholder="وصف المشروع بالعربية..." dir="rtl"
              className={cn(inputClass, 'resize-none')} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>{t('form.selectDept')} *</label>
              <select value={department} onChange={(e) => setDepartment(e.target.value as DepartmentName)}
                className={inputClass}
                disabled={profile?.role === 'department_manager'}
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{t(`dept.${d}`)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>{t('form.selectPriority')}</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className={inputClass}>
                <option value="low">{t('priority.low')}</option>
                <option value="medium">{t('priority.medium')}</option>
                <option value="high">{t('priority.high')}</option>
                <option value="critical">{t('priority.critical')}</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>{t('form.selectVisibility')}</label>
            <select value={visibility} onChange={(e) => setVisibility(e.target.value as TaskVisibility)}
              className={inputClass}>
              <option value="public">{t('visibility.public')}</option>
              <option value="internal">{t('visibility.internal')}</option>
              <option value="private">{t('visibility.private')}</option>
            </select>
            <p className="text-[11px] text-gray-400 mt-1">
              {visibility === 'public' && (lang === 'ar' ? 'مرئي للأقسام ذات الصلة' : 'Visible to relevant departments')}
              {visibility === 'internal' && (lang === 'ar' ? 'مرئي لأعضاء القسم فقط' : 'Visible to department members only')}
              {visibility === 'private' && (lang === 'ar' ? 'مرئي للأعضاء المضافين والإدارة فقط' : 'Visible only to added members and management')}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>{lang === 'ar' ? 'تاريخ البدء' : 'Start Date'}</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{t('projects.dueDate')}</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                min={startDate} className={inputClass} />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
              {t('common.cancel')}
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {saving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {saving ? (lang === 'ar' ? 'جاري الإنشاء...' : 'Creating...') : t('common.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
