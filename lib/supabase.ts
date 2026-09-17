import { createBrowserClient } from '@supabase/ssr';

export function supabaseEnv() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = supabaseEnv();
  return Boolean(url && anonKey && !url.includes('placeholder'));
}

export function createClient() {
  const { url, anonKey } = supabaseEnv();
  return createBrowserClient(
    url ?? 'https://placeholder.supabase.co',
    anonKey ?? 'placeholder'
  );
}
