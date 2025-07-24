import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

// Configuration Supabase - MISE À JOUR
const supabaseUrl = 'https://vhsfxihxubcdjyrsdkyn.subabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZoc2Z4aWh4dWJjZGp5cnNka3luIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNjkwMjYsImV4cCI6MjA2ODk0NTAyNn0._rK18ZtyMRTPpvarnYidO18-f5OuDgmnfdWXs21p88c'

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
