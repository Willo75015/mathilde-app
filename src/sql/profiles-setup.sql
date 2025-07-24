-- =============================================================================
-- SYSTÈME D'AUTHENTIFICATION ET PROFILS UTILISATEURS - MATHILDE FLEURS
-- =============================================================================

-- Créer la table des profils utilisateurs
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Informations de base
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  username TEXT UNIQUE,
  avatar_url TEXT,
  
  -- Informations de contact
  phone TEXT,
  website TEXT,
  
  -- Préférences utilisateur
  preferences JSONB DEFAULT '{
    "theme": "system",
    "language": "fr",
    "notifications": {
      "email": true,
      "push": true,
      "reminders": true
    },
    "dashboard": {
      "defaultView": "calendar",
      "showWelcome": true
    }
  }'::jsonb,
  
  -- Métadonnées
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'florist', 'user', 'client')),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  login_count INTEGER DEFAULT 0,
  
  -- Contraintes
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT valid_phone CHECK (phone IS NULL OR phone ~* '^\+?[1-9]\d{1,14}$'),
  CONSTRAINT valid_website CHECK (website IS NULL OR website ~* '^https?://.*')
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS profiles_email_idx ON profiles(email);
CREATE INDEX IF NOT EXISTS profiles_username_idx ON profiles(username);
CREATE INDEX IF NOT EXISTS profiles_role_idx ON profiles(role);
CREATE INDEX IF NOT EXISTS profiles_active_idx ON profiles(is_active);

-- Fonction pour mettre à jour le timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour auto-update du timestamp
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- FONCTION AUTO-CRÉATION PROFIL LORS DE L'INSCRIPTION
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    username
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'username'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer automatiquement un profil
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- POLITIQUES RLS (ROW LEVEL SECURITY)
-- =============================================================================

-- Activer RLS sur la table profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Politique : Les utilisateurs peuvent voir leur propre profil
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Politique : Les utilisateurs peuvent modifier leur propre profil
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Politique : Les admins peuvent tout voir
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Politique : Les admins peuvent tout modifier
CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================================================
-- TABLE DES SESSIONS UTILISATEUR (pour analytics)
-- =============================================================================

CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE,
  
  -- Informations de session
  ip_address INET,
  user_agent TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  
  -- Durée et activité
  duration_seconds INTEGER,
  pages_visited INTEGER DEFAULT 0,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS user_sessions_user_id_idx ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS user_sessions_created_at_idx ON user_sessions(created_at);

-- RLS pour les sessions
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions" ON user_sessions
  FOR SELECT USING (user_id = auth.uid());

-- =============================================================================
-- VUES UTILES
-- =============================================================================

-- Vue pour les statistiques utilisateurs (admin only)
CREATE OR REPLACE VIEW admin_user_stats AS
SELECT 
  p.id,
  p.email,
  p.first_name,
  p.last_name,
  p.role,
  p.is_active,
  p.created_at,
  p.last_login,
  p.login_count,
  COUNT(us.id) as total_sessions,
  AVG(us.duration_seconds) as avg_session_duration,
  MAX(us.created_at) as last_session
FROM profiles p
LEFT JOIN user_sessions us ON p.id = us.user_id
GROUP BY p.id, p.email, p.first_name, p.last_name, p.role, p.is_active, p.created_at, p.last_login, p.login_count;

-- Vue pour le profil utilisateur complet
CREATE OR REPLACE VIEW user_profile_complete AS
SELECT 
  p.*,
  COUNT(us.id) as session_count,
  MAX(us.created_at) as last_session_date
FROM profiles p
LEFT JOIN user_sessions us ON p.id = us.user_id
WHERE p.id = auth.uid()
GROUP BY p.id;

-- =============================================================================
-- FONCTIONS UTILITAIRES
-- =============================================================================

-- Fonction pour mettre à jour le dernier login
CREATE OR REPLACE FUNCTION update_last_login(user_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE profiles 
  SET 
    last_login = NOW(),
    login_count = login_count + 1
  WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour créer une session utilisateur
CREATE OR REPLACE FUNCTION create_user_session(
  user_uuid UUID,
  ip_addr TEXT DEFAULT NULL,
  user_agent_str TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  session_id UUID;
BEGIN
  INSERT INTO user_sessions (user_id, ip_address, user_agent)
  VALUES (user_uuid, ip_addr::inet, user_agent_str)
  RETURNING id INTO session_id;
  
  RETURN session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- DONNÉES INITIALES (optionnel)
-- =============================================================================

-- Créer un profil admin par défaut si besoin
-- INSERT INTO profiles (
--   id,
--   email,
--   first_name,
--   last_name,
--   username,
--   role
-- ) VALUES (
--   gen_random_uuid(),
--   'admin@mathilde-fleurs.com',
--   'Admin',
--   'Mathilde',
--   'admin',
--   'admin'
-- ) ON CONFLICT (email) DO NOTHING;

-- =============================================================================
-- COMMENTAIRES FINAUX
-- =============================================================================

COMMENT ON TABLE profiles IS 'Profils utilisateurs étendus avec préférences et métadonnées';
COMMENT ON TABLE user_sessions IS 'Sessions utilisateur pour analytics et sécurité';
COMMENT ON FUNCTION handle_new_user() IS 'Création automatique du profil lors de l\'inscription';
COMMENT ON FUNCTION update_last_login(UUID) IS 'Met à jour la date de dernière connexion';
COMMENT ON FUNCTION create_user_session(UUID, TEXT, TEXT) IS 'Crée une nouvelle session utilisateur';
