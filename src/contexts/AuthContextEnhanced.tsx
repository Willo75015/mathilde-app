import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

// =============================================================================
// TYPES
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

interface AuthState {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  loading: boolean
  error: string | null
}

interface AuthContextType extends AuthState {
  // Méthodes d'authentification existantes (compatibilité)
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  
  // Nouvelles méthodes étendues
  signUpWithProfile: (data: {
    email: string
    password: string
    firstName?: string
    lastName?: string
    username?: string
  }) => Promise<{ error: AuthError | null }>
  
  signInWithOAuth: (provider: 'google' | 'github' | 'discord') => Promise<{ error: AuthError | null }>
  signInWithMagicLink: (email: string) => Promise<{ error: AuthError | null }>
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>
  updatePassword: (password: string) => Promise<{ error: AuthError | null }>
  
  // Gestion du profil
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: Error | null }>
  refreshProfile: () => Promise<void>
  
  // Utilitaires
  clearError: () => void
  isRole: (role: UserProfile['role']) => boolean
  getDisplayName: () => string
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
    error: null
  })

  // =============================================================================
  // HELPERS
  // =============================================================================

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error, loading: false }))
  }, [])

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  // Récupérer le profil utilisateur
  const fetchProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.warn('Erreur récupération profil:', error)
        return null
      }

      return data as UserProfile
    } catch (error) {
      console.error('Erreur fetch profil:', error)
      return null
    }
  }, [])

  // Mettre à jour la date de dernière connexion
  const updateLastLogin = useCallback(async (userId: string) => {
    try {
      await supabase.rpc('update_last_login', { user_uuid: userId })
    } catch (error) {
      console.warn('Erreur mise à jour last_login:', error)
    }
  }, [])

  // =============================================================================
  // EFFECTS
  // =============================================================================

  useEffect(() => {
    let mounted = true

    // Récupérer la session initiale
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (!mounted) return

        if (error) {
          console.error('Session error:', error)
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
            
            // Mettre à jour last_login en arrière-plan
            updateLastLogin(session.user.id)
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
          console.error('Erreur initialisation auth:', error)
          setError('Erreur d\'initialisation de l\'authentification')
        }
      }
    }

    getInitialSession()

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        console.log('Auth state change:', event, session?.user?.email)

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

            // Mettre à jour last_login pour les connexions
            if (event === 'SIGNED_IN') {
              updateLastLogin(session.user.id)
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
          }
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [fetchProfile, updateLastLogin, setError])

  // =============================================================================
  // MÉTHODES D'AUTHENTIFICATION (compatibilité existante)
  // =============================================================================

  const signUp = async (email: string, password: string) => {
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
        setError(error.message)
        return { error }
      }
      
      return { error: null }
    } catch (error) {
      const err = error as Error
      setError(err.message)
      return { error: err }
    }
  }

  const signIn = async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) {
        setError(error.message)
        return { error }
      }
      
      return { error: null }
    } catch (error) {
      const err = error as Error
      setError(err.message)
      return { error: err }
    }
  }

  const signOut = async (): Promise<void> => {
    setState(prev => ({ ...prev, loading: true }))
    await supabase.auth.signOut()
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
        setError(error.message)
        return { error }
      }
      
      return { error: null }
    } catch (error) {
      const err = error as AuthError
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
        setError(error.message)
        return { error }
      }
      
      return { error: null }
    } catch (error) {
      const err = error as AuthError
      setError(err.message)
      return { error: err }
    }
  }

  const signInWithMagicLink = async (email: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })
      
      if (error) {
        setError(error.message)
        return { error }
      }
      
      setState(prev => ({ ...prev, loading: false }))
      return { error: null }
    } catch (error) {
      const err = error as AuthError
      setError(err.message)
      return { error: err }
    }
  }

  const resetPassword = async (email: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })
      
      if (error) {
        setError(error.message)
        return { error }
      }
      
      setState(prev => ({ ...prev, loading: false }))
      return { error: null }
    } catch (error) {
      const err = error as AuthError
      setError(err.message)
      return { error: err }
    }
  }

  const updatePassword = async (password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const { error } = await supabase.auth.updateUser({ password })
      
      if (error) {
        setError(error.message)
        return { error }
      }
      
      setState(prev => ({ ...prev, loading: false }))
      return { error: null }
    } catch (error) {
      const err = error as AuthError
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
        setError(error.message)
        return { error: new Error(error.message) }
      }

      // Rafraîchir le profil local
      const updatedProfile = await fetchProfile(state.user.id)
      setState(prev => ({
        ...prev,
        profile: updatedProfile,
        loading: false
      }))

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

    // Gestion profil
    updateProfile,
    refreshProfile,

    // Utilitaires
    clearError,
    isRole,
    getDisplayName
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
