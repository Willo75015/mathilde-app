// Test Supabase avec debug complet
import { createClient } from '@supabase/supabase-js'

// Variables depuis .env (hardcodées pour test)
const supabaseUrl = 'https://rbrvadxfeausahjzyyih.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJicnZhZHhmZWF1c2Foanp5eWpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNDgzNjcsImV4cCI6MjA2ODkyNDM2N30.41Pu0jDwJGVrHpch3xWTKTZMkzedcnlx_cVhls8tn4Y'

console.log('🌸 Test de liaison Supabase - Mathilde Fleurs')
console.log('=' .repeat(50))
console.log('URL:', supabaseUrl)
console.log('Key présente:', supabaseKey ? '✅' : '❌')
console.log()

const supabase = createClient(supabaseUrl, supabaseKey, {
  db: {
    schema: 'public'
  },
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function testBasic() {
  console.log('🔍 Test de base...')
  
  try {
    // Test simple avec la table flowers
    const { data, error } = await supabase
      .from('flowers')
      .select('id, name')
      .limit(1)
    
    if (error) {
      console.log('❌ Erreur:', error.message)
      console.log('Code:', error.code)
      console.log('Details:', error.details || 'Aucun détail')
      return false
    }
    
    console.log('✅ Connexion réussie!')
    console.log('📊 Fleurs trouvées:', data?.length || 0)
    if (data && data.length > 0) {
      console.log('Premier élément:', data[0])
    }
    
    return true
  } catch (err) {
    console.log('❌ Erreur critique:', err.message)
    console.log('Stack:', err.stack?.slice(0, 200) + '...')
    return false
  }
}

async function testTables() {
  console.log('\n📋 Test des tables...')
  
  const tables = ['flowers', 'clients', 'events']
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('count', { count: 'exact' })
        .limit(1)
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`)
      } else {
        console.log(`✅ ${table}: Accessible`)
      }
    } catch (err) {
      console.log(`❌ ${table}: Erreur - ${err.message}`)
    }
  }
}

async function main() {
  const basicTest = await testBasic()
  
  if (basicTest) {
    await testTables()
    console.log('\n🎉 Supabase est correctement lié à l\'app!')
    console.log('   Tu peux maintenant utiliser toutes les fonctionnalités.')
  } else {
    console.log('\n⚠️  Problème de configuration détecté')
    console.log('   Vérifier:')
    console.log('   - La connexion internet')
    console.log('   - Les credentials Supabase')
    console.log('   - Le schéma de base de données')
  }
  
  console.log('=' .repeat(50))
}

main().catch(console.error)
