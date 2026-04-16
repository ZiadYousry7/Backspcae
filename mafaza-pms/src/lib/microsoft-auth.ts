// =============================================================
// Mafaza PMS – Authentication
// Supports: Microsoft 365 SSO + Email/Password credentials
// =============================================================

import NextAuth from 'next-auth';
import MicrosoftEntraID from 'next-auth/providers/microsoft-entra-id';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';

const getSupabase = () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createServiceClient } = require('./supabase') as typeof import('./supabase');
  return createServiceClient();
};

const TENANT_ID = process.env.AZURE_AD_TENANT_ID ?? 'common';
const hasMicrosoft =
  !!process.env.AZURE_AD_CLIENT_ID &&
  process.env.AZURE_AD_CLIENT_ID !== 'placeholder-client-id';

const providers = [];

// ---- Microsoft 365 SSO (only when configured) ----
if (hasMicrosoft) {
  providers.push(
    MicrosoftEntraID({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      issuer: `https://login.microsoftonline.com/${TENANT_ID}/v2.0`,
      authorization: {
        params: {
          scope: 'openid profile email offline_access User.Read Mail.Send',
          tenant: TENANT_ID,
        },
      },
    })
  );
}

// ---- Email / Password credentials ----
providers.push(
  Credentials({
    name: 'credentials',
    credentials: {
      email:    { label: 'Email',    type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) return null;

      const supabase = getSupabase();
      const { data: user } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, department, avatar_url, password_hash')
        .eq('email', credentials.email)
        .eq('is_active', true)
        .single();

      if (!user) return null;

      // If no password set yet, deny
      if (!user.password_hash) return null;

      const valid = await bcrypt.compare(
        credentials.password as string,
        user.password_hash as string
      );
      if (!valid) return null;

      return {
        id: user.id,
        email: user.email,
        name: user.full_name,
        image: user.avatar_url,
      };
    },
  })
);

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers,

  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email) return false;

      // Only run Supabase upsert for OAuth (Microsoft) sign-ins
      if (account?.provider === 'microsoft-entra-id') {
        try {
          const supabase = getSupabase();
          const microsoftProfile = profile as Record<string, unknown>;
          const { error } = await supabase.from('profiles').upsert(
            {
              id: user.id ?? crypto.randomUUID(),
              email: user.email,
              full_name:
                (microsoftProfile?.displayName as string) ||
                user.name ||
                user.email,
              avatar_url: user.image ?? undefined,
              microsoft_id: account?.providerAccountId,
              is_active: true,
              last_seen_at: new Date().toISOString(),
            },
            { onConflict: 'email', ignoreDuplicates: false }
          );
          if (error) {
            console.error('[Auth] Profile upsert error:', error);
            return false;
          }
        } catch (err) {
          console.error('[Auth] Sign-in callback error:', err);
          return false;
        }
      }
      return true;
    },

    async jwt({ token, account }) {
      if (account) {
        token.microsoftAccessToken = account.access_token;
        token.microsoftId = account.providerAccountId;
      }

      // Embed Supabase role/department into JWT
      if (token.email) {
        try {
          const supabase = getSupabase();
          const { data: p } = await supabase
            .from('profiles')
            .select('id, role, department, full_name, full_name_ar, avatar_url')
            .eq('email', token.email as string)
            .single();

          if (p) {
            token.supabaseId   = p.id;
            token.role         = p.role;
            token.department   = p.department;
            token.fullName     = p.full_name;
            token.fullNameAr   = p.full_name_ar;
            token.avatarUrl    = p.avatar_url;
          }
        } catch { /* Supabase not yet configured – skip */ }
      }

      return token;
    },

    async session({ session, token }) {
      return {
        ...session,
        microsoftAccessToken: token.microsoftAccessToken as string,
        user: {
          ...session.user,
          supabaseId:  token.supabaseId  as string,
          microsoftId: token.microsoftId as string,
          role:        token.role        as string,
          department:  token.department  as string,
          fullName:    token.fullName    as string,
          fullNameAr:  token.fullNameAr  as string,
          avatarUrl:   token.avatarUrl   as string,
        },
      };
    },
  },

  pages: {
    signIn: '/login',
    error:  '/login',
  },

  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60,
  },
});

// Type augmentation
declare module 'next-auth' {
  interface Session {
    microsoftAccessToken?: string;
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      supabaseId?:  string;
      microsoftId?: string;
      role?:        string;
      department?:  string;
      fullName?:    string;
      fullNameAr?:  string;
      avatarUrl?:   string;
    };
  }
}
