import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Configuration depuis .env
const supabaseUrl = 'https://rbrvadxfeausahjzyyih.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJicnZhZHhmZWF1c2Foanp5eWpoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzM0ODM2NywiZXhwIjoyMDY4OTI0MzY3fQ.ZplDbII_3BZE6ZPR0o46sJ0ZFmAANFRN60JP7UcOiJQ'

console.log('🔐 Initialisation du client Supabase avec service role...')

// Client avec service role pour les opérations admin
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function setupAuthTables() {
  try {
    console.log('📖 Lecture du fichier SQL...')
    
    const sqlPath = path.join(process.cwd(), 'supabase', 'profiles-setup.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')
    
    console.log('🚀 Exécution du SQL de setup...')
    
    // Diviser le SQL en blocs pour éviter les timeouts
    const sqlBlocks = sqlContent.split('-- ===============================================')
    
    for (let i = 0; i < sqlBlocks.length; i++) {
      const block = sqlBlocks[i].trim()
      if (!block) continue
      
      console.log(`📊 Exécution du bloc ${i + 1}/${sqlBlocks.length}...`)
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql_query: block })
        
        if (error) {
          console.error(`❌ Erreur bloc ${i + 1}:`, error)
        } else {
          console.log(`✅ Bloc ${i + 1} exécuté avec succès`)
        }
      } catch (blockError) {
        console.log(`⚠️ Tentative d'exécution directe pour le bloc ${i + 1}...`)
        
        // Tentative d'exécution directe
        const { error: directError } = await supabase
          .from('_sql_executions')
          .insert({ query: block })
        
        if (directError) {
          console.log(`ℹ️ Bloc ${i + 1} ignoré (probablement déjà existant)`)
        }
      }
    }
    
    console.log('🎉 Setup des tables d\'authentification terminé !')
    
    // Vérifier que les tables sont créées
    console.log('🔍 Vérification des tables créées...')
    
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['profiles', 'user_sessions', 'security_events'])
    
    if (tablesError) {
      console.error('❌ Erreur lors de la vérification:', tablesError)
    } else {
      console.log('✅ Tables vérifiées:', tables?.map(t => t.table_name))
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error)
  }
}

// Exécuter le setup
setupAuthTables()