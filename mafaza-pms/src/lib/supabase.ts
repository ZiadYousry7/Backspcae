import { createBrowserClient } from '@supabase/ssr';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from './database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Browser client (singleton)
export const createClient = () =>
  createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);

// Server client (per-request, reads cookies)
export const createServerSupabaseClient = async () => {
  const cookieStore = await cookies();
  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Server Component – cookies can't be set here, handled by middleware
        }
      },
    },
  });
};

// Service-role client for server-side privileged operations
export const createServiceClient = () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createClient: sc } = require('@supabase/supabase-js') as typeof import('@supabase/supabase-js');
  return sc(
    supabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
};
