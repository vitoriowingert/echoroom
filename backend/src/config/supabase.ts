import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from './env';

export const supabaseClient: SupabaseClient = createClient(
  env.supabaseUrl,
  env.supabaseKey
);

export const supabaseAdminClient: SupabaseClient = createClient(
  env.supabaseUrl,
  env.supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

