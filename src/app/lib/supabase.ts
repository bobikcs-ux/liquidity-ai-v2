import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Debug: Log initialization status
console.info(
  'SUPABASE_INIT: URL is',
  supabaseUrl ? 'DEFINED' : 'UNDEFINED',
  '| ANON_KEY is',
  supabaseAnonKey ? 'DEFINED' : 'UNDEFINED'
)

// Create singleton client only if credentials are available
let _supabase: SupabaseClient | null = null

if (supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('placeholder')) {
  _supabase = createClient(supabaseUrl, supabaseAnonKey)
  console.info('SUPABASE_INIT: Client created successfully')
} else {
  console.warn('SUPABASE_INIT: Missing credentials, client NOT created')
}

// Export singleton (may be null if no credentials)
export const supabase = _supabase

// Health check function for real connectivity test
export async function checkSupabaseHealth(): Promise<boolean> {
  if (!_supabase) return false
  
  try {
    const { data, error } = await _supabase
      .from('market_data_live')
      .select('count', { count: 'exact', head: true })
    
    if (error) {
      // Table might not exist, try fallback table
      const { error: fallbackError } = await _supabase
        .from('market_snapshots')
        .select('count', { count: 'exact', head: true })
      
      return !fallbackError
    }
    
    return true
  } catch {
    return false
  }
}
