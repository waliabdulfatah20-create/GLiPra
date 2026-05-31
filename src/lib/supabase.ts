import type { Database } from '@/types/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

import Env from 'env';

function createSupabaseClient() {
  const supabaseUrl = Env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = Env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase env vars. Check EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env.development (or current env file).',
    );
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
}

let _supabase: ReturnType<typeof createSupabaseClient> | null = null;

export const supabase = new Proxy<ReturnType<typeof createSupabaseClient>>(
  {},
  {
    get: (_, prop) => {
      if (!_supabase) {
        _supabase = createSupabaseClient();
      }
      return (_supabase as any)[prop];
    },
  },
) as ReturnType<typeof createSupabaseClient>;
