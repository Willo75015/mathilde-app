import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase, handleSupabaseError } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  initialized: boolean
  signUp: (email: string, password: string, userData?: any) => Promise<{ error: string | null; needsConfirmation?: boolean; email?: string }>
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signInWithOtp: (email: string) => Promise<{ error: string | null }>
  signOut: () => Promise<{ error: string | null }>
  resetPassword: (email: string) => Promise<{ error: string | null }>
  resendConfirmationEmail: (email: string) => Promise<{ error: string | null }>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(false)
  const [initialized, setInitialized] = useState(false)

  // 🔥 PATTERN SUPABASE 2025 - Session Initialization optimisée
  const initializeAuth = useCallback(async () => {
    try {
      setLoading(true)
      
      // Récupération session initiale
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Erreur lors de la récupération de la session:', error)
        // On continue même en cas d'erreur pour éviter de bloquer l'app
      }
      
      setSession(session)
      setUser(session?.user ?? null)
      
    } catch (error) {
      console.error('Erreur inattendue lors de l\'initialisation auth:', error)
    } finally {
      setLoading(false)
      setInitialized(true)
    }
  }, [])

  // 🔥 PATTERN SUPABASE 2025 - onAuthStateChange optimisé avec cleanup
  useEffect(() => {
    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth state change:', event, session?.user?.id)
        
        // Optimisation : pas de re-render inutile si session identique
        setSession(prevSession => {
          if (prevSession?.access_token === session?.access_token) {
            return prevSession
          }
          return session
        })
        
        setUser(session?.user ?? null)
        setLoading(false)
        
        // Invalidation cache si déconnexion
        if (event === 'SIGNED_OUT') {
          // Clear localStorage ou autres caches si nécessaire
          localStorage.removeItem('mathilde-cache')
        }
        
        // Auto-refresh token avant expiration
        if (event === 'TOKEN_REFRESHED') {
          console.log('✅ Token refreshed successfully')
        }
        
        // Marquer comme initialisé après le premier event
        if (!initialized) {
          setInitialized(true)
        }
      }
    )

    // 🔥 CLEANUP PATTERN - Unsubscribe proper
    return () => {
      subscription.unsubscribe()
    }
  }, [initializeAuth, initialized])

  // 🔥 PATTERN 2025 - Refresh session manuel
  const refreshSession = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession()
      if (error) throw error
      console.log('🔄 Session refreshed manually')
    } catch (error) {
      console.error('Erreur refresh session:', error)
    }
  }, [])

  // 🔥 PATTERN 2025 - Inscription avec error handling robuste
  const signUp = useCallback(async (email: string, password: string, userData: any = {}) => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            first_name: userData.firstName || 'Utilisateur',
            last_name: userData.lastName || 'Inconnu',
            role: userData.role || 'florist',
            ...userData
          }
        }
      })
      
      if (error) {
        return { error: handleSupabaseError(error) }
      }
      
      // Gestion confirmation email moderne
      if (data.user && !data.session) {
        return { error: null, needsConfirmation: true, email }
      }
      
      return { error: null, needsConfirmation: false }
    } catch (error) {
      return { error: handleSupabaseError(error) }
    } finally {
      setLoading(false)
    }
  }, [])

  // 🔥 PATTERN 2025 - Connexion optimisée  
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true)
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) {
        return { error: handleSupabaseError(error) }
      }
      
      return { error: null }
    } catch (error) {
      return { error: handleSupabaseError(error) }
    } finally {
      setLoading(false)
    }
  }, [])

  // 🔥 PATTERN 2025 - Magic Link moderne
  const signInWithOtp = useCallback(async (email: string) => {
    try {
      setLoading(true)
      
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })
      
      if (error) {
        return { error: handleSupabaseError(error) }
      }
      
      return { error: null }
    } catch (error) {
      return { error: handleSupabaseError(error) }
    } finally {
      setLoading(false)
    }
  }, [])

  // 🔥 PATTERN 2025 - Déconnexion avec cleanup
  const signOut = useCallback(async () => {
    try {
      setLoading(true)
      
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        return { error: handleSupabaseError(error) }
      }
      
      // Cleanup manuel additionnel
      setUser(null)
      setSession(null)
      
      return { error: null }
    } catch (error) {
      return { error: handleSupabaseError(error) }
    } finally {
      setLoading(false)
    }
  }, [])

  // 🔥 PATTERN 2025 - Reset password moderne
  const resetPassword = useCallback(async (email: string) => {
    try {
      setLoading(true)
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })
      
      if (error) {
        return { error: handleSupabaseError(error) }
      }
      
      return { error: null }
    } catch (error) {
      return { error: handleSupabaseError(error) }
    } finally {
      setLoading(false)
    }
  }, [])

  // 🔥 PATTERN 2025 - Resend confirmation moderne
  const resendConfirmationEmail = useCallback(async (email: string) => {
    try {
      setLoading(true)
      
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })
      
      if (error) {
        return { error: handleSupabaseError(error) }
      }
      
      return { error: null }
    } catch (error) {
      return { error: handleSupabaseError(error) }
    } finally {
      setLoading(false)
    }
  }, [])

  const value = {
    user,
    session,
    loading,
    initialized,
    signUp,
    signIn,
    signInWithOtp,
    signOut,
    resetPassword,
    resendConfirmationEmail,
    refreshSession
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// 🔥 PATTERN 2025 - Hook principal optimisé
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// 🔥 PATTERN 2025 - Hook protection route
export const useRequireAuth = () => {
  const { user, loading, initialized } = useAuth()
  
  return {
    user,
    loading,
    initialized,
    isAuthenticated: !!user && initialized,
    isLoading: loading || !initialized
  }
}

// 🔥 NOUVEAU - Hook session info
export const useSession = () => {
  const { session, user, initialized } = useAuth()
  
  return {
    session,
    user,
    initialized,
    isValid: !!session && !!user,
    isExpired: session ? new Date(session.expires_at * 1000) < new Date() : false,
    expiresAt: session?.expires_at ? new Date(session.expires_at * 1000) : null
  }
}
