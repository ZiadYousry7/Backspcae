'use client';

import { useState } from 'react';
import { User, Globe, Shield, Save, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const { profile, refreshProfile } = useAuth();
  const { t, lang, toggleLang, isRTL } = useLanguage();
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [fullNameAr, setFullNameAr] = useState(profile?.full_name_ar ?? '');
  const [jobTitle, setJobTitle] = useState(profile?.job_title ?? '');
  const [jobTitleAr, setJobTitleAr] = useState(profile?.job_title_ar ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    await supabase.from('profiles').update({
      full_name: fullName,
      full_name_ar: fullNameAr || null,
      job_title: jobTitle || null,
      job_title_ar: jobTitleAr || null,
    }).eq('id', profile.id);
    await refreshProfile();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const inputClass = 'w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 hover:bg-white transition-colors';
  const labelClass = 'block text-xs font-medium text-gray-500 mb-1.5';

  if (!profile) return null;

  return (
    <div className={cn('space-y-6 max-w-2xl', isRTL && 'text-right')}>
      <h1 className="text-2xl font-bold text-gray-900">{t('nav.settings')}</h1>

      {/* Profile card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-5">
          <User size={16} className="text-blue-600" />
          <h2 className="font-semibold text-gray-800">
            {lang === 'ar' ? 'الملف الشخصي' : 'Profile'}
          </h2>
        </div>

        {/* Avatar */}
        <div className="flex items-center gap-4 mb-6">
          <Avatar profile={profile} size="xl" />
          <div>
            <p className="font-semibold text-gray-800">{profile.full_name}</p>
            <p className="text-sm text-gray-400">{profile.email}</p>
            <span className="inline-block mt-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
              {t(`role.${profile.role}`)}
              {profile.department ? ` · ${t(`dept.${profile.department}`)}` : ''}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>{lang === 'ar' ? 'الاسم الكامل (إنجليزي)' : 'Full Name'}</label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>{lang === 'ar' ? 'الاسم بالعربي' : 'Full Name (Arabic)'}</label>
            <input type="text" value={fullNameAr} onChange={(e) => setFullNameAr(e.target.value)} dir="rtl" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>{lang === 'ar' ? 'المسمى الوظيفي' : 'Job Title'}</label>
            <input type="text" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>{lang === 'ar' ? 'المسمى الوظيفي (عربي)' : 'Job Title (Arabic)'}</label>
            <input type="text" value={jobTitleAr} onChange={(e) => setJobTitleAr(e.target.value)} dir="rtl" className={inputClass} />
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saved ? <Check size={15} /> : saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={15} />}
            {saved ? (lang === 'ar' ? 'تم الحفظ!' : 'Saved!') : t('common.save')}
          </button>
        </div>
      </div>

      {/* Language settings */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-5">
          <Globe size={16} className="text-blue-600" />
          <h2 className="font-semibold text-gray-800">
            {lang === 'ar' ? 'اللغة والعرض' : 'Language & Display'}
          </h2>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">
              {lang === 'ar' ? 'اللغة الحالية' : 'Current Language'}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {lang === 'ar' ? 'العربية (RTL)' : 'English (LTR)'}
            </p>
          </div>
          <button
            onClick={toggleLang}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            {lang === 'en' ? 'التبديل للعربية' : 'Switch to English'}
          </button>
        </div>
      </div>

      {/* Account info */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-5">
          <Shield size={16} className="text-blue-600" />
          <h2 className="font-semibold text-gray-800">
            {lang === 'ar' ? 'معلومات الحساب' : 'Account Information'}
          </h2>
        </div>
        <div className="space-y-3 text-sm">
          {[
            { label: lang === 'ar' ? 'البريد الإلكتروني' : 'Email', value: profile.email },
            { label: lang === 'ar' ? 'الدور' : 'Role', value: t(`role.${profile.role}`) },
            { label: lang === 'ar' ? 'القسم' : 'Department', value: profile.department ? t(`dept.${profile.department}`) : (lang === 'ar' ? 'الكل' : 'All') },
            { label: lang === 'ar' ? 'الحساب مرتبط بـ' : 'Linked to', value: 'Microsoft 365' },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between text-sm">
              <span className="text-gray-500">{label}</span>
              <span className="font-medium text-gray-800">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
