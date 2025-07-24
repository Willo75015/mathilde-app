import { supabase } from './src/lib/supabase.js'

console.log('🔍 Test de liaison Supabase...')
console.log('URL:', process.env.VITE_SUPABASE_URL || 'Non définie')

async function testSupabase() {
  try {
    // Test 1: Connexion simple
    const { data, error } = await supabase
      .from('flowers')
      .select('*')
      .limit(1)
    
    if (error) {
      console.log('❌ Erreur:', error.message)
      return false
    }
    
    console.log('✅ Connexion Supabase réussie!')
    console.log('Données:', data)
    
    return true
  } catch (err) {
    console.log('❌ Erreur de test:', err.message)
    return false
  }
}

testSupabase()
