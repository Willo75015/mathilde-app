-- ===============================================
-- 🔐 MATHILDE FLEURS - AUTHENTICATION SÉCURISÉE
-- Setup complet des tables et sécurité RLS
-- ===============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===============================================
-- 1. TABLE PROFILES (Profils utilisateurs)
-- ===============================================

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

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_active ON public.profiles(is_active) WHERE is_active = true;

-- ===============================================
-- 2. TABLE USER_SESSIONS (Sessions et analytics)
-- ===============================================

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

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON public.user_sessions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_sessions_fingerprint ON public.user_sessions(fingerprint);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON public.user_sessions(expires_at);

-- ===============================================
-- 3. TABLE SECURITY_EVENTS (Audit de sécurité)
-- ===============================================

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

-- Index pour les performances et recherches
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON public.security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON public.security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON public.security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON public.security_events(created_at);
CREATE INDEX IF NOT EXISTS idx_security_events_ip ON public.security_events(ip_address);

-- ===============================================
-- 4. FONCTIONS ET TRIGGERS
-- ===============================================

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour profiles
DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Fonction pour créer un profil automatiquement
CREATE OR REPLACE FUNCTION public.handle_new_user()
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
$$ LANGUAGE plpgsql;

-- Trigger pour créer automatiquement un profil
DROP TRIGGER IF EXISTS trigger_create_profile_on_signup ON auth.users;
CREATE TRIGGER trigger_create_profile_on_signup
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ===============================================
-- 5. FONCTIONS DE SÉCURITÉ
-- ===============================================

-- Fonction pour enregistrer un événement de sécurité
CREATE OR REPLACE FUNCTION public.log_security_event(
    p_user_id UUID,
    p_event_type TEXT,
    p_severity TEXT DEFAULT 'info',
    p_message TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}',
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_fingerprint TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    event_id UUID;
BEGIN
    INSERT INTO public.security_events (
        user_id, event_type, severity, message, metadata,
        ip_address, user_agent, fingerprint
    )
    VALUES (
        p_user_id, p_event_type, p_severity, p_message, p_metadata,
        p_ip_address, p_user_agent, p_fingerprint
    )
    RETURNING id INTO event_id;
    
    RETURN event_id;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour vérifier le rate limiting
CREATE OR REPLACE FUNCTION public.check_rate_limit(
    p_user_id UUID,
    p_fingerprint TEXT,
    p_max_attempts INTEGER DEFAULT 5,
    p_window_minutes INTEGER DEFAULT 15
)
RETURNS BOOLEAN AS $$
DECLARE
    attempt_count INTEGER;
    is_locked BOOLEAN;
BEGIN
    -- Vérifier si le compte est verrouillé
    SELECT (locked_until IS NOT NULL AND locked_until > NOW())
    INTO is_locked
    FROM public.profiles
    WHERE id = p_user_id;
    
    IF is_locked THEN
        RETURN FALSE;
    END IF;
    
    -- Compter les tentatives récentes
    SELECT COUNT(*)
    INTO attempt_count
    FROM public.security_events
    WHERE 
        (user_id = p_user_id OR fingerprint = p_fingerprint)
        AND event_type = 'login_failed'
        AND created_at > NOW() - INTERVAL '1 minute' * p_window_minutes;
    
    RETURN attempt_count < p_max_attempts;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour verrouiller un compte
CREATE OR REPLACE FUNCTION public.lock_account(
    p_user_id UUID,
    p_duration_minutes INTEGER DEFAULT 15
)
RETURNS VOID AS $$
BEGIN
    UPDATE public.profiles
    SET 
        locked_until = NOW() + INTERVAL '1 minute' * p_duration_minutes,
        failed_attempts = failed_attempts + 1
    WHERE id = p_user_id;
    
    -- Enregistrer l'événement
    PERFORM public.log_security_event(
        p_user_id,
        'account_locked',
        'warning',
        'Account locked due to too many failed attempts',
        jsonb_build_object('duration_minutes', p_duration_minutes)
    );
END;
$$ LANGUAGE plpgsql;

-- ===============================================
-- 6. POLITIQUES RLS (Row Level Security)
-- ===============================================

-- Activer RLS sur toutes les tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- Politiques pour profiles
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;
CREATE POLICY "profiles_admin_all" ON public.profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Politiques pour user_sessions
DROP POLICY IF EXISTS "sessions_select_own" ON public.user_sessions;
CREATE POLICY "sessions_select_own" ON public.user_sessions
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "sessions_insert_own" ON public.user_sessions;
CREATE POLICY "sessions_insert_own" ON public.user_sessions
    FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "sessions_update_own" ON public.user_sessions;
CREATE POLICY "sessions_update_own" ON public.user_sessions
    FOR UPDATE USING (user_id = auth.uid());

-- Politiques pour security_events
DROP POLICY IF EXISTS "security_events_select_own" ON public.security_events;
CREATE POLICY "security_events_select_own" ON public.security_events
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "security_events_insert_system" ON public.security_events;
CREATE POLICY "security_events_insert_system" ON public.security_events
    FOR INSERT WITH CHECK (true); -- System can insert security events

DROP POLICY IF EXISTS "security_events_admin_all" ON public.security_events;
CREATE POLICY "security_events_admin_all" ON public.security_events
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ===============================================
-- 7. VUES POUR L'ADMINISTRATION
-- ===============================================

-- Vue pour les statistiques de sécurité
CREATE OR REPLACE VIEW public.security_stats AS
SELECT 
    DATE_TRUNC('day', created_at) as date,
    event_type,
    severity,
    COUNT(*) as event_count,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT ip_address) as unique_ips
FROM public.security_events
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at), event_type, severity
ORDER BY date DESC, event_count DESC;

-- Vue pour les utilisateurs actifs
CREATE OR REPLACE VIEW public.active_users_stats AS
SELECT 
    DATE_TRUNC('day', last_sign_in_at) as date,
    COUNT(*) as daily_active_users,
    COUNT(*) FILTER (WHERE created_at::date = DATE_TRUNC('day', last_sign_in_at)::date) as new_users
FROM public.profiles
WHERE 
    is_active = true 
    AND last_sign_in_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', last_sign_in_at)
ORDER BY date DESC;

-- Vue pour les sessions suspectes
CREATE OR REPLACE VIEW public.suspicious_sessions AS
SELECT 
    s.*,
    p.email,
    p.role,
    COUNT(se.id) as security_events_count
FROM public.user_sessions s
JOIN public.profiles p ON s.user_id = p.id
LEFT JOIN public.security_events se ON s.user_id = se.user_id 
    AND se.created_at >= s.created_at
WHERE 
    s.failed_attempts > 2
    OR EXISTS (
        SELECT 1 FROM public.security_events se2
        WHERE se2.fingerprint = s.fingerprint
        AND se2.severity = 'critical'
        AND se2.created_at >= NOW() - INTERVAL '24 hours'
    )
GROUP BY s.id, p.email, p.role
ORDER BY s.failed_attempts DESC, security_events_count DESC;

-- ===============================================
-- 8. NETTOYAGE AUTOMATIQUE
-- ===============================================

-- Fonction pour nettoyer les anciennes données
CREATE OR REPLACE FUNCTION public.cleanup_old_data()
RETURNS VOID AS $$
BEGIN
    -- Supprimer les sessions expirées
    DELETE FROM public.user_sessions
    WHERE expires_at < NOW() - INTERVAL '7 days';
    
    -- Supprimer les événements de sécurité anciens (> 90 jours)
    DELETE FROM public.security_events
    WHERE created_at < NOW() - INTERVAL '90 days'
    AND severity = 'info';
    
    -- Garder les événements critiques plus longtemps (> 1 an)
    DELETE FROM public.security_events
    WHERE created_at < NOW() - INTERVAL '1 year'
    AND severity IN ('warning', 'critical');
    
    -- Débloquer les comptes automatiquement
    UPDATE public.profiles
    SET locked_until = NULL
    WHERE locked_until < NOW();
    
END;
$$ LANGUAGE plpgsql;

-- ===============================================
-- 9. DONNÉES INITIALES
-- ===============================================

-- Créer un utilisateur admin par défaut (optionnel)
-- INSERT INTO public.profiles (id, email, first_name, last_name, role, is_active, email_verified)
-- VALUES (
--     uuid_generate_v4(),
--     'admin@mathilde-fleurs.com',
--     'Admin',
--     'Mathilde Fleurs',
--     'admin',
--     true,
--     true
-- ) ON CONFLICT (email) DO NOTHING;

-- ===============================================
-- 10. PERMISSIONS POUR L'API
-- ===============================================

-- Accorder les permissions nécessaires
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Permissions pour les tables
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_sessions TO authenticated;
GRANT SELECT, INSERT ON public.security_events TO authenticated;

-- Permissions pour les vues (admin seulement)
GRANT SELECT ON public.security_stats TO authenticated;
GRANT SELECT ON public.active_users_stats TO authenticated;
GRANT SELECT ON public.suspicious_sessions TO authenticated;

-- Permissions pour les fonctions
GRANT EXECUTE ON FUNCTION public.log_security_event TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit TO authenticated;
GRANT EXECUTE ON FUNCTION public.lock_account TO authenticated;

-- ===============================================
-- ✅ SETUP TERMINÉ !
-- ===============================================

-- Vérifier que tout est en place
DO $$
BEGIN
    RAISE NOTICE '🔐 MATHILDE FLEURS - AUTH SETUP COMPLETED!';
    RAISE NOTICE '✅ Tables created: profiles, user_sessions, security_events';
    RAISE NOTICE '✅ RLS policies enabled and configured';
    RAISE NOTICE '✅ Security functions created';
    RAISE NOTICE '✅ Admin views created';
    RAISE NOTICE '✅ Automatic triggers configured';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Ready for production-grade authentication!';
END $$;