import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder';

// Browser / Client Component client
export const createClient = () =>
  createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);

// Service-role client (server-side only, never import in client components)
export const createServiceClient = () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createClient: sc } = require('@supabase/supabase-js') as typeof import('@supabase/supabase-js');
  return sc(
    supabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder',
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
};
