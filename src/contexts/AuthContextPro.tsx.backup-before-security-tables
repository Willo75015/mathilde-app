import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

// =============================================================================
// TYPES AMÉLIORÉS
// =============================================================================

export interface UserProfile {
  id: string
  created_at: string
  updated_at: string
  email: string
  first_name?: string
  last_name?: string
  username?: string
  avatar_url?: string
  phone?: string
  website?: string
  preferences: {
    theme: 'light' | 'dark' | 'system'
    language: string
    notifications: {
      email: boolean
      push: boolean
      reminders: boolean
    }
    dashboard: {
      defaultView: string
      showWelcome: boolean
    }
  }
  role: 'admin' | 'florist' | 'user' | 'client'
  is_active: boolean
  last_login?: string
  login_count: number
}

interface SecurityMetrics {
  failedAttempts: number
  lastFailedAttempt?: Date
  isBlocked: boolean
  blockExpiresAt?: Date
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
  // Méthodes d'authentification de base
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  
  // Méthodes étendues avec sécurité
  signUpWithProfile: (data: {
    email: string
    password: string
    firstName?: string
    lastName?: string
    username?: string
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
  
  // Utilitaires
  clearError: () => void
  isRole: (role: UserProfile['role']) => boolean
  getDisplayName: () => string
  canPerformAction: (action: string) => boolean
  getTimeUntilUnblock: () => number
}

// =============================================================================
// RATE LIMITER SÉCURISÉ
// =============================================================================

class AuthRateLimiter {
  private attempts = new Map<string, { count: number; resetTime: number; timestamps: number[] }>()
  private readonly maxAttempts = 5
  private readonly windowMs = 15 * 60 * 1000 // 15 minutes
  private readonly blockDurationMs = 30 * 60 * 1000 // 30 minutes

  isBlocked(identifier: string): boolean {
    const record = this.attempts.get(identifier)
    if (!record) return false

    const now = Date.now()
    
    // Nettoyer les tentatives anciennes
    record.timestamps = record.timestamps.filter(time => now - time < this.windowMs)
    record.count = record.timestamps.length

    if (record.count >= this.maxAttempts) {
      const oldestAttempt = Math.min(...record.timestamps)
      return (now - oldestAttempt) < this.blockDurationMs
    }

    return false
  }

  recordAttempt(identifier: string): SecurityMetrics {
    const now = Date.now()
    const record = this.attempts.get(identifier) || { count: 0, resetTime: 0, timestamps: [] }
    
    record.timestamps.push(now)
    record.timestamps = record.timestamps.filter(time => now - time < this.windowMs)
    record.count = record.timestamps.length
    
    this.attempts.set(identifier, record)

    const isBlocked = record.count >= this.maxAttempts
    const blockExpiresAt = isBlocked 
      ? new Date(Math.min(...record.timestamps) + this.blockDurationMs)
      : undefined

    return {
      failedAttempts: record.count,
      lastFailedAttempt: new Date(now),
      isBlocked,
      blockExpiresAt
    }
  }

  reset(identifier: string): void {
    this.attempts.delete(identifier)
  }

  getTimeUntilUnblock(identifier: string): number {
    const record = this.attempts.get(identifier)
    if (!record || record.count < this.maxAttempts) return 0

    const oldestAttempt = Math.min(...record.timestamps)
    const unblockTime = oldestAttempt + this.blockDurationMs
    return Math.max(0, unblockTime - Date.now())
  }
}

// =============================================================================
// SECURITY AUDITOR
// =============================================================================

class SecurityAuditor {
  private static instance: SecurityAuditor
  private events: Array<{
    id: string
    type: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    message: string
    timestamp: Date
    userId?: string
    metadata?: any
  }> = []

  static getInstance(): SecurityAuditor {
    if (!SecurityAuditor.instance) {
      SecurityAuditor.instance = new SecurityAuditor()
    }
    return SecurityAuditor.instance
  }

  log(type: string, severity: 'low' | 'medium' | 'high' | 'critical', message: string, metadata?: any, userId?: string) {
    const event = {
      id: crypto.randomUUID(),
      type,
      severity,
      message,
      timestamp: new Date(),
      userId,
      metadata
    }

    this.events.push(event)
    
    // Limiter à 1000 événements max
    if (this.events.length > 1000) {
      this.events = this.events.slice(-500)
    }

    // Logger en console pour les événements critiques
    if (severity === 'critical') {
      console.error('🚨 SECURITY ALERT:', event)
    } else if (severity === 'high') {
      console.warn('🔒 Security Event:', event)
    }

    // En production, envoyer à un service de monitoring
    // this.sendToMonitoring(event)
  }

  getRecentEvents(limit = 50) {
    return this.events.slice(-limit)
  }
}

// =============================================================================
// CONTEXT
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
      isBlocked: false
    }
  })

  const rateLimiter = useRef(new AuthRateLimiter()).current
  const auditor = useRef(SecurityAuditor.getInstance()).current
  const refreshTimeoutRef = useRef<NodeJS.Timeout>()

  // =============================================================================
  // HELPERS SÉCURISÉS
  // =============================================================================

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error, loading: false }))
  }, [])

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  const getClientFingerprint = useCallback(() => {
    // Créer un fingerprint basique du client pour le rate limiting
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    ctx?.fillText('fingerprint', 10, 10)
    const canvasFingerprint = canvas.toDataURL()
    
    return btoa(
      navigator.userAgent + 
      navigator.language + 
      screen.width + screen.height + 
      canvasFingerprint
    ).slice(0, 32)
  }, [])

  const logSecurityEvent = useCallback((type: string, severity: 'low' | 'medium' | 'high' | 'critical', message: string, metadata?: any) => {
    auditor.log(type, severity, message, metadata, state.user?.id)
  }, [state.user?.id])

  // Récupérer le profil utilisateur avec cache
  const fetchProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        logSecurityEvent('profile_fetch_error', 'medium', `Erreur récupération profil: ${error.message}`, { error })
        return null
      }

      return data as UserProfile
    } catch (error) {
      logSecurityEvent('profile_fetch_exception', 'high', 'Exception lors de la récupération du profil', { error })
      return null
    }
  }, [logSecurityEvent])

  // Mettre à jour la date de dernière connexion
  const updateLastLogin = useCallback(async (userId: string) => {
    try {
      await supabase.rpc('update_last_login', { user_uuid: userId })
      logSecurityEvent('login_updated', 'low', 'Dernière connexion mise à jour')
    } catch (error) {
      logSecurityEvent('login_update_error', 'medium', 'Erreur mise à jour last_login', { error })
    }
  }, [logSecurityEvent])

  // Créer une session utilisateur (pour analytics)
  const createUserSession = useCallback(async (userId: string) => {
    try {
      const fingerprint = getClientFingerprint()
      await supabase.rpc('create_user_session', {
        user_uuid: userId,
        ip_addr: null, // En client-side, on ne peut pas obtenir l'IP
        user_agent_str: navigator.userAgent
      })
      
      logSecurityEvent('session_created', 'low', 'Session utilisateur créée', { fingerprint })
    } catch (error) {
      logSecurityEvent('session_creation_error', 'medium', 'Erreur création session', { error })
    }
  }, [getClientFingerprint, logSecurityEvent])

  // Configuration de la rotation automatique des tokens
  const setupTokenRotation = useCallback((session: Session) => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current)
    }

    // Rafraîchir le token 5 minutes avant expiration
    const expiresIn = session.expires_in || 3600
    const refreshTime = Math.max((expiresIn - 300) * 1000, 30000) // Min 30s

    refreshTimeoutRef.current = setTimeout(async () => {
      try {
        const { data, error } = await supabase.auth.refreshSession()
        
        if (error) {
          logSecurityEvent('token_refresh_error', 'high', `Erreur refresh token: ${error.message}`, { error })
        } else if (data.session) {
          logSecurityEvent('token_refreshed', 'low', 'Token rafraîchi automatiquement')
          setupTokenRotation(data.session) // Programmer le prochain refresh
        }
      } catch (error) {
        logSecurityEvent('token_refresh_exception', 'critical', 'Exception lors du refresh token', { error })
      }
    }, refreshTime)
  }, [logSecurityEvent])

  // =============================================================================
  // EFFECTS
  // =============================================================================

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (!mounted) return

        if (error) {
          logSecurityEvent('session_init_error', 'high', `Erreur initialisation session: ${error.message}`, { error })
          setError(error.message)
          return
        }

        if (session?.user) {
          const profile = await fetchProfile(session.user.id)
          
          if (mounted) {
            setState(prev => ({
              ...prev,
              session,
              user: session.user,
              profile,
              loading: false,
              error: null
            }))
            
            // Configurer la rotation des tokens
            setupTokenRotation(session)
            
            // Mettre à jour last_login et créer session
            updateLastLogin(session.user.id)
            createUserSession(session.user.id)
            
            logSecurityEvent('session_restored', 'low', 'Session restaurée avec succès')
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
          logSecurityEvent('auth_init_exception', 'critical', 'Exception initialisation auth', { error })
          setError('Erreur d\'initialisation de l\'authentification')
        }
      }
    }

    initializeAuth()

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        logSecurityEvent('auth_state_change', 'low', `Changement d'état auth: ${event}`, { event })

        if (session?.user) {
          const profile = await fetchProfile(session.user.id)
          
          if (mounted) {
            setState(prev => ({
              ...prev,
              session,
              user: session.user,
              profile,
              loading: false,
              error: null,
              securityMetrics: {
                failedAttempts: 0,
                isBlocked: false
              }
            }))

            // Configurer la rotation des tokens
            setupTokenRotation(session)

            // Actions spécifiques selon l'événement
            if (event === 'SIGNED_IN') {
              updateLastLogin(session.user.id)
              createUserSession(session.user.id)
              rateLimiter.reset(getClientFingerprint()) // Reset rate limiting
              logSecurityEvent('user_signed_in', 'low', 'Utilisateur connecté')
            } else if (event === 'TOKEN_REFRESHED') {
              logSecurityEvent('token_refreshed', 'low', 'Token rafraîchi')
            }
          }
        } else {
          if (mounted) {
            setState(prev => ({
              ...prev,
              session: null,
              user: null,
              profile: null,
              loading: false,
              error: null
            }))

            // Nettoyer la rotation des tokens
            if (refreshTimeoutRef.current) {
              clearTimeout(refreshTimeoutRef.current)
            }

            if (event === 'SIGNED_OUT') {
              logSecurityEvent('user_signed_out', 'low', 'Utilisateur déconnecté')
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
  }, [fetchProfile, setupTokenRotation, updateLastLogin, createUserSession, getClientFingerprint, logSecurityEvent, setError])

  // =============================================================================
  // MÉTHODES D'AUTHENTIFICATION (compatibilité existante)
  // =============================================================================

  const signUp = async (email: string, password: string) => {
    const fingerprint = getClientFingerprint()
    
    // Vérifier le rate limiting
    if (rateLimiter.isBlocked(fingerprint)) {
      const timeLeft = rateLimiter.getTimeUntilUnblock(fingerprint)
      const message = `Trop de tentatives. Réessayez dans ${Math.ceil(timeLeft / 60000)} minutes.`
      logSecurityEvent('signup_rate_limited', 'medium', message, { fingerprint })
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
        const securityMetrics = rateLimiter.recordAttempt(fingerprint)
        setState(prev => ({ ...prev, securityMetrics, loading: false }))
        
        logSecurityEvent('signup_failed', 'medium', `Échec inscription: ${error.message}`, { 
          email, 
          error: error.message,
          fingerprint 
        })
        
        setError(error.message)
        return { error }
      }

      logSecurityEvent('signup_success', 'low', 'Inscription réussie', { email })
      setState(prev => ({ ...prev, loading: false }))
      return { error: null }
      
    } catch (error) {
      const err = error as Error
      const securityMetrics = rateLimiter.recordAttempt(fingerprint)
      setState(prev => ({ ...prev, securityMetrics, loading: false }))
      
      logSecurityEvent('signup_exception', 'high', 'Exception lors de l\'inscription', { error: err.message })
      setError(err.message)
      return { error: err }
    }
  }

  const signIn = async (email: string, password: string) => {
    const fingerprint = getClientFingerprint()
    
    // Vérifier le rate limiting
    if (rateLimiter.isBlocked(fingerprint)) {
      const timeLeft = rateLimiter.getTimeUntilUnblock(fingerprint)
      const message = `Trop de tentatives de connexion. Réessayez dans ${Math.ceil(timeLeft / 60000)} minutes.`
      logSecurityEvent('signin_rate_limited', 'high', message, { email, fingerprint })
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
        const securityMetrics = rateLimiter.recordAttempt(fingerprint)
        setState(prev => ({ ...prev, securityMetrics, loading: false }))
        
        logSecurityEvent('signin_failed', 'medium', `Échec connexion: ${error.message}`, { 
          email, 
          error: error.message,
          fingerprint 
        })
        
        setError(error.message)
        return { error }
      }

      // Succès - reset du rate limiting
      rateLimiter.reset(fingerprint)
      logSecurityEvent('signin_success', 'low', 'Connexion réussie', { email })
      
      return { error: null }
      
    } catch (error) {
      const err = error as Error
      const securityMetrics = rateLimiter.recordAttempt(fingerprint)
      setState(prev => ({ ...prev, securityMetrics, loading: false }))
      
      logSecurityEvent('signin_exception', 'critical', 'Exception lors de la connexion', { error: err.message })
      setError(err.message)
      return { error: err }
    }
  }

  const signOut = async (): Promise<void> => {
    setState(prev => ({ ...prev, loading: true }))
    
    try {
      await supabase.auth.signOut()
      logSecurityEvent('signout_initiated', 'low', 'Déconnexion initiée')
    } catch (error) {
      logSecurityEvent('signout_error', 'medium', 'Erreur lors de la déconnexion', { error })
    }
  }

  // =============================================================================
  // NOUVELLES MÉTHODES ÉTENDUES
  // =============================================================================

  const signUpWithProfile = async (data: {
    email: string
    password: string
    firstName?: string
    lastName?: string
    username?: string
  }) => {
    const fingerprint = getClientFingerprint()
    
    if (rateLimiter.isBlocked(fingerprint)) {
      const timeLeft = rateLimiter.getTimeUntilUnblock(fingerprint)
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
            last_name: data.lastName,
            username: data.username
          }
        }
      })
      
      if (error) {
        const securityMetrics = rateLimiter.recordAttempt(fingerprint)
        setState(prev => ({ ...prev, securityMetrics, loading: false }))
        logSecurityEvent('signup_with_profile_failed', 'medium', error.message, data)
        setError(error.message)
        return { error }
      }
      
      logSecurityEvent('signup_with_profile_success', 'low', 'Inscription avec profil réussie', { email: data.email })
      setState(prev => ({ ...prev, loading: false }))
      return { error: null }
      
    } catch (error) {
      const err = error as AuthError
      const securityMetrics = rateLimiter.recordAttempt(fingerprint)
      setState(prev => ({ ...prev, securityMetrics, loading: false }))
      logSecurityEvent('signup_with_profile_exception', 'high', err.message, data)
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
        logSecurityEvent('oauth_signin_failed', 'medium', `Échec OAuth ${provider}: ${error.message}`, { provider })
        setError(error.message)
        return { error }
      }
      
      logSecurityEvent('oauth_signin_initiated', 'low', `Connexion OAuth ${provider} initiée`, { provider })
      return { error: null }
      
    } catch (error) {
      const err = error as AuthError
      logSecurityEvent('oauth_signin_exception', 'high', `Exception OAuth ${provider}`, { provider, error: err.message })
      setError(err.message)
      return { error: err }
    }
  }

  const signInWithMagicLink = async (email: string) => {
    const fingerprint = getClientFingerprint()
    
    if (rateLimiter.isBlocked(fingerprint)) {
      const timeLeft = rateLimiter.getTimeUntilUnblock(fingerprint)
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
        const securityMetrics = rateLimiter.recordAttempt(fingerprint)
        setState(prev => ({ ...prev, securityMetrics, loading: false }))
        logSecurityEvent('magic_link_failed', 'medium', error.message, { email })
        setError(error.message)
        return { error }
      }
      
      logSecurityEvent('magic_link_sent', 'low', 'Magic link envoyé', { email })
      setState(prev => ({ ...prev, loading: false }))
      return { error: null }
      
    } catch (error) {
      const err = error as AuthError
      const securityMetrics = rateLimiter.recordAttempt(fingerprint)
      setState(prev => ({ ...prev, securityMetrics, loading: false }))
      logSecurityEvent('magic_link_exception', 'high', err.message, { email })
      setError(err.message)
      return { error: err }
    }
  }

  const resetPassword = async (email: string) => {
    const fingerprint = getClientFingerprint()
    
    if (rateLimiter.isBlocked(fingerprint)) {
      const timeLeft = rateLimiter.getTimeUntilUnblock(fingerprint)
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
        const securityMetrics = rateLimiter.recordAttempt(fingerprint)
        setState(prev => ({ ...prev, securityMetrics, loading: false }))
        logSecurityEvent('password_reset_failed', 'medium', error.message, { email })
        setError(error.message)
        return { error }
      }
      
      logSecurityEvent('password_reset_sent', 'low', 'Email de reset envoyé', { email })
      setState(prev => ({ ...prev, loading: false }))
      return { error: null }
      
    } catch (error) {
      const err = error as AuthError
      logSecurityEvent('password_reset_exception', 'high', err.message, { email })
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
        logSecurityEvent('reauthentication_failed', 'medium', error.message)
        setError(error.message)
        return { error }
      }
      
      logSecurityEvent('reauthentication_requested', 'low', 'Demande de réauthentification')
      setState(prev => ({ ...prev, loading: false }))
      return { error: null }
      
    } catch (error) {
      const err = error as AuthError
      logSecurityEvent('reauthentication_exception', 'high', err.message)
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
        logSecurityEvent('password_update_failed', 'high', error.message)
        setError(error.message)
        return { error }
      }
      
      logSecurityEvent('password_updated', 'medium', 'Mot de passe mis à jour')
      setState(prev => ({ ...prev, loading: false }))
      return { error: null }
      
    } catch (error) {
      const err = error as Error
      logSecurityEvent('password_update_exception', 'critical', err.message)
      setError(err.message)
      return { error: err }
    }
  }

  // =============================================================================
  // GESTION DU PROFIL
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
        logSecurityEvent('profile_update_failed', 'medium', error.message, updates)
        setError(error.message)
        return { error: new Error(error.message) }
      }

      const updatedProfile = await fetchProfile(state.user.id)
      setState(prev => ({
        ...prev,
        profile: updatedProfile,
        loading: false
      }))

      logSecurityEvent('profile_updated', 'low', 'Profil mis à jour', Object.keys(updates))
      return { error: null }
      
    } catch (error) {
      const err = error as Error
      logSecurityEvent('profile_update_exception', 'high', err.message, updates)
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
        logSecurityEvent('session_refresh_failed', 'medium', error.message)
      } else if (data.session) {
        logSecurityEvent('session_refreshed_manually', 'low', 'Session rafraîchie manuellement')
        setupTokenRotation(data.session)
      }
    } catch (error) {
      logSecurityEvent('session_refresh_exception', 'high', 'Exception refresh session', { error })
    }
  }

  // =============================================================================
  // UTILITAIRES
  // =============================================================================

  const isRole = (role: UserProfile['role']): boolean => {
    return state.profile?.role === role
  }

  const getDisplayName = (): string => {
    if (state.profile?.first_name && state.profile?.last_name) {
      return `${state.profile.first_name} ${state.profile.last_name}`
    }
    if (state.profile?.username) {
      return state.profile.username
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
      user: ['view_events', 'manage_own_profile'],
      client: ['view_own_events', 'manage_own_profile']
    }

    const userPermissions = permissions[state.profile.role] || []
    return userPermissions.includes('*') || userPermissions.includes(action)
  }

  const getTimeUntilUnblock = (): number => {
    const fingerprint = getClientFingerprint()
    return rateLimiter.getTimeUntilUnblock(fingerprint)
  }

  // =============================================================================
  // PROVIDER VALUE
  // =============================================================================

  const value: AuthContextType = {
    // État
    user: state.user,
    profile: state.profile,
    session: state.session,
    loading: state.loading,
    error: state.error,
    securityMetrics: state.securityMetrics,
    sessionId: state.sessionId,

    // Méthodes existantes (compatibilité)
    signUp,
    signIn,
    signOut,

    // Nouvelles méthodes
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
// HOOKS SPÉCIALISÉS
// =============================================================================

export const useAuthSecurity = () => {
  const { securityMetrics, getTimeUntilUnblock } = useAuth()
  return { securityMetrics, getTimeUntilUnblock }
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