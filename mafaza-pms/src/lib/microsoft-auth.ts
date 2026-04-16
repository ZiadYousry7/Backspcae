// =============================================================
// Microsoft Azure AD / Microsoft 365 SSO Integration
// Uses Next-Auth v5 (beta) with Azure AD provider
// =============================================================

import NextAuth from 'next-auth';
import MicrosoftEntraID from 'next-auth/providers/microsoft-entra-id';
import { createServiceClient } from './supabase';

const TENANT_ID = process.env.AZURE_AD_TENANT_ID ?? 'common';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    MicrosoftEntraID({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      // Set the tenant-specific issuer URL
      issuer: `https://login.microsoftonline.com/${TENANT_ID}/v2.0`,
      authorization: {
        params: {
          scope: 'openid profile email offline_access User.Read Mail.Send',
          tenant: TENANT_ID,
        },
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email) return false;

      try {
        const supabase = createServiceClient();

        // Upsert the user profile in Supabase
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

        return true;
      } catch (err) {
        console.error('[Auth] Sign-in callback error:', err);
        return false;
      }
    },

    async jwt({ token, account, profile }) {
      if (account) {
        token.microsoftAccessToken = account.access_token;
        token.microsoftId = account.providerAccountId;
        token.microsoftRefreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
      }

      // Fetch Supabase profile to embed role
      if (token.email) {
        const supabase = createServiceClient();
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('id, role, department, full_name, full_name_ar, avatar_url')
          .eq('email', token.email as string)
          .single();

        if (userProfile) {
          token.supabaseId = userProfile.id;
          token.role = userProfile.role;
          token.department = userProfile.department;
          token.fullName = userProfile.full_name;
          token.fullNameAr = userProfile.full_name_ar;
          token.avatarUrl = userProfile.avatar_url;
        }
      }

      return token;
    },

    async session({ session, token }) {
      return {
        ...session,
        microsoftAccessToken: token.microsoftAccessToken as string,
        user: {
          ...session.user,
          supabaseId: token.supabaseId as string,
          microsoftId: token.microsoftId as string,
          role: token.role as string,
          department: token.department as string,
          fullName: token.fullName as string,
          fullNameAr: token.fullNameAr as string,
          avatarUrl: token.avatarUrl as string,
        },
      };
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 hours (work day)
  },
});

// Extend NextAuth types
declare module 'next-auth' {
  interface Session {
    microsoftAccessToken?: string;
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      supabaseId?: string;
      microsoftId?: string;
      role?: string;
      department?: string;
      fullName?: string;
      fullNameAr?: string;
      avatarUrl?: string;
    };
  }
}
