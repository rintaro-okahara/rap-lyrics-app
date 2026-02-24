import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

const WebStorageAdapter = {
  getItem: (key: string) => Promise.resolve(globalThis?.localStorage?.getItem(key) ?? null),
  setItem: (key: string, value: string) => {
    globalThis?.localStorage?.setItem(key, value);
    return Promise.resolve();
  },
  removeItem: (key: string) => {
    globalThis?.localStorage?.removeItem(key);
    return Promise.resolve();
  },
};

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string, {
      auth: {
        storage: WebStorageAdapter as any,
        flowType: 'pkce',
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;
