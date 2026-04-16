'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Building2, LogIn, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const { t, lang, toggleLang, isRTL } = useLanguage();
  const router = useRouter();

  const [tab, setTab]               = useState<'microsoft' | 'email'>('microsoft');
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [showPass, setShowPass]     = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  // Microsoft SSO
  const handleMicrosoft = async () => {
    setLoading(true);
    await signIn('microsoft-entra-id', { callbackUrl: '/dashboard' });
  };

  // Email / password
  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.ok) {
      router.push('/dashboard');
    } else {
      setError(
        lang === 'ar'
          ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
          : 'Invalid email or password'
      );
    }
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-[#0F1729] via-[#1a2744] to-[#0F1729] flex flex-col items-center justify-center p-4"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Language toggle */}
      <button
        onClick={toggleLang}
        style={{ position: 'absolute', top: '1.5rem', insetInlineEnd: '1.5rem' }}
        className="text-sm text-white/50 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition-colors"
      >
        {lang === 'en' ? 'العربية' : 'English'}
      </button>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-700 flex items-center justify-center mx-auto mb-5 shadow-2xl shadow-blue-500/30">
            <Building2 size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">{t('auth.welcome')}</h1>
          <p className="text-white/40 text-sm">{t('auth.subtitle')}</p>
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-7 shadow-xl">

          {/* Tabs */}
          <div className="flex bg-white/10 rounded-xl p-1 mb-6 gap-1">
            {[
              { id: 'microsoft', label: lang === 'ar' ? 'Microsoft 365' : 'Microsoft 365' },
              { id: 'email',     label: lang === 'ar' ? 'بريد إلكتروني' : 'Email & Password' },
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => { setTab(id as typeof tab); setError(''); }}
                className={cn(
                  'flex-1 py-2 rounded-lg text-sm font-medium transition-all',
                  tab === id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-white/60 hover:text-white'
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/30 text-red-300 rounded-xl px-3 py-2.5 text-sm mb-4">
              <AlertCircle size={15} />
              {error}
            </div>
          )}

          {/* Microsoft tab */}
          {tab === 'microsoft' && (
            <div>
              <p className="text-white/60 text-sm text-center mb-5">
                {lang === 'ar'
                  ? 'سجّل دخولك بحساب Microsoft 365 الخاص بشركتك'
                  : 'Sign in with your company Microsoft 365 account'}
              </p>
              <button
                onClick={handleMicrosoft}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-3.5 bg-white text-gray-800 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-all shadow-lg disabled:opacity-60"
              >
                <svg width="20" height="20" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
                  <rect x="1" y="1" width="9" height="9" fill="#F25022" />
                  <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
                  <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
                  <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
                </svg>
                {loading
                  ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />{t('auth.signingIn')}</span>
                  : <><LogIn size={15} />{t('auth.signInWith365')}</>}
              </button>
            </div>
          )}

          {/* Email/Password tab */}
          {tab === 'email' && (
            <form onSubmit={handleEmail} className="space-y-4">
              {/* Email field */}
              <div>
                <label className="block text-xs font-medium text-white/60 mb-1.5">
                  {lang === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute top-1/2 -translate-y-1/2 text-white/30" style={{ insetInlineStart: '0.75rem' }} />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder={lang === 'ar' ? 'you@mafaza.com' : 'you@mafaza.com'}
                    className="w-full bg-white/10 border border-white/20 text-white placeholder-white/30 rounded-xl py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    style={{ paddingInlineStart: '2.5rem', paddingInlineEnd: '0.75rem' }}
                  />
                </div>
              </div>

              {/* Password field */}
              <div>
                <label className="block text-xs font-medium text-white/60 mb-1.5">
                  {lang === 'ar' ? 'كلمة المرور' : 'Password'}
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute top-1/2 -translate-y-1/2 text-white/30" style={{ insetInlineStart: '0.75rem' }} />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full bg-white/10 border border-white/20 text-white placeholder-white/30 rounded-xl py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    style={{ paddingInlineStart: '2.5rem', paddingInlineEnd: '2.5rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70"
                    style={{ insetInlineEnd: '0.75rem' }}
                  >
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading
                  ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{t('auth.signingIn')}</>
                  : t('auth.signIn')}
              </button>
            </form>
          )}

          <p className="text-white/25 text-xs text-center mt-5">
            {lang === 'ar'
              ? 'تسجيل الدخول يعني موافقتك على شروط الاستخدام وسياسة الخصوصية'
              : 'By signing in you agree to the Terms of Use and Privacy Policy.'}
          </p>
        </div>

        <p className="text-center text-white/20 text-xs mt-6">
          © {new Date().getFullYear()} Mafaza F&B Company. All rights reserved.
        </p>
      </div>
    </div>
  );
}
