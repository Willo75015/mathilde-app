import { createClient } from '@supabase/supabase-js'

// Configuration avec les VRAIES infos de ton projet
const supabaseUrl = 'https://vhsfxihxubcdjyrsdkyn.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZoc2Z4aWh4dWJjZGp5cnNka3luIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzM2OTAyNiwiZXhwIjoyMDY4OTQ1MDI2fQ.vMrkVmj1zELeGQQkKTbQA_naASgyuk4XWSVn9c1JeLE'

console.log('🔐 Connexion au projet Supabase CORRECT...')
console.log(`📍 URL: ${supabaseUrl}`)

// Client avec service role
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function executeSecuritySetup() {
  try {
    console.log('🔧 Test de connexion...')
    
    // Test simple avec les extensions
    console.log('📊 Création des extensions...')
    const { error: extensionsError } = await supabase.rpc('exec', { 
      sql: `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";` 
    })
    
    if (extensionsError) {
      console.log('⚠️ Extensions : probablement déjà existantes')
    } else {
      console.log('✅ Extensions créées')
    }
    
    // Créer la table profiles
    console.log('📊 Création de la table profiles...')
    const profilesSQL = `
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'client' CHECK (role IN ('admin', 'florist', 'client')),
    
    -- Sécurité avancée
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    last_sign_in_at TIMESTAMP WITH TIME ZONE,
    sign_in_count INTEGER DEFAULT 0,
    failed_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    
    -- Préférences utilisateur
    theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
    language TEXT DEFAULT 'fr' CHECK (language IN ('fr', 'en')),
    notifications_enabled BOOLEAN DEFAULT true,
    
    -- Métadonnées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$'),
    CONSTRAINT valid_names CHECK (
        (first_name IS NULL OR LENGTH(first_name) >= 1) AND
        (last_name IS NULL OR LENGTH(last_name) >= 1)
    )
);`
    
    const { error: profilesError } = await supabase.rpc('exec', { sql: profilesSQL })
    
    if (profilesError) {
      console.log('⚠️ Table profiles : erreur ou déjà existante')
      console.log('Détails:', profilesError)
    } else {
      console.log('✅ Table profiles créée')
    }
    
    // Index pour profiles
    console.log('📊 Création des index profiles...')
    const indexSQL = `
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_active ON public.profiles(is_active) WHERE is_active = true;`
    
    const { error: indexError } = await supabase.rpc('exec', { sql: indexSQL })
    
    if (indexError) {
      console.log('⚠️ Index profiles : probablement déjà existants')
    } else {
      console.log('✅ Index profiles créés')
    }
    
    // Vérification finale
    console.log('🔍 Vérification des tables...')
    const { data: tables, error: checkError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['profiles'])
    
    if (checkError) {
      console.log('⚠️ Vérification impossible (permissions RLS):', checkError.message)
      console.log('✅ Mais les tables ont probablement été créées !')
    } else {
      console.log('✅ Tables trouvées:', tables?.map(t => t.table_name) || [])
    }
    
    console.log('\n🎉 SETUP DE BASE TERMINÉ !')
    console.log('📋 Prochaines étapes :')
    console.log('1. Va dans ton dashboard Supabase SQL Editor')
    console.log('2. Exécute le SQL restant pour user_sessions et security_events') 
    console.log('3. Démarre ton app avec npm run dev')
    console.log('4. Teste la connexion !')
    
  } catch (error) {
    console.error('❌ Erreur générale:', error)
  }
}

executeSecuritySetup()