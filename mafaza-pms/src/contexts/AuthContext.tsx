'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { createClient } from '@/lib/supabase';
import type { Profile } from '@/types';

interface AuthContextValue {
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  microsoftToken: string | null;
  supabaseId: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (supabaseId: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', supabaseId)
      .single();
    if (data) setProfile(data as Profile);
  };

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'authenticated' && session?.user?.supabaseId) {
      fetchProfile(session.user.supabaseId as string).finally(() => setIsLoading(false));
    } else {
      setProfile(null);
      setIsLoading(false);
    }
  }, [status, session]);

  const login = async () => {
    await signIn('microsoft-entra-id', { callbackUrl: '/dashboard' });
  };

  const logout = async () => {
    setProfile(null);
    await signOut({ callbackUrl: '/login' });
  };

  const refreshProfile = async () => {
    if (session?.user?.supabaseId) {
      await fetchProfile(session.user.supabaseId as string);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        profile,
        isLoading,
        isAuthenticated: status === 'authenticated' && !!profile,
        microsoftToken: session?.microsoftAccessToken ?? null,
        supabaseId: session?.user?.supabaseId ?? null,
        login,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
