import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

// Configuration Supabase pour production
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Variables d\'environnement Supabase manquantes. Vérifiez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY'
  )
}

// Client Supabase configuré avec les bonnes options
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  global: {
    headers: {
      'x-application-name': 'Mathilde-Fleurs-App'
    }
  }
})

// Helper pour les requêtes avec gestion d'erreur
export const handleSupabaseError = (error: any) => {
  console.error('Erreur Supabase:', error)
  return {
    success: false,
    error: error.message || 'Erreur de connexion à la base de données'
  }
}

// Export des types Supabase
export type { Database } from '@/types/supabase'
