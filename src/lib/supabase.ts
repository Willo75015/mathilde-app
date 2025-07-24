import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

// Configuration Supabase depuis les variables d'environnement
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Les variables d\'environnement Supabase sont manquantes')
}

// Client Supabase avec retry automatique
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-application-name': 'mathilde-fleurs'
    }
  }
})

// Helper pour gérer les erreurs Supabase
export const handleSupabaseError = (error: any) => {
  console.error('Erreur Supabase:', error)
  
  if (error?.message?.includes('JWT')) {
    return 'Session expirée, veuillez vous reconnecter'
  }
  
  if (error?.message?.includes('duplicate')) {
    return 'Cette donnée existe déjà'
  }
  
  if (error?.message?.includes('violates foreign key')) {
    return 'Référence invalide'
  }
  
  return error?.message || 'Une erreur est survenue'
}

// Types helpers
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
