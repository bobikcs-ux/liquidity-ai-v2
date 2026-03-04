import { createClient } from '@supabase/supabase-js';

// Use NEXT_PUBLIC_ prefixed env vars for Vercel deployment
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 
  (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_SUPABASE_URL : undefined);
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 
  (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY : undefined);

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[v0] Supabase credentials not found. Checking environment...');
  console.warn('[v0] VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL ? 'SET' : 'NOT SET');
  console.warn('[v0] NEXT_PUBLIC_SUPABASE_URL:', typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET');
} else {
  console.log('[v0] Supabase client initialized with URL:', supabaseUrl);
}

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
