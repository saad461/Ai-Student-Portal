import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

if (typeof window !== 'undefined' && supabaseUrl === 'https://placeholder.supabase.co') {
  console.warn('Supabase URL is missing. Please set NEXT_PUBLIC_SUPABASE_URL in your environment variables.');
}

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
