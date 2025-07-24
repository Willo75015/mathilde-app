// Test rapide de connexion Supabase
import { supabase } from './lib/supabase'

export const testSupabaseConnection = async () => {
  console.log('🔍 Test de connexion Supabase...')
  
  try {
    // Test 1: Vérifier la connexion
    const { data, error } = await supabase.from('flowers').select('count')
    
    if (error) {
      console.error('❌ Erreur de connexion:', error.message)
      return false
    }
    
    console.log('✅ Connexion Supabase OK!')
    
    // Test 2: Vérifier l'auth
    const { data: { session } } = await supabase.auth.getSession()
    console.log('🔐 Session:', session ? 'Active' : 'Aucune')
    
    return true
  } catch (err) {
    console.error('❌ Erreur générale:', err)
    return false
  }
}

// Lancer le test au chargement (dev only)
if (import.meta.env.DEV) {
  testSupabaseConnection()
}
