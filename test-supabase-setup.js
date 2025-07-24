// Script de test et setup Supabase
import { supabase } from './src/lib/supabase.ts'

console.log('🚀 Configuration Supabase - Mathilde Fleurs')
console.log('='.repeat(50))

// Vérifier les variables d'environnement
console.log('📋 Variables d\'environnement:')
console.log(`   URL: ${process.env.VITE_SUPABASE_URL || 'NON DÉFINIE'}`)
console.log(`   ANON_KEY: ${process.env.VITE_SUPABASE_ANON_KEY ? 'DÉFINIE' : 'NON DÉFINIE'}`)
console.log()

async function testConnection() {
  console.log('🔍 Test de connexion...')
  
  try {
    // Test simple de connexion
    const { data, error, count } = await supabase
      .from('flowers')
      .select('id', { count: 'exact' })
      .limit(1)
    
    if (error) {
      console.log('❌ Erreur connexion:', error.message)
      return false
    }
    
    console.log(`✅ Connexion OK! ${count || 0} fleurs dans la base`)
    return true
  } catch (err) {
    console.log('❌ Erreur critique:', err.message)
    return false
  }
}

async function testTables() {
  console.log('📊 Test des tables...')
  
  const tables = ['clients', 'flowers', 'events']
  
  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('id', { count: 'exact' })
        .limit(1)
      
      if (error) {
        console.log(`❌ Table ${table}: ${error.message}`)
      } else {
        console.log(`✅ Table ${table}: ${count || 0} entrées`)
      }
    } catch (err) {
      console.log(`❌ Table ${table}: Erreur critique`)
    }
  }
}

async function main() {
  const connected = await testConnection()
  
  if (connected) {
    await testTables()
    console.log()
    console.log('🎉 Supabase est correctement configuré!')
    console.log('   Tu peux maintenant utiliser l\'app avec la base de données.')
  } else {
    console.log()
    console.log('⚠️  Configuration requise:')
    console.log('   1. Vérifier les variables d\'environnement')
    console.log('   2. Appliquer le schéma SQL')
    console.log('   3. Configurer les politiques RLS')
  }
  
  console.log('='.repeat(50))
}

main().catch(console.error)
