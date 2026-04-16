'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Building2, LogIn } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const { t, lang, toggleLang, isRTL } = useLanguage();
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    await signIn('microsoft-entra-id', { callbackUrl: '/dashboard' });
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-[#0F1729] via-[#1a2744] to-[#0F1729] flex flex-col items-center justify-center p-4"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Language toggle */}
      <button
        onClick={toggleLang}
        className="absolute top-6 end-6 text-sm text-white/50 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition-colors"
      >
        {lang === 'en' ? 'العربية' : 'English'}
      </button>

      {/* Card */}
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-700 flex items-center justify-center mx-auto mb-5 shadow-2xl shadow-blue-500/30">
            <Building2 size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">{t('auth.welcome')}</h1>
          <p className="text-white/50 text-sm">{t('auth.subtitle')}</p>
        </div>

        {/* Sign-in card */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 shadow-xl">
          <p className="text-white/70 text-sm text-center mb-6">
            {lang === 'ar'
              ? 'قم بتسجيل الدخول باستخدام حساب Microsoft 365 الخاص بشركتك'
              : 'Sign in with your company Microsoft 365 account to access the platform.'}
          </p>

          <button
            onClick={handleSignIn}
            disabled={loading}
            className={cn(
              'w-full flex items-center justify-center gap-3 py-3.5 px-5',
              'bg-white text-gray-800 rounded-xl font-semibold text-sm',
              'hover:bg-gray-50 active:bg-gray-100 transition-all',
              'shadow-lg shadow-black/10 hover:shadow-xl',
              loading && 'opacity-70 cursor-not-allowed'
            )}
          >
            {/* Microsoft logo */}
            <svg width="20" height="20" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
              <rect x="1" y="1" width="9" height="9" fill="#F25022" />
              <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
              <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
              <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
            </svg>
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                {t('auth.signingIn')}
              </span>
            ) : (
              <>
                <LogIn size={16} />
                {t('auth.signInWith365')}
              </>
            )}
          </button>

          <p className="text-white/30 text-xs text-center mt-5">
            {lang === 'ar'
              ? 'تسجيل الدخول يعني موافقتك على سياسة الخصوصية وشروط الاستخدام'
              : 'By signing in, you agree to the Privacy Policy and Terms of Use.'}
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-white/25 text-xs mt-8">
          © {new Date().getFullYear()} Mafaza F&B Company. All rights reserved.
        </p>
      </div>
    </div>
  );
}
