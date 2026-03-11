import { createClient } from '@supabase/supabase-js'

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'public-anon-key'

// Debug build-time env injection
console.log(
  "BUILD_TIME_CHECK: URL is ",
  import.meta.env.VITE_SUPABASE_URL
)

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
)