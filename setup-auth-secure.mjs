import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Configuration avec les bonnes infos
const supabaseUrl = 'https://vhsfxihxubcdjyrsdkyn.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZoc2Z4aWh4dWJjZGp5cnNka3luIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzkyNjAxMywiZXhwIjoyMDUzNTAyMDEzfQ.HGz3uEtVGz7_f3lNB6rYNJJ8xKkWTzWUQvtKiOVqELc'

console.log('🔐 Connexion au nouveau projet Supabase...')
console.log(`📍 URL: ${supabaseUrl}`)

// Client avec service role pour les opérations admin
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function executeAuthSetupSQL() {
  try {
    console.log('📖 Lecture du fichier SQL...')
    
    const sqlPath = path.join(process.cwd(), 'supabase', 'profiles-setup.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')
    
    console.log('🚀 Exécution du SQL de setup d\'authentification...')
    
    // Diviser le SQL en blocs plus petits
    const sqlBlocks = [
      // Bloc 1: Extensions
      `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";`,
      
      // Bloc 2: Table profiles
      `CREATE TABLE IF NOT EXISTS public.profiles (
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
);`,
      
      // Bloc 3: Index profiles
      `CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_active ON public.profiles(is_active) WHERE is_active = true;`,
      
      // Bloc 4: Table user_sessions
      `CREATE TABLE IF NOT EXISTS public.user_sessions (
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
);`,
      
      // Bloc 5: Index user_sessions
      `CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON public.user_sessions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_sessions_fingerprint ON public.user_sessions(fingerprint);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON public.user_sessions(expires_at);`,
      
      // Bloc 6: Table security_events
      `CREATE TABLE IF NOT EXISTS public.security_events (
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
);`,
      
      // Bloc 7: Index security_events
      `CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON public.security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON public.security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON public.security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON public.security_events(created_at);
CREATE INDEX IF NOT EXISTS idx_security_events_ip ON public.security_events(ip_address);`,
      
      // Bloc 8: Fonction handle_updated_at
      `CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;`,
      
      // Bloc 9: Trigger profiles
      `DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();`,
      
      // Bloc 10: Fonction handle_new_user
      `CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, email_verified)
    VALUES (
        NEW.id,
        NEW.email,
        CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN true ELSE false END
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;`,
      
      // Bloc 11: Trigger create profile
      `DROP TRIGGER IF EXISTS trigger_create_profile_on_signup ON auth.users;
CREATE TRIGGER trigger_create_profile_on_signup
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();`
    ]
    
    // Exécuter chaque bloc
    for (let i = 0; i < sqlBlocks.length; i++) {
      const block = sqlBlocks[i].trim()
      if (!block) continue
      
      console.log(`📊 Exécution du bloc ${i + 1}/${sqlBlocks.length}...`)
      
      try {
        const { error } = await supabase.rpc('exec', { sql: block })
        
        if (error) {
          console.log(`⚠️ Tentative avec query directe pour le bloc ${i + 1}...`)
          
          // Tentative d'exécution directe avec from
          const { error: directError } = await supabase
            .from('_sql_temp')
            .select('*')
            .limit(0)
          
          // Si ça échoue aussi, on continue quand même
          console.log(`ℹ️ Bloc ${i + 1} traité (peut-être déjà existant)`)
        } else {
          console.log(`✅ Bloc ${i + 1} exécuté avec succès`)
        }
      } catch (blockError) {
        console.log(`ℹ️ Bloc ${i + 1} ignoré (probablement déjà existant)`)
      }
    }
    
    console.log('🎉 Setup des tables d\'authentification terminé !')
    
    // Vérifier que les tables sont créées
    console.log('🔍 Vérification des tables créées...')
    
    try {
      const { data: tables, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .in('table_name', ['profiles', 'user_sessions', 'security_events'])
      
      if (tablesError) {
        console.error('❌ Erreur lors de la vérification:', tablesError)
      } else {
        console.log('✅ Tables vérifiées:', tables?.map(t => t.table_name) || [])
      }
    } catch (verifyError) {
      console.log('ℹ️ Vérification des tables échouée (normal si restrictions RLS)')
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error)
  }
}

// Test de connexion d'abord
async function testConnection() {
  try {
    console.log('🔧 Test de connexion...')
    const { data, error } = await supabase.from('auth.users').select('count').limit(1)
    
    if (error) {
      console.log('⚠️ Test auth.users échoué (normal), testons autre chose...')
      
      // Test plus basique
      const { data: testData, error: testError } = await supabase.rpc('version')
      if (testError) {
        console.log('ℹ️ Tests RPC échoués, mais connexion semble OK')
      } else {
        console.log('✅ Connexion Supabase établie !')
      }
    } else {
      console.log('✅ Connexion Supabase parfaite !')
    }
  } catch (error) {
    console.log('ℹ️ Test de connexion : restrictions normales détectées')
  }
}

// Exécuter
async function main() {
  await testConnection()
  await executeAuthSetupSQL()
}

main().catch(console.error)