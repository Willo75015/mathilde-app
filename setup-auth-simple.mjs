import { createClient } from '@supabase/supabase-js'

// Configuration depuis ton .env
const supabaseUrl = 'https://rbrvadxfeausahjzyyih.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJicnZhZHhmZWF1c2Foanp5eWpoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzM0ODM2NywiZXhwIjoyMDY4OTI0MzY3fQ.ZplDbII_3BZE6ZPR0o46sJ0ZFmAANFRN60JP7UcOiJQ'

console.log('🔐 Connexion à Supabase...')

// Client avec service role
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function setupAuthSecurity() {
  console.log('🚀 Création des extensions...')
  
  // ÉTAPE 1: Extensions
  const { error: extError } = await supabase.rpc('exec', {
    sql: `
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";
    `
  })
  
  if (extError) {
    console.log('ℹ️ Extensions (probablement déjà installées):', extError.message)
  } else {
    console.log('✅ Extensions créées')
  }
  
  // ÉTAPE 2: Table profiles
  console.log('📊 Création de la table profiles...')
  
  const { error: profilesError } = await supabase.rpc('exec', {
    sql: `
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
      );
    `
  })
  
  if (profilesError) {
    console.error('❌ Erreur profiles:', profilesError)
  } else {
    console.log('✅ Table profiles créée')
  }
  
  // ÉTAPE 3: Index profiles
  console.log('📈 Création des index pour profiles...')
  
  const { error: indexError } = await supabase.rpc('exec', {
    sql: `
      CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
      CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
      CREATE INDEX IF NOT EXISTS idx_profiles_active ON public.profiles(is_active) WHERE is_active = true;
    `
  })
  
  if (indexError) {
    console.log('ℹ️ Index profiles:', indexError.message)
  } else {
    console.log('✅ Index profiles créés')
  }
  
  // ÉTAPE 4: Table user_sessions
  console.log('🔐 Création de la table user_sessions...')
  
  const { error: sessionsError } = await supabase.rpc('exec', {
    sql: `
      CREATE TABLE IF NOT EXISTS public.user_sessions (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
          
          -- Données de session
          session_token TEXT,
          fingerprint TEXT,
          ip_address INET,
          user_agent TEXT,
          
          -- Géolocalisation
          country TEXT,
          city TEXT,
          
          -- État de la session
          is_active BOOLEAN DEFAULT true,
          signed_out_at TIMESTAMP WITH TIME ZONE,
          
          -- Sécurité
          failed_attempts INTEGER DEFAULT 0,
          last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          
          -- Timestamps
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days')
      );
    `
  })
  
  if (sessionsError) {
    console.error('❌ Erreur user_sessions:', sessionsError)
  } else {
    console.log('✅ Table user_sessions créée')
  }
  
  // ÉTAPE 5: Index user_sessions
  const { error: sessionsIndexError } = await supabase.rpc('exec', {
    sql: `
      CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON public.user_sessions(is_active) WHERE is_active = true;
      CREATE INDEX IF NOT EXISTS idx_user_sessions_fingerprint ON public.user_sessions(fingerprint);
      CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON public.user_sessions(expires_at);
    `
  })
  
  if (sessionsIndexError) {
    console.log('ℹ️ Index sessions:', sessionsIndexError.message)
  } else {
    console.log('✅ Index user_sessions créés')
  }
  
  // ÉTAPE 6: Table security_events
  console.log('🛡️ Création de la table security_events...')
  
  const { error: securityError } = await supabase.rpc('exec', {
    sql: `
      CREATE TABLE IF NOT EXISTS public.security_events (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
          
          -- Type d'événement
          event_type TEXT NOT NULL CHECK (event_type IN (
              'login_success', 'login_failed', 'logout', 'password_reset',
              'account_locked', 'suspicious_activity', 'token_refresh',
              'rate_limit_exceeded', 'unauthorized_access'
          )),
          
          -- Détails de l'événement
          severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
          message TEXT,
          metadata JSONB DEFAULT '{}',
          
          -- Contexte technique
          ip_address INET,
          user_agent TEXT,
          fingerprint TEXT,
          
          -- Timestamp
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
  })
  
  if (securityError) {
    console.error('❌ Erreur security_events:', securityError)
  } else {
    console.log('✅ Table security_events créée')
  }
  
  // ÉTAPE 7: Index security_events
  const { error: securityIndexError } = await supabase.rpc('exec', {
    sql: `
      CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON public.security_events(user_id);
      CREATE INDEX IF NOT EXISTS idx_security_events_type ON public.security_events(event_type);
      CREATE INDEX IF NOT EXISTS idx_security_events_severity ON public.security_events(severity);
      CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON public.security_events(created_at);
      CREATE INDEX IF NOT EXISTS idx_security_events_ip ON public.security_events(ip_address);
    `
  })
  
  if (securityIndexError) {
    console.log('ℹ️ Index security:', securityIndexError.message)
  } else {
    console.log('✅ Index security_events créés')
  }
  
  console.log('🎉 Setup des tables d\'authentification terminé!')
  
  // Vérification finale
  console.log('🔍 Vérification des tables...')
  
  const { data: tables, error: checkError } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .in('table_name', ['profiles', 'user_sessions', 'security_events'])
  
  if (checkError) {
    console.error('❌ Erreur vérification:', checkError)
  } else {
    console.log('✅ Tables créées:', tables?.map(t => t.table_name) || [])
  }
}

// Exécuter le setup
setupAuthSecurity().catch(console.error)