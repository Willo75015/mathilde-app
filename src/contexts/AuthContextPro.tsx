import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

// =============================================================================
// 🔐 TYPES AMÉLIORÉS AVEC NOUVELLES TABLES
// =============================================================================

export interface UserProfile {
  id: string
  created_at: string
  updated_at: string
  email: string
  first_name?: string
  last_name?: string
  avatar_url?: string
  role: 'admin' | 'florist' | 'client'
  
  // Sécurité avancée (nouvelles colonnes)
  is_active: boolean
  email_verified: boolean
  last_sign_in_at?: string
  sign_in_count: number
  failed_attempts: number
  locked_until?: string
  
  // Préférences utilisateur
  theme: 'light' | 'dark' | 'system'
  language: 'fr' | 'en'
  notifications_enabled: boolean
}

interface UserSession {
  id: string
  user_id: string
  session_token?: string
  fingerprint: string
  ip_address?: string
  user_agent: string
  country?: string
  city?: string
  is_active: boolean
  signed_out_at?: string
  failed_attempts: number
  last_activity: string
  created_at: string
  expires_at: string
}

interface SecurityEvent {
  id: string
  user_id?: string
  event_type: 'login_success' | 'login_failed' | 'logout' | 'password_reset' | 
              'account_locked' | 'suspicious_activity' | 'token_refresh' |
              'rate_limit_exceeded' | 'unauthorized_access'
  severity: 'info' | 'warning' | 'critical'
  message: string
  metadata: Record<string, any>
  ip_address?: string
  user_agent: string
  fingerprint: string
  created_at: string
}

interface SecurityMetrics {
  failedAttempts: number
  lastFailedAttempt?: Date
  isBlocked: boolean
  blockExpiresAt?: Date
  sessionCount: number
  suspiciousActivity: boolean
}

interface AuthState {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  loading: boolean
  error: string | null
  securityMetrics: SecurityMetrics
  sessionId?: string
}

interface AuthContextType extends AuthState {
  // Méthodes d'authentification de base (compatibilité existante)
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  
  // Méthodes étendues avec sécurité
  signUpWithProfile: (data: {
    email: string
    password: string
    firstName?: string
    lastName?: string
  }) => Promise<{ error: AuthError | null }>
  
  signInWithOAuth: (provider: 'google' | 'github' | 'discord') => Promise<{ error: AuthError | null }>
  signInWithMagicLink: (email: string) => Promise<{ error: AuthError | null }>
  
  // Sécurité avancée
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>
  updatePassword: (password: string, nonce?: string) => Promise<{ error: AuthError | null }>
  requestReauthentication: () => Promise<{ error: AuthError | null }>
  
  // Gestion du profil
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: Error | null }>
  refreshProfile: () => Promise<void>
  refreshSession: () => Promise<void>
  
  // Nouvelles méthodes de sécurité
  getSecurityEvents: (limit?: number) => Promise<SecurityEvent[]>
  getUserSessions: () => Promise<UserSession[]>
  terminateSession: (sessionId: string) => Promise<void>
  terminateAllSessions: () => Promise<void>
  
  // Utilitaires
  clearError: () => void
  isRole: (role: UserProfile['role']) => boolean
  getDisplayName: () => string
  canPerformAction: (action: string) => boolean
  getTimeUntilUnblock: () => number
}

// =============================================================================
// 🔒 RATE LIMITER AVEC BASE DE DONNÉES
// =============================================================================

class DatabaseRateLimiter {
  private readonly maxAttempts = 5
  private readonly windowMs = 15 * 60 * 1000 // 15 minutes
  private readonly blockDurationMs = 30 * 60 * 1000 // 30 minutes

  async isBlocked(fingerprint: string, userId?: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('check_rate_limit', {
        p_user_id: userId || null,
        p_fingerprint: fingerprint,
        p_max_attempts: this.maxAttempts,
        p_window_minutes: 15
      })

      if (error) {
        console.error('Rate limit check error:', error)
        return false // En cas d'erreur, ne pas bloquer
      }

      return !data // La fonction retourne true si autorisé, on inverse
    } catch (error) {
      console.error('Rate limit exception:', error)
      return false
    }
  }

  async recordFailedAttempt(fingerprint: string, userId?: string, eventType: string = 'login_failed'): Promise<SecurityMetrics> {
    try {
      // Enregistrer l'événement de sécurité
      await this.logSecurityEvent(userId, eventType, 'warning', 'Tentative de connexion échouée', {
        fingerprint,
        attempt_time: new Date().toISOString()
      }, fingerprint)

      // Compter les tentatives récentes
      const { data: events } = await supabase
        .from('security_events')
        .select('*')
        .or(`user_id.eq.${userId},fingerprint.eq.${fingerprint}`)
        .eq('event_type', eventType)
        .gte('created_at', new Date(Date.now() - this.windowMs).toISOString())
        .order('created_at', { ascending: false })

      const failedAttempts = events?.length || 0
      const lastFailedAttempt = events?.[0] ? new Date(events[0].created_at) : new Date()
      const isBlocked = failedAttempts >= this.maxAttempts
      
      // Si bloqué, mettre à jour le profil utilisateur
      if (isBlocked && userId) {
        await supabase.rpc('lock_account', {
          p_user_id: userId,
          p_duration_minutes: 30
        })
      }

      const blockExpiresAt = isBlocked 
        ? new Date(lastFailedAttempt.getTime() + this.blockDurationMs)
        : undefined

      return {
        failedAttempts,
        lastFailedAttempt,
        isBlocked,
        blockExpiresAt,
        sessionCount: 0,
        suspiciousActivity: failedAttempts > 3
      }
    } catch (error) {
      console.error('Record failed attempt error:', error)
      return {
        failedAttempts: 0,
        isBlocked: false,
        sessionCount: 0,
        suspiciousActivity: false
      }
    }
  }

  async reset(fingerprint: string, userId?: string): Promise<void> {
    try {
      // Réinitialiser le compte si verrouillé
      if (userId) {
        const { error } = await supabase
          .from('profiles')
          .update({ 
            failed_attempts: 0,
            locked_until: null 
          })
          .eq('id', userId)

        if (error) {
          console.error('Reset lock error:', error)
        }
      }

      // Log de l'événement de reset
      await this.logSecurityEvent(userId, 'rate_limit_reset', 'info', 'Rate limiting réinitialisé', {
        fingerprint,
        reset_time: new Date().toISOString()
      }, fingerprint)
    } catch (error) {
      console.error('Rate limit reset error:', error)
    }
  }

  async getTimeUntilUnblock(fingerprint: string, userId?: string): Promise<number> {
    try {
      // Vérifier si le compte est verrouillé
      if (userId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('locked_until')
          .eq('id', userId)
          .single()

        if (profile?.locked_until) {
          const unblockTime = new Date(profile.locked_until).getTime()
          return Math.max(0, unblockTime - Date.now())
        }
      }

      return 0
    } catch (error) {
      console.error('Get time until unblock error:', error)
      return 0
    }
  }

  private async logSecurityEvent(
    userId: string | null | undefined,
    eventType: string,
    severity: 'info' | 'warning' | 'critical',
    message: string,
    metadata: Record<string, any> = {},
    fingerprint: string
  ): Promise<void> {
    try {
      await supabase.rpc('log_security_event', {
        p_user_id: userId || null,
        p_event_type: eventType,
        p_severity: severity,
        p_message: message,
        p_metadata: metadata,
        p_ip_address: null, // Client-side ne peut pas obtenir l'IP
        p_user_agent: navigator.userAgent,
        p_fingerprint: fingerprint
      })
    } catch (error) {
      console.error('Log security event error:', error)
    }
  }
}

// =============================================================================
// 🔍 SESSION MANAGER
// =============================================================================

class SessionManager {
  async createSession(userId: string, fingerprint: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .insert({
          user_id: userId,
          fingerprint,
          user_agent: navigator.userAgent,
          is_active: true,
          last_activity: new Date().toISOString(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 jours
        })
        .select('id')
        .single()

      if (error) {
        console.error('Create session error:', error)
        return null
      }

      return data.id
    } catch (error) {
      console.error('Session creation exception:', error)
      return null
    }
  }

  async updateSessionActivity(sessionId: string): Promise<void> {
    try {
      await supabase
        .from('user_sessions')
        .update({ 
          last_activity: new Date().toISOString() 
        })
        .eq('id', sessionId)
    } catch (error) {
      console.error('Update session activity error:', error)
    }
  }

  async getUserSessions(userId: string): Promise<UserSession[]> {
    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Get user sessions error:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Get user sessions exception:', error)
      return []
    }
  }

  async terminateSession(sessionId: string): Promise<void> {
    try {
      await supabase
        .from('user_sessions')
        .update({
          is_active: false,
          signed_out_at: new Date().toISOString()
        })
        .eq('id', sessionId)
    } catch (error) {
      console.error('Terminate session error:', error)
    }
  }

  async terminateAllSessions(userId: string, exceptSessionId?: string): Promise<void> {
    try {
      let query = supabase
        .from('user_sessions')
        .update({
          is_active: false,
          signed_out_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('is_active', true)

      if (exceptSessionId) {
        query = query.neq('id', exceptSessionId)
      }

      await query
    } catch (error) {
      console.error('Terminate all sessions error:', error)
    }
  }
}

// =============================================================================
// 📊 SECURITY ANALYTICS
// =============================================================================

class SecurityAnalytics {
  async getSecurityEvents(userId?: string, limit: number = 50): Promise<SecurityEvent[]> {
    try {
      let query = supabase
        .from('security_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (userId) {
        query = query.eq('user_id', userId)
      }

      const { data, error } = await query

      if (error) {
        console.error('Get security events error:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Get security events exception:', error)
      return []
    }
  }

  async getSecurityMetrics(userId: string, fingerprint: string): Promise<SecurityMetrics> {
    try {
      // Compter les tentatives échouées récentes
      const { data: failedEvents } = await supabase
        .from('security_events')
        .select('*')
        .or(`user_id.eq.${userId},fingerprint.eq.${fingerprint}`)
        .eq('event_type', 'login_failed')
        .gte('created_at', new Date(Date.now() - 15 * 60 * 1000).toISOString())

      // Compter les sessions actives
      const { data: sessions } = await supabase
        .from('user_sessions')
        .select('id')
        .eq('user_id', userId)
        .eq('is_active', true)

      // Vérifier le profil pour le verrouillage
      const { data: profile } = await supabase
        .from('profiles')
        .select('locked_until')
        .eq('id', userId)
        .single()

      const failedAttempts = failedEvents?.length || 0
      const sessionCount = sessions?.length || 0
      const isBlocked = profile?.locked_until ? new Date(profile.locked_until) > new Date() : false
      const blockExpiresAt = profile?.locked_until ? new Date(profile.locked_until) : undefined

      return {
        failedAttempts,
        lastFailedAttempt: failedEvents?.[0] ? new Date(failedEvents[0].created_at) : undefined,
        isBlocked,
        blockExpiresAt,
        sessionCount,
        suspiciousActivity: failedAttempts > 3
      }
    } catch (error) {
      console.error('Get security metrics error:', error)
      return {
        failedAttempts: 0,
        isBlocked: false,
        sessionCount: 0,
        suspiciousActivity: false
      }
    }
  }
}

// =============================================================================
// 🎯 CONTEXT PRINCIPAL
// =============================================================================

const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    session: null,
    loading: true,
    error: null,
    securityMetrics: {
      failedAttempts: 0,
      isBlocked: false,
      sessionCount: 0,
      suspiciousActivity: false
    }
  })

  const rateLimiter = useRef(new DatabaseRateLimiter()).current
  const sessionManager = useRef(new SessionManager()).current
  const securityAnalytics = useRef(new SecurityAnalytics()).current
  const refreshTimeoutRef = useRef<NodeJS.Timeout>()

  // =============================================================================
  // 🛡️ HELPERS SÉCURISÉS
  // =============================================================================

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error, loading: false }))
  }, [])

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  const getClientFingerprint = useCallback(() => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    ctx?.fillText('mathilde-fleurs-fp', 10, 10)
    const canvasFingerprint = canvas.toDataURL()
    
    return btoa(
      navigator.userAgent + 
      navigator.language + 
      screen.width + screen.height + 
      new Date().getTimezoneOffset() +
      canvasFingerprint
    ).slice(0, 32)
  }, [])

  // Récupérer le profil utilisateur optimisé
  const fetchProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Profile fetch error:', error)
        return null
      }

      return data as UserProfile
    } catch (error) {
      console.error('Profile fetch exception:', error)
      return null
    }
  }, [])

  // Mettre à jour les métriques de sécurité
  const updateSecurityMetrics = useCallback(async (userId: string) => {
    const fingerprint = getClientFingerprint()
    const metrics = await securityAnalytics.getSecurityMetrics(userId, fingerprint)
    setState(prev => ({ ...prev, securityMetrics: metrics }))
  }, [getClientFingerprint, securityAnalytics])

  // Configuration de la rotation automatique des tokens
  const setupTokenRotation = useCallback((session: Session) => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current)
    }

    const expiresIn = session.expires_in || 3600
    const refreshTime = Math.max((expiresIn - 300) * 1000, 30000) // 5 min avant expiration

    refreshTimeoutRef.current = setTimeout(async () => {
      try {
        const { data, error } = await supabase.auth.refreshSession()
        
        if (error) {
          console.error('Token refresh error:', error)
        } else if (data.session) {
          setupTokenRotation(data.session)
          
          // Log de l'événement
          if (state.user) {
            await rateLimiter.logSecurityEvent(
              state.user.id,
              'token_refresh',
              'info',
              'Token rafraîchi automatiquement',
              {},
              getClientFingerprint()
            )
          }
        }
      } catch (error) {
        console.error('Token refresh exception:', error)
      }
    }, refreshTime)
  }, [state.user, rateLimiter, getClientFingerprint])

  // =============================================================================
  // ⚡ EFFECTS
  // =============================================================================

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (!mounted) return

        if (error) {
          console.error('Session init error:', error)
          setError(error.message)
          return
        }

        if (session?.user) {
          const profile = await fetchProfile(session.user.id)
          
          if (mounted && profile) {
            // Créer une session en base
            const fingerprint = getClientFingerprint()
            const sessionId = await sessionManager.createSession(session.user.id, fingerprint)
            
            setState(prev => ({
              ...prev,
              session,
              user: session.user,
              profile,
              sessionId: sessionId || undefined,
              loading: false,
              error: null
            }))
            
            // Configurer la rotation des tokens
            setupTokenRotation(session)
            
            // Mettre à jour les métriques de sécurité
            await updateSecurityMetrics(session.user.id)
            
            // Log de restauration de session
            await rateLimiter.logSecurityEvent(
              session.user.id,
              'session_restored',
              'info',
              'Session restaurée avec succès',
              {},
              fingerprint
            )
          }
        } else {
          if (mounted) {
            setState(prev => ({
              ...prev,
              session: null,
              user: null,
              profile: null,
              loading: false
            }))
          }
        }
      } catch (error) {
        if (mounted) {
          console.error('Auth initialization error:', error)
          setError('Erreur d\'initialisation de l\'authentification')
        }
      }
    }

    initializeAuth()

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        if (session?.user) {
          const profile = await fetchProfile(session.user.id)
          
          if (mounted && profile) {
            const fingerprint = getClientFingerprint()
            let sessionId = state.sessionId

            // Créer nouvelle session si connexion
            if (event === 'SIGNED_IN') {
              sessionId = await sessionManager.createSession(session.user.id, fingerprint)
              await rateLimiter.reset(fingerprint, session.user.id)
              
              // Log de connexion
              await rateLimiter.logSecurityEvent(
                session.user.id,
                'login_success',
                'info',
                'Utilisateur connecté avec succès',
                { event },
                fingerprint
              )
            }

            setState(prev => ({
              ...prev,
              session,
              user: session.user,
              profile,
              sessionId: sessionId || prev.sessionId,
              loading: false,
              error: null,
              securityMetrics: {
                failedAttempts: 0,
                isBlocked: false,
                sessionCount: 0,
                suspiciousActivity: false
              }
            }))

            setupTokenRotation(session)
            await updateSecurityMetrics(session.user.id)
          }
        } else {
          if (mounted) {
            // Terminer la session en base si déconnexion
            if (event === 'SIGNED_OUT' && state.sessionId) {
              await sessionManager.terminateSession(state.sessionId)
            }

            setState(prev => ({
              ...prev,
              session: null,
              user: null,
              profile: null,
              sessionId: undefined,
              loading: false,
              error: null
            }))

            if (refreshTimeoutRef.current) {
              clearTimeout(refreshTimeoutRef.current)
            }
          }
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
    }
  }, [fetchProfile, setupTokenRotation, updateSecurityMetrics, sessionManager, rateLimiter, getClientFingerprint, setError, state.sessionId])

  // =============================================================================
  // 🔐 MÉTHODES D'AUTHENTIFICATION (Compatibilité existante)
  // =============================================================================

  const signUp = async (email: string, password: string) => {
    const fingerprint = getClientFingerprint()
    
    // Vérifier le rate limiting
    if (await rateLimiter.isBlocked(fingerprint)) {
      const timeLeft = await rateLimiter.getTimeUntilUnblock(fingerprint)
      const message = `Trop de tentatives. Réessayez dans ${Math.ceil(timeLeft / 60000)} minutes.`
      setError(message)
      return { error: new Error(message) }
    }

    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })
      
      if (error) {
        const securityMetrics = await rateLimiter.recordFailedAttempt(fingerprint, undefined, 'signup_failed')
        setState(prev => ({ ...prev, securityMetrics, loading: false }))
        setError(error.message)
        return { error }
      }

      // Log de succès
      await rateLimiter.logSecurityEvent(
        null,
        'signup_success',
        'info',
        'Inscription réussie',
        { email },
        fingerprint
      )

      setState(prev => ({ ...prev, loading: false }))
      return { error: null }
      
    } catch (error) {
      const err = error as Error
      const securityMetrics = await rateLimiter.recordFailedAttempt(fingerprint, undefined, 'signup_failed')
      setState(prev => ({ ...prev, securityMetrics, loading: false }))
      setError(err.message)
      return { error: err }
    }
  }

  const signIn = async (email: string, password: string) => {
    const fingerprint = getClientFingerprint()
    
    // Vérifier le rate limiting
    if (await rateLimiter.isBlocked(fingerprint)) {
      const timeLeft = await rateLimiter.getTimeUntilUnblock(fingerprint)
      const message = `Trop de tentatives de connexion. Réessayez dans ${Math.ceil(timeLeft / 60000)} minutes.`
      setError(message)
      return { error: new Error(message) }
    }

    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) {
        const securityMetrics = await rateLimiter.recordFailedAttempt(fingerprint, undefined, 'login_failed')
        setState(prev => ({ ...prev, securityMetrics, loading: false }))
        setError(error.message)
        return { error }
      }

      // Succès géré par onAuthStateChange
      return { error: null }
      
    } catch (error) {
      const err = error as Error
      const securityMetrics = await rateLimiter.recordFailedAttempt(fingerprint, undefined, 'login_failed')
      setState(prev => ({ ...prev, securityMetrics, loading: false }))
      setError(err.message)
      return { error: err }
    }
  }

  const signOut = async (): Promise<void> => {
    setState(prev => ({ ...prev, loading: true }))
    
    try {
      // Terminer la session en base
      if (state.sessionId) {
        await sessionManager.terminateSession(state.sessionId)
      }

      // Log de déconnexion
      if (state.user) {
        await rateLimiter.logSecurityEvent(
          state.user.id,
          'logout',
          'info',
          'Déconnexion initiée',
          {},
          getClientFingerprint()
        )
      }

      await supabase.auth.signOut()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  // =============================================================================
  // 🚀 NOUVELLES MÉTHODES ÉTENDUES
  // =============================================================================

  const signUpWithProfile = async (data: {
    email: string
    password: string
    firstName?: string
    lastName?: string
  }) => {
    const fingerprint = getClientFingerprint()
    
    if (await rateLimiter.isBlocked(fingerprint)) {
      const timeLeft = await rateLimiter.getTimeUntilUnblock(fingerprint)
      const message = `Trop de tentatives. Réessayez dans ${Math.ceil(timeLeft / 60000)} minutes.`
      setError(message)
      return { error: new AuthError(message) }
    }

    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            first_name: data.firstName,
            last_name: data.lastName
          }
        }
      })
      
      if (error) {
        const securityMetrics = await rateLimiter.recordFailedAttempt(fingerprint, undefined, 'signup_with_profile_failed')
        setState(prev => ({ ...prev, securityMetrics, loading: false }))
        setError(error.message)
        return { error }
      }
      
      await rateLimiter.logSecurityEvent(
        null,
        'signup_success',
        'info',
        'Inscription avec profil réussie',
        { email: data.email },
        fingerprint
      )

      setState(prev => ({ ...prev, loading: false }))
      return { error: null }
      
    } catch (error) {
      const err = error as AuthError
      const securityMetrics = await rateLimiter.recordFailedAttempt(fingerprint, undefined, 'signup_with_profile_failed')
      setState(prev => ({ ...prev, securityMetrics, loading: false }))
      setError(err.message)
      return { error: err }
    }
  }

  const signInWithOAuth = async (provider: 'google' | 'github' | 'discord') => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
      
      if (error) {
        await rateLimiter.logSecurityEvent(
          null,
          'oauth_signin_failed',
          'warning',
          `Échec OAuth ${provider}`,
          { provider, error: error.message },
          getClientFingerprint()
        )
        setError(error.message)
        return { error }
      }
      
      await rateLimiter.logSecurityEvent(
        null,
        'oauth_signin_initiated',
        'info',
        `Connexion OAuth ${provider} initiée`,
        { provider },
        getClientFingerprint()
      )

      return { error: null }
      
    } catch (error) {
      const err = error as AuthError
      setError(err.message)
      return { error: err }
    }
  }

  const signInWithMagicLink = async (email: string) => {
    const fingerprint = getClientFingerprint()
    
    if (await rateLimiter.isBlocked(fingerprint)) {
      const timeLeft = await rateLimiter.getTimeUntilUnblock(fingerprint)
      const message = `Trop de tentatives. Réessayez dans ${Math.ceil(timeLeft / 60000)} minutes.`
      setError(message)
      return { error: new AuthError(message) }
    }

    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })
      
      if (error) {
        const securityMetrics = await rateLimiter.recordFailedAttempt(fingerprint, undefined, 'magic_link_failed')
        setState(prev => ({ ...prev, securityMetrics, loading: false }))
        setError(error.message)
        return { error }
      }
      
      await rateLimiter.logSecurityEvent(
        null,
        'magic_link_sent',
        'info',
        'Magic link envoyé',
        { email },
        fingerprint
      )

      setState(prev => ({ ...prev, loading: false }))
      return { error: null }
      
    } catch (error) {
      const err = error as AuthError
      const securityMetrics = await rateLimiter.recordFailedAttempt(fingerprint, undefined, 'magic_link_failed')
      setState(prev => ({ ...prev, securityMetrics, loading: false }))
      setError(err.message)
      return { error: err }
    }
  }

  const resetPassword = async (email: string) => {
    const fingerprint = getClientFingerprint()
    
    if (await rateLimiter.isBlocked(fingerprint)) {
      const timeLeft = await rateLimiter.getTimeUntilUnblock(fingerprint)
      const message = `Trop de tentatives. Réessayez dans ${Math.ceil(timeLeft / 60000)} minutes.`
      setError(message)
      return { error: new AuthError(message) }
    }

    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })
      
      if (error) {
        const securityMetrics = await rateLimiter.recordFailedAttempt(fingerprint, undefined, 'password_reset_failed')
        setState(prev => ({ ...prev, securityMetrics, loading: false }))
        setError(error.message)
        return { error }
      }
      
      await rateLimiter.logSecurityEvent(
        null,
        'password_reset',
        'info',
        'Email de reset envoyé',
        { email },
        fingerprint
      )

      setState(prev => ({ ...prev, loading: false }))
      return { error: null }
      
    } catch (error) {
      const err = error as AuthError
      setError(err.message)
      return { error: err }
    }
  }

  const requestReauthentication = async () => {
    if (!state.user) {
      return { error: new AuthError('Utilisateur non connecté') }
    }

    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const { error } = await supabase.auth.reauthenticate()
      
      if (error) {
        await rateLimiter.logSecurityEvent(
          state.user.id,
          'reauthentication_failed',
          'warning',
          'Échec de réauthentification',
          { error: error.message },
          getClientFingerprint()
        )
        setError(error.message)
        return { error }
      }
      
      await rateLimiter.logSecurityEvent(
        state.user.id,
        'reauthentication_requested',
        'info',
        'Réauthentification demandée',
        {},
        getClientFingerprint()
      )

      setState(prev => ({ ...prev, loading: false }))
      return { error: null }
      
    } catch (error) {
      const err = error as AuthError
      setError(err.message)
      return { error: err }
    }
  }

  const updatePassword = async (password: string, nonce?: string) => {
    if (!state.user) {
      return { error: new Error('Utilisateur non connecté') }
    }

    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const updateData: any = { password }
      if (nonce) {
        updateData.nonce = nonce
      }

      const { error } = await supabase.auth.updateUser(updateData)
      
      if (error) {
        await rateLimiter.logSecurityEvent(
          state.user.id,
          'password_update_failed',
          'warning',
          'Échec de mise à jour du mot de passe',
          { error: error.message },
          getClientFingerprint()
        )
        setError(error.message)
        return { error }
      }
      
      await rateLimiter.logSecurityEvent(
        state.user.id,
        'password_update_success',
        'info',
        'Mot de passe mis à jour avec succès',
        {},
        getClientFingerprint()
      )

      setState(prev => ({ ...prev, loading: false }))
      return { error: null }
      
    } catch (error) {
      const err = error as Error
      setError(err.message)
      return { error: err }
    }
  }

  // =============================================================================
  // 👤 GESTION DU PROFIL
  // =============================================================================

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!state.user?.id) {
      return { error: new Error('Utilisateur non connecté') }
    }

    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', state.user.id)

      if (error) {
        setError(error.message)
        return { error: new Error(error.message) }
      }

      const updatedProfile = await fetchProfile(state.user.id)
      setState(prev => ({
        ...prev,
        profile: updatedProfile,
        loading: false
      }))

      await rateLimiter.logSecurityEvent(
        state.user.id,
        'profile_updated',
        'info',
        'Profil mis à jour',
        { updated_fields: Object.keys(updates) },
        getClientFingerprint()
      )

      return { error: null }
      
    } catch (error) {
      const err = error as Error
      setError(err.message)
      return { error: err }
    }
  }

  const refreshProfile = async () => {
    if (!state.user?.id) return
    const profile = await fetchProfile(state.user.id)
    setState(prev => ({ ...prev, profile }))
  }

  const refreshSession = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession()
      
      if (error) {
        console.error('Session refresh error:', error)
      } else if (data.session) {
        setupTokenRotation(data.session)
      }
    } catch (error) {
      console.error('Session refresh exception:', error)
    }
  }

  // =============================================================================
  // 🔒 NOUVELLES MÉTHODES DE SÉCURITÉ
  // =============================================================================

  const getSecurityEvents = async (limit: number = 50): Promise<SecurityEvent[]> => {
    return await securityAnalytics.getSecurityEvents(state.user?.id, limit)
  }

  const getUserSessions = async (): Promise<UserSession[]> => {
    if (!state.user?.id) return []
    return await sessionManager.getUserSessions(state.user.id)
  }

  const terminateSession = async (sessionId: string): Promise<void> => {
    await sessionManager.terminateSession(sessionId)
    
    if (state.user) {
      await rateLimiter.logSecurityEvent(
        state.user.id,
        'session_terminated',
        'info',
        'Session terminée manuellement',
        { terminated_session_id: sessionId },
        getClientFingerprint()
      )
    }
  }

  const terminateAllSessions = async (): Promise<void> => {
    if (!state.user?.id) return
    
    await sessionManager.terminateAllSessions(state.user.id, state.sessionId)
    
    await rateLimiter.logSecurityEvent(
      state.user.id,
      'all_sessions_terminated',
      'warning',
      'Toutes les sessions ont été terminées',
      {},
      getClientFingerprint()
    )
  }

  // =============================================================================
  // 🛡️ UTILITAIRES
  // =============================================================================

  const isRole = (role: UserProfile['role']): boolean => {
    return state.profile?.role === role
  }

  const getDisplayName = (): string => {
    if (state.profile?.first_name && state.profile?.last_name) {
      return `${state.profile.first_name} ${state.profile.last_name}`
    }
    if (state.user?.email) {
      return state.user.email.split('@')[0]
    }
    return 'Utilisateur'
  }

  const canPerformAction = (action: string): boolean => {
    if (!state.profile) return false
    
    const permissions = {
      admin: ['*'],
      florist: ['manage_events', 'manage_clients', 'view_stats'],
      client: ['view_own_events', 'manage_own_profile']
    }

    const userPermissions = permissions[state.profile.role] || []
    return userPermissions.includes('*') || userPermissions.includes(action)
  }

  const getTimeUntilUnblock = (): number => {
    const fingerprint = getClientFingerprint()
    return rateLimiter.getTimeUntilUnblock(fingerprint, state.user?.id).then(time => time).catch(() => 0) as any
  }

  // =============================================================================
  // 📋 PROVIDER VALUE
  // =============================================================================

  const value: AuthContextType = {
    // État (compatible avec l'existant)
    user: state.user,
    profile: state.profile,
    session: state.session,
    loading: state.loading,
    error: state.error,
    securityMetrics: state.securityMetrics,
    sessionId: state.sessionId,

    // Méthodes existantes (100% compatibles)
    signUp,
    signIn,
    signOut,

    // Nouvelles méthodes étendues
    signUpWithProfile,
    signInWithOAuth,
    signInWithMagicLink,
    resetPassword,
    updatePassword,
    requestReauthentication,

    // Gestion profil
    updateProfile,
    refreshProfile,
    refreshSession,

    // Nouvelles méthodes de sécurité
    getSecurityEvents,
    getUserSessions,
    terminateSession,
    terminateAllSessions,

    // Utilitaires
    clearError,
    isRole,
    getDisplayName,
    canPerformAction,
    getTimeUntilUnblock
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

// =============================================================================
// 🎯 HOOKS SPÉCIALISÉS (compatibilité + nouveautés)
// =============================================================================

export const useAuthSecurity = () => {
  const { securityMetrics, getTimeUntilUnblock, getSecurityEvents } = useAuth()
  return { securityMetrics, getTimeUntilUnblock, getSecurityEvents }
}

export const useAuthActions = () => {
  const { 
    signIn, 
    signUp, 
    signOut, 
    signUpWithProfile, 
    signInWithOAuth, 
    signInWithMagicLink,
    resetPassword,
    updatePassword,
    requestReauthentication
  } = useAuth()
  
  return {
    signIn, 
    signUp, 
    signOut, 
    signUpWithProfile, 
    signInWithOAuth, 
    signInWithMagicLink,
    resetPassword,
    updatePassword,
    requestReauthentication
  }
}

export const useProfile = () => {
  const { profile, updateProfile, refreshProfile, getDisplayName, isRole, canPerformAction } = useAuth()
  return { profile, updateProfile, refreshProfile, getDisplayName, isRole, canPerformAction }
}

export const useSessionManagement = () => {
  const { getUserSessions, terminateSession, terminateAllSessions, sessionId } = useAuth()
  return { getUserSessions, terminateSession, terminateAllSessions, currentSessionId: sessionId }
}