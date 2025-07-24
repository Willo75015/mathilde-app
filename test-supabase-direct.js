// Test direct de Supabase
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

console.log('🔍 Test de liaison Supabase...')
console.log('URL:', supabaseUrl)
console.log('Key:', supabaseKey ? 'Définie' : 'Non définie')

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Variables manquantes')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  try {
    console.log('📡 Test de connexion...')
    
    const { data, error } = await supabase
      .from('flowers')
      .select('*')
      .limit(1)
    
    if (error) {
      console.log('❌ Erreur Supabase:', error.message)
      return
    }
    
    console.log('✅ Connexion réussie!')
    console.log('Données:', data?.length || 0, 'fleurs trouvées')
    
    // Test des autres tables
    const tables = ['clients', 'events']
    for (const table of tables) {
      const { data: tableData, error: tableError } = await supabase
        .from(table)
        .select('count', { count: 'exact' })
        .limit(1)
      
      if (tableError) {
        console.log(`❌ Table ${table}:`, tableError.message)
      } else {
        console.log(`✅ Table ${table}: OK`)
      }
    }
    
  } catch (err) {
    console.log('❌ Erreur générale:', err.message)
  }
}

test()
